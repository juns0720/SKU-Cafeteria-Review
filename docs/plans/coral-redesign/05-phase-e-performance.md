# Phase E — 버그 수정 · 성능 · PWA

> **역할**: Phase E 전체 단위 실행 명세. 진행 상태는 [`99-progress.md`](./99-progress.md).
> **독립성**: 각 단위는 순서대로 진행하되, E-3 FE 성능은 E-2 DB 최적화와 병행 가능.

---

## 배경 — 성능 진단 결과

Render 콜드스타트는 cron job(PERF-T1)으로 해결 완료. 잔여 지연 원인은 DB 레이어에 집중.

| 병목 | 원인 | 심각도 |
|---|---|---|
| 리뷰 조회 시 풀 스캔 | `reviews.menu_id` 인덱스 없음 (FK는 인덱스 자동 생성 안 함) | 🔴 심각 |
| 리뷰 목록 N+1 | `findByMenuId()` 후 `review.getUser().getNickname()` LAZY 로드 per row | 🔴 심각 |
| 내 리뷰 목록 N+1 | `findByUserId()` 후 `review.getMenu().getName()` LAZY 로드 per row | 🟠 나쁨 |
| `recomputeMenuStats()` 과다 쿼리 | `aggregateByMenuId()` 후 불필요한 `findById()` 수행 | 🟠 나쁨 |
| HikariCP 기본값 | `maximum-pool-size: 10` — Supabase 무료 연결 한도 초과 위험 | 🟡 경미 |
| `RestTemplate` timeout 없음 | Google OAuth2 tokeninfo 호출 hung 가능성 | 🟡 경미 |

> **확인된 사항**: `reviews.user_id` 는 UNIQUE `(user_id, menu_id)` prefix 커버. `menu_dates.menu_id` 는 UNIQUE `(menu_id, served_date, meal_slot)` prefix 커버. 추가 인덱스 불필요.

---

## BUG-T1 · 닉네임 쿨다운 UX 개선

**파일**:
- `frontend/src/pages/ProfilePage.jsx`
- `frontend/src/components/coral/NicknameSetupModal.jsx`

### ProfilePage — 닉네임 수정 버튼 잠금

`GET /auth/me` 응답의 `nicknameChangedAt` 필드를 활용한다. BE 로직은 정상(30일 쿨다운), FE에 잠금 표시만 추가.

```jsx
// nicknameChangedAt이 있으면 남은 일수 계산
const remainingDays = (() => {
  if (!user?.nicknameChangedAt) return 0
  const changedAt = new Date(user.nicknameChangedAt)
  const unlockAt  = new Date(changedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
  const diff      = Math.ceil((unlockAt - Date.now()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
})()
const canChangeNickname = remainingDays === 0
```

닉네임 옆 ✎ 버튼:
- `canChangeNickname` true → 기존 동작 (닉네임 변경 다이얼로그)
- `canChangeNickname` false → 버튼 비활성 + `"${remainingDays}일 후 변경 가능"` 캡션 표시

### NicknameSetupModal — nextChangeAt 안내

API 응답이 409 `{ nextChangeAt }` 을 반환하는 경우(최초 설정이 아닌 재진입):

```jsx
// 409 에러 처리
const nextAt = new Date(error.response?.data?.nextChangeAt)
const days   = Math.ceil((nextAt - Date.now()) / (1000 * 60 * 60 * 24))
showToast(`${days}일 후에 변경할 수 있어요`, 'error')
```

### 검증
- 최초 로그인(nicknameChangedAt=null) → 버튼 활성
- 닉네임 변경 직후 → 버튼 비활성 + "30일 후 변경 가능"
- 15일 경과 mock → "15일 후 변경 가능"
- 30일 이후 → 버튼 다시 활성

**소요**: 1시간 / **위험**: 낮음

---

## DB-T1 · Flyway V17 — reviews.menu_id 인덱스

**파일**: `backend/src/main/resources/db/migration/V17__add_reviews_menu_index.sql` (신규)

```sql
-- reviews.menu_id: FK지만 PostgreSQL은 FK에 인덱스를 자동 생성하지 않는다.
-- findByMenuId, aggregateByMenuId, countGroupByUserIdIn 등에서 사용.
CREATE INDEX IF NOT EXISTS idx_reviews_menu_id
    ON reviews (menu_id);
```

> `reviews.user_id`: UNIQUE `(user_id, menu_id)` 의 prefix — 이미 인덱스 존재, 추가 불필요.
> `menu_dates.menu_id`: UNIQUE `(menu_id, served_date, meal_slot)` prefix — 이미 커버.

