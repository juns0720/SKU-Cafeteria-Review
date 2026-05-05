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
            urlPattern: /^https:\/\/sku-cafeteria-backend\.onrender\.com\/api/,
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