### 검증
- `./gradlew bootRun` → Flyway 로그 `V17__add_reviews_menu_index.sql ... SUCCESS`
- Supabase 대시보드 → Database → Tables → reviews → Indexes → `idx_reviews_menu_id` 확인

**소요**: 20분 / **위험**: 낮음 (DDL 전용, 롤백 가능)

---

## DB-T2 · getReviews() N+1 제거

**파일**: `backend/src/main/java/com/sungkyul/cafeteria/review/repository/ReviewRepository.java`
**파일**: `backend/src/main/java/com/sungkyul/cafeteria/review/service/ReviewService.java`

### 문제

`findByMenuId(menuId, pageable)` → `Page<Review>` 반환 후 `toResponse()` 내
`review.getUser().getNickname()` / `.getProfileImage()` 호출 시 LAZY 로드 발생.
페이지 size=10 기준 최대 10번의 추가 SELECT.

### ReviewRepository 수정

기존 파생 메서드 `findByMenuId` 대신 명시적 @Query 추가:

```java
/** 메뉴별 리뷰 목록 — User JOIN FETCH로 N+1 방지 */
@Query(
    value      = "SELECT r FROM Review r JOIN FETCH r.user WHERE r.menu.id = :menuId",
    countQuery = "SELECT COUNT(r) FROM Review r WHERE r.menu.id = :menuId"
)
Page<Review> findByMenuIdWithUser(@Param("menuId") Long menuId, Pageable pageable);
```

> `countQuery` 분리 필수: Spring Data JPA 자동 생성 count 쿼리가 JOIN FETCH를 포함하면 오동작.

### ReviewService 수정 (L40)

```java
// Before
Page<Review> reviewPage = reviewRepository.findByMenuId(menuId, pageable);

// After
Page<Review> reviewPage = reviewRepository.findByMenuIdWithUser(menuId, pageable);
```

---

### 추가: getMyReviews() N+1 제거

`findByUserIdOrderByCreatedAtDesc(userId)` 후 `toResponse()` 내
`review.getMenu().getName()` 호출 시 Menu LAZY 로드 per row 발생.

**ReviewRepository 수정**:

```java
/** 사용자별 리뷰 목록 — Menu JOIN FETCH로 N+1 방지 */
@Query("""
    SELECT r FROM Review r
    JOIN FETCH r.menu
    WHERE r.user.id = :userId
    ORDER BY r.createdAt DESC
    """)
List<Review> findByUserIdWithMenuOrderByCreatedAtDesc(@Param("userId") Long userId);
```

**ReviewService 수정 (L83)**:

```java
// Before
List<Review> reviews = reviewRepository.findByUserIdOrderByCreatedAtDesc(userId);

// After
List<Review> reviews = reviewRepository.findByUserIdWithMenuOrderByCreatedAtDesc(userId);
```

### 검증
- `./gradlew test` 전체 통과
- dev 환경 `show-sql: true` 상태에서 `GET /api/v1/reviews?menuId=1&size=10` 호출
  - 기존: SELECT review × 1 + SELECT user × N
  - 변경 후: SELECT review JOIN user × 1 + SELECT count × 1 = 쿼리 2개
- `GET /api/v1/reviews/me` — 기존 N+1 → SELECT review JOIN menu × 1

**소요**: 1시간 / **위험**: 낮음 (읽기 전용 변경, 테스트로 검증)

---

## DB-T3 · recomputeMenuStats() 최적화

**파일**: `backend/src/main/java/com/sungkyul/cafeteria/menu/repository/MenuRepository.java`
**파일**: `backend/src/main/java/com/sungkyul/cafeteria/review/service/ReviewService.java`

### 문제

현재 `recomputeMenuStats()` (ReviewService L134):

```java
private void recomputeMenuStats(Long menuId) {
    MenuStatAgg agg = reviewRepository.aggregateByMenuId(menuId); // SELECT 1
    Menu menu = menuRepository.findById(menuId).orElseThrow();     // SELECT 2 (불필요)
    menu.applyStats(agg.avgT(), agg.avgA(), agg.avgV(), agg.count()); // dirty-check UPDATE
}
```

리뷰 작성/수정/삭제마다 3 DB operations. `findById` → `applyStats` → dirty-check UPDATE를 단일 `@Modifying UPDATE`로 대체.

### MenuRepository 수정

```java
/** 집계 캐시 직접 UPDATE — findById + dirty-check 대체 */
@Modifying(clearAutomatically = true)
@Query("""
    UPDATE Menu m SET
        m.avgTaste    = :avgT,
        m.avgAmount   = :avgA,
        m.avgValue    = :avgV,
        m.avgOverall  = :avgO,
        m.reviewCount = :cnt
    WHERE m.id = :menuId
    """)
int updateStats(
    @Param("menuId") Long   menuId,
    @Param("avgT")   double avgT,
    @Param("avgA")   double avgA,
    @Param("avgV")   double avgV,
    @Param("avgO")   double avgO,
    @Param("cnt")    long   cnt
);
```

> `clearAutomatically = true`: JPQL UPDATE 후 1st-level 캐시를 비워 이후 조회 시 최신값 반환.

### ReviewService 수정 (L134)

```java
private void recomputeMenuStats(Long menuId) {
    MenuStatAgg agg  = reviewRepository.aggregateByMenuId(menuId); // SELECT 1
    double      avgO = (agg.avgT() + agg.avgA() + agg.avgV()) / 3.0;
    menuRepository.updateStats(menuId, agg.avgT(), agg.avgA(), agg.avgV(), avgO, agg.count()); // UPDATE 1
}
```

### 검증
- `./gradlew test` 전체 통과
- 리뷰 POST 후 `GET /menus/{id}` 응답의 `avgTaste/avgAmount/avgValue/avgOverall/reviewCount` 값 검증
- SQL 로그에서 집계 SELECT + UPDATE 2개만 발생하는지 확인 (기존 3개 → 2개)

**소요**: 1시간 / **위험**: 낮음 (`@Transactional` 내 동작, 테스트로 검증)

---

## DB-T4 · HikariCP 설정 + RestTemplate timeout

**파일**: `backend/src/main/resources/application-prod.yml`
**파일**: `backend/src/main/java/com/sungkyul/cafeteria/common/config/AppConfig.java`

### application-prod.yml 수정

`spring.datasource` 아래에 `hikari` 블록 추가:

```yaml
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 5      # 기본 10 → 5 (Supabase 무료 Direct 연결 한도 배려)
      minimum-idle: 2
      connection-timeout: 20000 # 20초 (기본 30초)
      idle-timeout: 300000      # 5분 (기본 10분 → 무료 연결 조기 반환)
      max-lifetime: 600000      # 10분
```

### AppConfig.java 수정

```java
import org.springframework.http.client.SimpleClientHttpRequestFactory;

@Bean
public RestTemplate restTemplate() {
    var factory = new SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(5_000);  // 5초 — Google tokeninfo 연결
    factory.setReadTimeout(10_000);    // 10초 — Google tokeninfo 응답
    return new RestTemplate(factory);
}
```

### 검증
- `./gradlew bootRun` (dev 환경) → 로그 `HikariPool-1 - Pool stats (total=5, ...` 확인
- 로그인 플로우 정상 동작 확인 (RestTemplate 변경 후 Google 토큰 검증 정상)

**소요**: 30분 / **위험**: 낮음 (설정 변경, 로컬 검증 후 배포)

---

## FE-T1 · Axios timeout + React Query 설정

**파일**: `frontend/src/api/client.js`
**파일**: `frontend/src/App.jsx`

### client.js

```js
const client = axios.create({
  baseURL: normalizedBaseUrl,
  timeout: 30000,   // 추가 — 30초 후 ERR_CANCELED
})
```

### App.jsx

```js
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,               // 1 → 2 (네트워크 일시 오류 대응)
      staleTime: 1000 * 60,   // 그대로
      gcTime: 1000 * 60 * 5,  // 명시 (기본값과 동일, 가독성 목적)
    },
  },
})
```

### 검증
- Network 탭에서 잘못된 URL 설정 후 30s 대기 → `ERR_CANCELED` 확인
- React Query DevTools → 캐시 항목 gcTime 5분 확인

**소요**: 30분 / **위험**: 낮음

---

## FE-T2 · Vite manualChunks + React.lazy 라우트 분할

**파일**: `frontend/vite.config.js`
**파일**: `frontend/src/App.jsx`

### vite.config.js

```js
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-query':  ['@tanstack/react-query'],
          'vendor-google': ['@react-oauth/google'],
        },
      },
    },
  },
  server:  { headers: popupHeaders },
  preview: { headers: popupHeaders },
})
```

### App.jsx — 페이지 lazy import

상단 import를 `lazy()` 로 교체:

```js
import { lazy, Suspense } from 'react'

const HomePage          = lazy(() => import('./pages/HomePage'))
const WeeklyPage        = lazy(() => import('./pages/WeeklyPage'))
const AllMenusPage      = lazy(() => import('./pages/AllMenusPage'))
const MenuDetailPage    = lazy(() => import('./pages/MenuDetailPage'))
const ReviewWritePage   = lazy(() => import('./pages/ReviewWritePage'))
const ProfilePage       = lazy(() => import('./pages/ProfilePage'))
const LoginPage         = lazy(() => import('./pages/LoginPage'))
const DevComponentsPage = lazy(() => import('./pages/DevComponentsPage'))
```

`<Routes>` 를 `<Suspense>` 로 감싸기:

```jsx
<Suspense fallback={<div className="min-h-screen bg-white" />}>
  <Routes>
    {/* 기존 Route 목록 그대로 */}
  </Routes>
</Suspense>
```

> `NicknameSetupModal` / `Tab` 은 App 레벨에서 직접 사용하므로 lazy 불필요.

### 검증
- `npm run build` → `dist/assets/` 에서 `vendor-react-*.js`, `vendor-query-*.js`, `vendor-google-*.js` 청크 확인
- 초기 `index-*.js` 크기 감소 확인

**소요**: 1시간 / **위험**: 낮음 (빌드 검증으로 안전 확인)

---

## FE-T3 · preconnect 힌트 추가

**파일**: `frontend/index.html`

```html
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <!-- 추가: Pretendard CDN 사전 연결 -->
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
  <link rel="stylesheet" as="style" crossorigin
        href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>성결 학식</title>
</head>
```

### 검증
- DevTools → Network → `pretendardvariable*.css` → Timing 탭 → Stalled/DNS/Connect 시간 감소

**소요**: 10분 / **위험**: 없음

---

## PWA-T1 · PWA 설정

**파일**: `frontend/package.json` (dev dependency 추가)
**파일**: `frontend/vite.config.js`
**파일**: `frontend/public/` (아이콘 파일)

### 설치

```bash
npm install -D vite-plugin-pwa
```

### vite.config.js 추가 (FE-T2 완료 후 병합)

```js
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '성결 학식',
        short_name: '성결 학식',
        theme_color: '#FF6B5C',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/sku-cafeteria-n\.onrender\.com\/api/,
            handler: 'NetworkOnly',   // API는 캐시 안 함
          },
        ],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],  // 정적 에셋 Cache First
      },
    }),
  ],
  // ...
})
```

### 아이콘 파일
- `frontend/public/icon-192.png` (192×192, 코랄 배경 + 로고)
- `frontend/public/icon-512.png` (512×512)

### 검증
- `npm run build` → `dist/sw.js`, `dist/manifest.webmanifest` 생성 확인
- Chrome DevTools → Application → Manifest 탭 → 아이콘·이름·theme_color 확인
- Application → Service Workers → `sw.js` 활성 확인

**소요**: 2시간 / **위험**: 낮음

---

## 실행 순서

```
1단계 — DB (효과 즉각, 위험 낮음)
  DB-T1 → DB-T2 → DB-T3 → DB-T4

2단계 — FE (독립적, 병행 가능)
  FE-T1 → FE-T2 → FE-T3

3단계 — PWA (FE-T2 완료 후)
  PWA-T1

버그 수정 (독립적, 언제든 가능)
  BUG-T1
```

---

## Phase E-5 · Render/Supabase 후속 성능 계측

> **배경**: Render region을 Singapore로 옮긴 뒤 큰 지연은 완화됐다. 남은 딜레이는 Render Free 오버헤드, Render-Supabase 네트워크 왕복, DB connection warm 상태, 프론트 재요청, 캐싱/압축 여부를 분리해서 봐야 한다.
> **원칙**: `/api/v1/home` 통합, 복합 인덱스 추가, 5분 캐싱처럼 영향 범위가 있는 작업은 계측 결과가 있을 때만 진행한다.

---

## PERF-R1 · RequestTimingFilter 계측

**목표**: 브라우저 전체 대기 시간과 Spring 내부 처리 시간을 분리한다.

**파일**:
- `backend/src/main/java/com/sungkyul/cafeteria/common/filter/RequestTimingFilter.java` (신규)

### 작업

- `OncePerRequestFilter` 기반 필터를 추가한다.
- 모든 요청 처리 후 `X-Response-Time-ms` 헤더를 설정한다.
- 로그 형식은 아래처럼 통일한다.

```text
[REQ] method=GET uri=/api/v1/menus status=200 elapsed=42ms
```

### 검증

```bash
curl -i -s https://<render-host>/api/v1/menus | grep -i "x-response-time"
```

판단 기준:
- `curl total`은 긴데 `X-Response-Time-ms`가 짧음 → 네트워크/Render 플랫폼 오버헤드 우선
- `X-Response-Time-ms`도 김 → API 내부, DB, DTO 변환, 직렬화 확인

---

## PERF-R2 · `/api/v1/ping-db` keep-alive

**목표**: Render 인스턴스뿐 아니라 DB connection까지 warm 상태에 가깝게 유지한다.

**파일**:
- `backend/src/main/java/com/sungkyul/cafeteria/common/controller/PingController.java` (신규)
- `backend/src/main/java/com/sungkyul/cafeteria/common/config/SecurityConfig.java`
- `.github/workflows/keep-alive.yml` (없으면 신규)

### 작업

- `GET /api/v1/ping-db`를 추가한다.
- 내부에서는 `JdbcTemplate.queryForObject("select 1", Integer.class)`만 수행한다.
- 응답은 `200 OK`와 `"ok"` 또는 `{ "status": "ok" }`처럼 비민감 정보만 반환한다.
- `SecurityConfig`에서 `GET /api/v1/ping-db`를 `permitAll`로 연다.
- 기존 keep-alive가 `/api/v1/health`를 호출하고 있다면 `/api/v1/ping-db`로 바꾼다.

### 검증

```bash
curl -w "\nTOTAL: %{time_total}s\n" -o /dev/null -s https://<render-host>/api/v1/ping-db
```

---

## PERF-R3 · HikariCP prod 재조정

**목표**: 무료 Supabase 연결 수를 과하게 잡지 않으면서 idle connection 1개를 warm 상태로 유지한다.

**파일**:
- `backend/src/main/resources/application-prod.yml`

### 적용값

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 3
      minimum-idle: 1
      connection-timeout: 3000
      idle-timeout: 60000
      max-lifetime: 600000
      keepalive-time: 300000
```

`RestTemplate` timeout은 이미 적용되어 있으므로 유지한다.

### 검증

- Render 로그에서 Hikari pool 초기화 오류가 없는지 확인
- `/api/v1/ping-db`, `/api/v1/menus`, `/api/v1/reviews?menuId=...` 반복 호출 시 connection timeout이 발생하지 않는지 확인

---

## PERF-R4 · React Query/axios 요청 정책 조정

**목표**: 실패 요청의 체감 대기 시간을 줄이고, 페이지 이동/복귀 시 불필요한 조회를 줄인다.

**파일**:
- `frontend/src/api/client.js`
- `frontend/src/App.jsx`
- `frontend/src/pages/HomePage.jsx`
- `frontend/src/pages/WeeklyPage.jsx`
- `frontend/src/pages/AllMenusPage.jsx`
- `frontend/src/pages/MenuDetailPage.jsx`
- `frontend/src/pages/ProfilePage.jsx`
- `frontend/src/pages/ReviewWritePage.jsx`

### 작업

- axios timeout을 `30000`에서 `8000`으로 낮춘다.
- 전역 query retry를 `2`에서 `1`로 낮춘다.
- mutation은 명시적으로 `retry: 0`을 둔다.
- staleTime 기준:

| Query | staleTime |
|---|---:|
| `menus/today`, `menus/weekly`, `menus/best`, `menus/all`, `menus/corners`, `menus/:id` | 5분 |
| `reviews/:menuId` | 30초 |
| `reviews/me` | 1분 |
| `auth/me` | 1분 유지 |

### 검증

- 첫 진입 후 탭 이동/복귀 시 메뉴 API가 staleTime 안에서 반복 호출되지 않는지 Network 탭으로 확인
- 리뷰 작성/수정/삭제 후 `menus`, 해당 `reviews`, `reviews/me`, `auth/me`만 갱신되는지 확인

---

## PERF-R5 · `/api/v1/menus` Cache-Control

**목표**: 모든 사용자에게 같은 메뉴 목록 API의 반복 왕복 비용을 줄인다.

**파일**:
- `backend/src/main/java/com/sungkyul/cafeteria/menu/controller/MenuController.java`

### 작업

- 1차 적용 대상은 `GET /api/v1/menus`만으로 제한한다.
- 헤더는 `Cache-Control: public, max-age=30`으로 시작한다.
- 5분 캐싱은 리뷰 작성 직후 평균/리뷰 수 반영 지연을 확인한 뒤 결정한다.

### 이번 범위에서 제외

- `GET /api/v1/reviews`: `isMine`이 인증 사용자별로 달라질 수 있어 public cache 금지
- `auth/me`, `reviews/me`: 사용자별 응답이므로 public cache 금지
- `menus/today`, `menus/weekly`, `menus/best`, `menus/corners`, `menus/{id}`: 후속 확장 후보

### 검증

```bash
curl -I https://<render-host>/api/v1/menus
```

---

## PERF-R6 · Spring response compression

**목표**: JSON 응답이 1KB 이상일 때 전송 크기를 줄인다.

**파일**:
- `backend/src/main/resources/application-prod.yml`

### 적용값

```yaml
server:
  compression:
    enabled: true
    mime-types: application/json,text/html,text/xml,text/plain,text/css,application/javascript
    min-response-size: 1024
```

### 검증

```bash
curl -H "Accept-Encoding: gzip" -I https://<render-host>/api/v1/menus
```

---

## PERF-R7 · Supabase `pg_stat_statements` 확인

**목표**: 인덱스/쿼리 변경 전에 운영 DB에서 실제 느린 쿼리를 확인한다.

**기록 문서**: [`perf-r7-pg-stat-statements.md`](./perf-r7-pg-stat-statements.md)

### 느린 쿼리

```sql
select
  calls,
  round(total_exec_time::numeric, 2) as total_ms,
  round(mean_exec_time::numeric, 2) as mean_ms,
  rows,
  query
from pg_stat_statements
order by mean_exec_time desc
limit 20;
```

### 호출 많은 쿼리

```sql
select
  calls,
  round(total_exec_time::numeric, 2) as total_ms,
  round(mean_exec_time::numeric, 2) as mean_ms,
  rows,
  query
from pg_stat_statements
order by calls desc
limit 20;
```

### 기록할 것

- 평균 실행 시간이 긴 쿼리
- 호출 수가 과한 쿼리
- `reviews` 최신순 조회가 정렬 비용을 유발하는지
- `auth/me`가 초기 진입마다 병목인지

---

## PERF-R8 · `reviews(menu_id, created_at DESC)` 복합 인덱스 판단

**목표**: 리뷰 목록 최신순 페이지네이션이 실제 병목일 때만 인덱스를 추가한다.

**현재 상태**:
- `V17__add_reviews_menu_index.sql`에 `reviews(menu_id)` 단일 인덱스가 있음.

### 적용 조건

- `GET /api/v1/reviews?menuId=...`가 느림
- 쿼리 패턴이 `where menu_id = ? order by created_at desc limit ?`
- `pg_stat_statements` 또는 `EXPLAIN`에서 정렬 비용이 확인됨

### 필요 시 추가할 Flyway

```sql
CREATE INDEX IF NOT EXISTS idx_reviews_menu_created_at
    ON reviews (menu_id, created_at DESC);
```

적용 파일: `backend/src/main/resources/db/migration/V18__add_reviews_menu_created_at_index.sql`

단일 인덱스 제거는 이번 범위에서 하지 않는다. 운영 안정성을 위해 먼저 복합 인덱스 추가 후 중복 인덱스 정리는 별도 후속으로 둔다.

---

## PERF-R9 · 홈 API 통합 판단

**목표**: 초기 화면의 API 왕복 수가 실제 병목일 때만 `GET /api/v1/home`을 만든다.

**적용 결과**:
- `HomePage`의 홈 데이터 API를 `GET /api/v1/home`으로 통합한다.
- 응답은 `today`와 `bestMenus`만 포함한다.
- `auth/me`는 닉네임 모달/인증 상태와 연결된 사용자별 응답이므로 기존 `useAuth` 흐름에 남긴다.

### 구현 파일

- `backend/src/main/java/com/sungkyul/cafeteria/home/controller/HomeController.java`
- `backend/src/main/java/com/sungkyul/cafeteria/home/service/HomeService.java`
- `backend/src/main/java/com/sungkyul/cafeteria/home/dto/HomeResponse.java`
- `frontend/src/api/home.js`
- `frontend/src/pages/HomePage.jsx`

### 응답 원칙

- `GET /api/v1/home`은 홈 화면 전용 DTO만 반환한다.
- 리뷰 목록, 대용량 통계, 사용자 민감 정보는 포함하지 않는다.
- public menu 데이터 조합이므로 30초 public cache를 적용한다.

---

## E-5 실행 순서

```
1단계 — 계측
  PERF-R1 → 배포 후 curl total/X-Response-Time-ms 비교

2단계 — warm/connection
  PERF-R2 → PERF-R3

3단계 — 요청 수와 전송량 감소
  PERF-R4 → PERF-R5 → PERF-R6

4단계 — DB 근거 확인
  PERF-R7 → PERF-R8

5단계 — 조건부 구조 변경
  PERF-R9 → HomePage today/best API를 /api/v1/home으로 통합
```

---

## Phase E-6 · perform.md 후속 (실데이터 warmup + URL 정합)

> 진행 상황: `99-progress.md` E-6 섹션.  
> 상세 설계 근거: `~/.claude/plans/perform-md-robust-wadler.md`

E-5에서 계측·압축·HikariCP·홈 통합을 완료한 뒤에도 "새로운 데이터 최초 로딩 지연"이 남아 있는 경우, Hibernate metadata·JIT-compiled 쿼리 plan이 첫 사용자 요청에서야 컴파일되는 cold-path 비용이 원인일 가능성이 높다. E-6는 이 문제를 `/api/v1/warmup`으로 직접 해결하고, 운영 URL 정합 + 쿼리 최적화 후속으로 마무리한다.

### 단위 목록

| ID | 내용 | 상태 |
|---|---|---|
| PERF-R14 | 운영 URL stale 참조 정리 (CLAUDE.md / AGENTS.md / vite.config.js / render.yaml) | 완료 |
| PERF-R10 | `/api/v1/warmup` 엔드포인트 신설 — DB + 오늘 메뉴 + best + 최근 리뷰 10건 fail-soft | 완료 |
| PERF-R11 | keep-alive.yml — URL 교정 + `/api/v1/warmup` 호출 추가 | 완료 |
| PERF-R15 | 검증 명령어 문서화 + before/after 측정 양식 | 완료 |
| PERF-R13 | Flyway V19 — `reviews(user_id, created_at DESC)` 복합 인덱스 | 미완료 |
| PERF-R12 | 메뉴/홈 query에 한해 `refetchOnWindowFocus: false` | 미완료 |

---

## PERF-R10 · `/api/v1/warmup`

**목표**: keep-alive cron 호출 한 번으로 DB 커넥션(PERF-R2)에 더해 Hibernate metadata·JIT 쿼리 plan까지 사전에 데운다.

**파일**:
- `backend/src/main/java/com/sungkyul/cafeteria/common/controller/WarmupController.java` (신규)
- `backend/src/main/java/com/sungkyul/cafeteria/common/config/SecurityConfig.java` (`/api/v1/warmup` permitAll 추가)
- `backend/src/main/java/com/sungkyul/cafeteria/review/repository/ReviewRepository.java` (`findTop10ByOrderByCreatedAtDesc` 추가)

**응답 예시**:

```json
{
  "db": "ok",
  "todayCount": 4,
  "bestCount": 5,
  "recentReviewCount": 10,
  "elapsedMs": 312
}
```

단계별 try/catch로 감싸 fail-soft. 한 단계 실패해도 200 반환, keep-alive cron이 빨갛게 되는 사고 방지.

**금지 대상** (warmup에 포함하면 안 되는 것):
- 전체 리뷰 SELECT, 모든 유저 데이터, Cloudinary 이미지 fetch, 메뉴별 상세 루프

---

## PERF-R11 · keep-alive.yml warmup 호출 추가

**목표**: 기존 ping-db cron에 warmup 호출을 얹어 cold-path까지 10분 간격으로 데운다.

**파일**: `.github/workflows/keep-alive.yml`

```yaml
- name: Ping backend and warm cold-path
  run: |
    BACKEND_URL="${BACKEND_URL:-https://sku-cafeteria-n.onrender.com}"
    # ping-db: 인스턴스 깨우기 + DB 커넥션 keep-alive
    curl -fsS -m 30 "$BACKEND_URL/api/v1/ping-db" || true
    # warmup: 오늘 메뉴 + best + 최근 리뷰를 미리 조회해 Hibernate metadata·쿼리 plan을 데움
    curl -fsS -m 30 "$BACKEND_URL/api/v1/warmup" || true
```

역할 분리:
- `ping-db` — SELECT 1. 인스턴스 sleep 방지 + DB 커넥션 유지
- `warmup` — 실제 도메인 쿼리 pre-compile. 첫 사용자 TTFB 단축

---

## PERF-R15 · 검증 명령어 (before/after 측정)

### 1. curl 상세 시간 측정

**PowerShell (Windows)**:
```powershell
curl.exe -H "Cache-Control: no-cache" `
  -w "`nDNS: %{time_namelookup}s`nCONNECT: %{time_connect}s`nTLS: %{time_appconnect}s`nTTFB: %{time_starttransfer}s`nTOTAL: %{time_total}s`n" `
  -o NUL -s `
  "https://sku-cafeteria-n.onrender.com/api/v1/home?ts=$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
```

**bash/Linux/macOS**:
```bash
curl -H "Cache-Control: no-cache" \
  -w "\nDNS: %{time_namelookup}s\nCONNECT: %{time_connect}s\nTLS: %{time_appconnect}s\nTTFB: %{time_starttransfer}s\nTOTAL: %{time_total}s\n" \
  -o /dev/null -s \
  "https://sku-cafeteria-n.onrender.com/api/v1/home?ts=$(date +%s)"
```

### 2. 서버 내부 처리시간 확인 (RequestTimingFilter)

```bash
# bash
curl -i -s https://sku-cafeteria-n.onrender.com/api/v1/menus | grep -i "x-response-time"

# PowerShell
(curl.exe -i -s https://sku-cafeteria-n.onrender.com/api/v1/menus) -match "x-response-time"
```

판단 기준 (PERF-R1과 동일):
- TTFB가 길고 `X-Response-Time-ms`가 짧다 → 네트워크/Render 플랫폼 오버헤드
- `X-Response-Time-ms`도 길다 → Spring 내부 (DB, Hibernate, DTO 변환)

### 3. warmup / ping-db 개별 응답 확인

```bash
curl -i https://sku-cafeteria-n.onrender.com/api/v1/warmup
curl -i https://sku-cafeteria-n.onrender.com/api/v1/ping-db
```

warmup 연속 호출로 cold vs warm 차이 측정:
```bash
# 첫 번째 — cold 비용
curl -s https://sku-cafeteria-n.onrender.com/api/v1/warmup | python3 -m json.tool
# 즉시 두 번째 — warm 비용
curl -s https://sku-cafeteria-n.onrender.com/api/v1/warmup | python3 -m json.tool
```

`elapsedMs` 첫 호출 > 두 번째 호출이면 warmup이 쿼리 plan을 제대로 캐싱하고 있다는 신호.

### 4. Render 로그 grep

Render 대시보드 → 해당 서비스 → Logs 탭 → 검색:
```
[REQ] uri=/api/v1/warmup
```

`elapsed` 분포를 몇 분 동안 관찰하면 cold-path 비용과 warm 상태를 구분할 수 있다.

### 5. before/after 측정 양식

PERF-R10/R11 배포 전후로 아래 표를 채워서 개선 효과를 기록한다.

| 시점 | 측정 endpoint | TTFB(s) | TOTAL(s) | X-Response-Time(ms) | 비고 |
|---|---|---|---|---|---|
| R10 적용 전 (Render cold) | `/api/v1/home` | | | | keep-alive 멈춘 뒤 15분 후 |
| R10 적용 전 (warm) | `/api/v1/home` | | | | keep-alive 직후 즉시 호출 |
| R10 적용 후 (warmup 직후) | `/api/v1/home` | | | | warmup 완료 30초 내 |
| R10 적용 후 (10분 주기 warm) | `/api/v1/home` | | | | 정상 운영 상태 |

---

## PERF-R13 · `reviews(user_id, created_at DESC)` 복합 인덱스 (Flyway V19)

**목표**: `/reviews/me` 엔드포인트의 `WHERE user_id = ? ORDER BY created_at DESC` 쿼리 풀스캔 방지.

**현재 상태**: `reviews` 테이블에 `user_id` 단독 인덱스 없음. Hibernate가 FK 컬럼을 자동으로 인덱싱하지 않는다.

**파일**: `backend/src/main/resources/db/migration/V19__add_reviews_user_created_at_index.sql` (신규)

```sql
CREATE INDEX IF NOT EXISTS idx_reviews_user_created_at
    ON reviews (user_id, created_at DESC);
```

**검증**:
```sql
-- Supabase Studio 또는 psql
EXPLAIN ANALYZE
SELECT * FROM reviews
WHERE user_id = 1
ORDER BY created_at DESC;
-- → Index Scan using idx_reviews_user_created_at 확인
```

**롤백**: `DROP INDEX idx_reviews_user_created_at;` (Flyway V20으로 관리).

---

## PERF-R12 · `refetchOnWindowFocus: false` (메뉴/홈 query)

**목표**: 사용자가 다른 탭 갔다가 돌아올 때 메뉴 목록을 불필요하게 재요청하는 동작 차단. 메뉴 staleTime은 5분이지만 React Query의 `refetchOnWindowFocus`는 staleTime과 무관하게 동작한다.

**대상** (페이지 단위 query 옵션 추가, 글로벌 defaultOptions 건드리지 않음):

| 파일 | queryKey | refetchOnWindowFocus |
|---|---|---|
| `HomePage.jsx` | `['home', slot]` | false |
| `WeeklyPage.jsx` | `['menus', 'weekly', date]` | false |
| `AllMenusPage.jsx` | `['menus', 'all', ...]`, `['menus', 'corners']` | false |
| `MenuDetailPage.jsx` | `['menus', menuId]` (메뉴만) | false |
| `ReviewWritePage.jsx` | `['menus', menuId]` (메뉴만) | false |

**유지(default true)**: `['reviews', menuId]`, `['reviews', 'me']`, `['auth', 'me']` — 자기 데이터/리뷰는 신선함이 중요.

**검증**: 홈 진입 → 다른 탭 전환 → 돌아오기 → DevTools Network에 `/api/v1/home` 추가 요청 없음. 5분 staleTime 경과 후에는 refetch 발생(정상).
