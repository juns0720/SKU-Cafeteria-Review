# Render + Supabase + Vercel 배포 성능 최적화 계획서

작성일: 2026-05-05
대상 구조: Vercel Korea 프론트엔드 + Render Singapore 백엔드 + Supabase Korea DB
목적: Codex CLI로 성능 병목을 분석하고, 남은 미세 딜레이를 단계적으로 줄이기 위한 실행 계획 정리

---

## 1. 현재 결론

기존 지연의 1차 원인은 region 문제였다.

이전 구조:

```text
사용자 Korea
→ Vercel Korea
→ Render Oregon, US West
→ Supabase Korea
→ Render Oregon, US West
→ 사용자 Korea
```

현재 구조:

```text
사용자 Korea
→ Vercel Korea
→ Render Singapore
→ Supabase Korea
→ Render Singapore
→ 사용자 Korea
```

Render를 Oregon에서 Singapore로 옮기면서 지연 시간이 많이 해결됐다면, region 병목은 실제 원인이 맞다.

다만 로컬과 배포 환경은 여전히 완전히 같지 않다.

로컬 구조:

```text
내 PC Korea
→ Supabase Korea
→ 내 PC Korea
```

배포 구조:

```text
사용자 Korea
→ Vercel Korea
→ Render Singapore
→ Supabase Korea
→ Render Singapore
→ 사용자 Korea
```

따라서 남은 약간의 딜레이는 다음 영역에서 발생할 가능성이 크다.

```text
1. Render Free 인스턴스 기본 오버헤드
2. Render Singapore ↔ Supabase Korea 간 네트워크 왕복
3. DB connection 생성/검증/재사용 비용
4. HikariCP 설정 미세 튜닝 필요
5. 실제 API 내부 쿼리/DTO 변환/직렬화 비용
6. React Query 재요청/retry/staleTime 문제
7. 프론트 초기 화면에서 여러 API를 동시에 또는 순차 호출하는 구조
8. 응답 JSON 크기 또는 gzip 미적용
9. 캐싱 미적용
```

---

## 2. 지금까지 적용한 개선안 평가

### 2.1 DB-T1: reviews.menu_id 인덱스 추가

판단: 맞는 개선이다.

메뉴별 리뷰 조회가 있다면 `reviews.menu_id` 인덱스는 필요하다.

다만 최신순 정렬과 pagination이 있다면 단일 인덱스보다 복합 인덱스가 더 좋을 수 있다.

예상 쿼리:

```sql
select *
from reviews
where menu_id = ?
order by created_at desc
limit 20;
```

추천 인덱스:

```sql
create index if not exists idx_reviews_menu_created_at
on reviews(menu_id, created_at desc);
```

---

### 2.2 DB-T2: getReviews() N+1 제거, JOIN FETCH r.user

판단: 맞는 개선이다.

`Review` 목록에서 `user`를 Lazy 로딩으로 하나씩 조회하고 있었다면 N+1이 발생한다. `JOIN FETCH r.user`는 정확한 해결 방향이다.

다만 아래 관계에서 N+1이 남아있을 수 있다.

```text
review.menu
review.images
review.likes
review.comments
DTO 변환 중 접근하는 Lazy 필드
JSON 직렬화 중 접근되는 Lazy 필드
```

가능하면 목록 API는 Entity 반환보다 DTO Projection이 더 안정적이다.

예시:

```java
@Query("""
    select new com.example.review.dto.ReviewResponse(
        r.id,
        r.content,
        r.rating,
        r.createdAt,
        u.id,
        u.nickname
    )
    from Review r
    join r.user u
    where r.menu.id = :menuId
    order by r.createdAt desc
""")
List<ReviewResponse> findReviewResponsesByMenuId(@Param("menuId") Long menuId);
```

---

### 2.3 DB-T3: recomputeMenuStats() 최적화

판단: 맞는 개선이다.

`findById()` 후 Entity 수정/저장하는 방식보다 `@Modifying UPDATE`로 직접 갱신하는 방식이 좋다.

다만 리뷰 작성/수정/삭제 때마다 전체 리뷰를 다시 집계하면 데이터가 늘수록 느려진다.

더 좋은 방식은 증분 업데이트다.

리뷰 작성:

```sql
update menus
set
  review_count = review_count + 1,
  rating_sum = rating_sum + :rating,
  rating_avg = (rating_sum + :rating) / (review_count + 1)
where id = :menuId;
```

리뷰 수정:

```sql
update menus
set
  rating_sum = rating_sum - :oldRating + :newRating,
  rating_avg = (rating_sum - :oldRating + :newRating) / review_count
where id = :menuId;
```

리뷰 삭제:

```sql
update menus
set
  review_count = review_count - 1,
  rating_sum = rating_sum - :rating,
  rating_avg =
    case
      when review_count - 1 = 0 then 0
      else (rating_sum - :rating) / (review_count - 1)
    end
where id = :menuId;
```

---

### 2.4 DB-T4: HikariCP + RestTemplate timeout 설정

판단: 방향은 맞다.

하지만 timeout은 속도 개선이라기보다 장애 시 무한 대기를 막는 설정이다.

남은 미세 딜레이를 줄이려면 HikariCP connection을 작게 유지하되, 최소 1개는 warm 상태로 유지하는 쪽이 좋다.

추천 설정:

```properties
spring.datasource.hikari.maximum-pool-size=3
spring.datasource.hikari.minimum-idle=1
spring.datasource.hikari.connection-timeout=3000
spring.datasource.hikari.idle-timeout=60000
spring.datasource.hikari.max-lifetime=600000
spring.datasource.hikari.keepalive-time=300000
```

의미:

```text
maximum-pool-size=3
→ 무료 Supabase에 과도한 연결을 만들지 않음

minimum-idle=1
→ 서버가 살아있는 동안 DB 연결 1개는 따뜻하게 유지

connection-timeout=3000
→ DB 연결 문제 시 30초씩 대기하지 않음

keepalive-time=300000
→ idle connection이 죽는 문제 완화
```

주의:

```text
Render Free 메모리가 부족하거나 Supabase connection 수가 부족하면 minimum-idle=0으로 낮출 수 있음.
```

---

### 2.5 FE-T1: client.js timeout 30s + React Query retry:2 / gcTime

판단: 안정성 설정이지만, 체감 지연을 키울 수 있다.

특히 timeout 30초 + retry 2는 실패 요청에서 사용자가 오래 기다리게 만든다.

추천:

조회 API:

```js
retry: 1
```

쓰기 API:

```js
retry: 0
```

axios timeout:

```js
timeout: 8000
```

쓰기 요청은 retry를 끄는 것이 안전하다.

이유:

```text
POST/PUT/DELETE retry
→ 중복 저장/중복 수정/중복 삭제 가능성
```

---

### 2.6 FE-T2: Vite manualChunks + React.lazy

판단: 프론트 초기 로딩 개선으로는 맞다.

하지만 API/DB 응답 지연의 직접 해결책은 아니다.

효과 있는 영역:

```text
초기 JS 번들 크기 감소
라우트별 lazy loading
첫 화면 렌더링 개선
```

효과가 작은 영역:

```text
DB query 지연
Render ↔ Supabase 네트워크 지연
리뷰 작성/조회 API 지연
```

---

### 2.7 FE-T3: index.html preconnect 힌트

판단: 작은 개선이다.

Pretendard CDN 같은 폰트/정적 리소스 연결을 조금 빠르게 만들 수 있다.

하지만 API/DB 지연과는 거의 무관하다.

---

## 3. 남은 딜레이를 줄이기 위한 우선순위

권장 우선순위:

```text
1. 서버 내부 처리 시간 계측
2. DB ping keep-alive 적용
3. HikariCP warm connection 설정
4. React Query staleTime 조정
5. menus/reviews API 캐싱
6. 실제 느린 쿼리 확인
7. 필요한 복합 인덱스 추가
8. 메인 화면 API 통합
9. gzip 압축 적용
10. Render Free 한계 판단
```

---

## 4. 서버 내부 처리 시간 계측

curl의 `time_total`만 보면 전체 시간만 알 수 있다.

필요한 구분:

```text
브라우저 → Render까지 걸린 시간
Render 내부 처리 시간
Render → Supabase DB query 시간
DTO 변환 시간
JSON 직렬화 시간
응답 다운로드 시간
```

### 4.1 공통 RequestTimingFilter 추가

파일 예시:

```text
src/main/java/.../common/filter/RequestTimingFilter.java
```

코드:

```java
package com.example.common.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class RequestTimingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestTimingFilter.class);

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        long start = System.currentTimeMillis();

        try {
            filterChain.doFilter(request, response);
        } finally {
            long elapsed = System.currentTimeMillis() - start;

            response.setHeader("X-Response-Time-ms", String.valueOf(elapsed));

            log.info("[REQ] method={} uri={} status={} elapsed={}ms",
                    request.getMethod(),
                    request.getRequestURI(),
                    response.getStatus(),
                    elapsed
            );
        }
    }
}
```

확인 명령:

```bash
curl -i -s https://sku-cafeteria-65by.onrender.com/api/v1/menus | grep -i "x-response-time"
```

판단 기준:

```text
curl total 550ms, X-Response-Time 40ms
→ 서버 코드는 빠름. 네트워크/Render 기본 오버헤드가 대부분.

curl total 550ms, X-Response-Time 450ms
→ 백엔드/DB/쿼리 최적화 여지 있음.

curl total 550ms, DB query 30ms, DTO 300ms
→ DTO 변환/직렬화 문제.

curl total 550ms, DB query 400ms
→ 쿼리/인덱스/DB 연결 문제.
```

---

## 5. API별 상세 계측

### 5.1 메뉴 조회 계측

Controller 또는 Service에 추가:

```java
long t0 = System.currentTimeMillis();

List<MenuResponse> result = menuService.getMenus();

long t1 = System.currentTimeMillis();

log.info("[PERF] getMenus total={}ms", t1 - t0);
```

### 5.2 리뷰 조회 계측

DB 조회와 DTO 변환을 분리:

```java
long t0 = System.currentTimeMillis();

List<Review> reviews = reviewRepository.findByMenuIdWithUser(menuId);

long t1 = System.currentTimeMillis();

List<ReviewResponse> response = reviews.stream()
        .map(ReviewResponse::from)
        .toList();

long t2 = System.currentTimeMillis();

log.info("[PERF] getReviews db={}ms dto={}ms total={}ms",
        t1 - t0,
        t2 - t1,
        t2 - t0
);
```

판단:

```text
db가 길다
→ 쿼리, 인덱스, DB connection, 서버-DB 네트워크 확인

dto가 길다
→ DTO 변환 중 Lazy loading 또는 불필요한 필드 접근 확인

total은 짧은데 브라우저가 느리다
→ 프론트 요청 구조, 캐시, retry, 렌더링 문제 확인
```

---

## 6. curl 상세 측정 명령

### 6.1 단일 API 총 시간

```bash
curl -w "\nTOTAL: %{time_total}s\n" \
  -o /dev/null -s \
  https://sku-cafeteria-65by.onrender.com/api/v1/menus
```

### 6.2 DNS, TCP, TLS, TTFB 분리

```bash
curl -H "Cache-Control: no-cache" \
  -w "\nDNS: %{time_namelookup}s\nCONNECT: %{time_connect}s\nTLS: %{time_appconnect}s\nTTFB: %{time_starttransfer}s\nTOTAL: %{time_total}s\n" \
  -o /dev/null -s \
  "https://sku-cafeteria-65by.onrender.com/api/v1/menus?ts=$(date +%s%N)"
```

판단:

```text
TTFB가 길다
→ 서버 처리/DB 처리/서버-DB 네트워크 문제

CONNECT/TLS가 길다
→ 네트워크 연결/리전/SSL 문제

TOTAL만 길고 TTFB는 짧다
→ 응답 크기 다운로드 문제
```

### 6.3 10회 반복 평균 확인

```bash
for i in {1..10}; do
  curl -H "Cache-Control: no-cache" \
    -w "TOTAL: %{time_total}s\n" \
    -o /dev/null -s \
    "https://sku-cafeteria-65by.onrender.com/api/v1/menus?ts=$(date +%s%N)"
done
```

---

## 7. keep-alive 개선

### 7.1 현재 문제

단순 `/api/health`만 호출하면 서버만 깨우고 DB connection은 warm 상태가 아닐 수 있다.

별로인 keep-alive:

```bash
curl https://sku-cafeteria-65by.onrender.com/api/health
```

더 나은 keep-alive:

```bash
curl https://sku-cafeteria-65by.onrender.com/api/v1/menus
```

가장 추천하는 keep-alive:

```bash
curl https://sku-cafeteria-65by.onrender.com/api/ping-db
```

### 7.2 ping-db API 추가

```java
package com.example.common.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PingController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/ping-db")
    public ResponseEntity<String> pingDb() {
        jdbcTemplate.queryForObject("select 1", Integer.class);
        return ResponseEntity.ok("ok");
    }
}
```

### 7.3 GitHub Actions keep-alive 수정

```yaml
name: keep-alive

on:
  schedule:
    - cron: "*/10 * * * *"
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping backend and DB
        run: |
          curl -fsS https://sku-cafeteria-65by.onrender.com/api/ping-db
```

---

## 8. HikariCP 설정

추천 production 설정:

```properties
spring.datasource.hikari.maximum-pool-size=3
spring.datasource.hikari.minimum-idle=1
spring.datasource.hikari.connection-timeout=3000
spring.datasource.hikari.idle-timeout=60000
spring.datasource.hikari.max-lifetime=600000
spring.datasource.hikari.keepalive-time=300000
```

주의:

```text
maximum-pool-size를 10, 20으로 크게 잡지 말 것.
무료 Supabase에서 connection 수만 잡아먹고 성능 개선이 거의 없을 수 있음.
```

추가 확인:

```properties
logging.level.com.zaxxer.hikari=INFO
```

더 자세히 볼 때만:

```properties
logging.level.com.zaxxer.hikari=DEBUG
```

---

## 9. React Query 최적화

### 9.1 메뉴 목록

메뉴 목록은 자주 바뀌지 않으므로 staleTime을 길게 둔다.

```js
useQuery({
  queryKey: ["menus"],
  queryFn: fetchMenus,
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 30,
  retry: 1,
});
```

### 9.2 리뷰 목록

리뷰는 메뉴보다 자주 바뀔 수 있으므로 짧게 둔다.

```js
useQuery({
  queryKey: ["reviews", menuId],
  queryFn: () => fetchReviews(menuId),
  staleTime: 1000 * 30,
  gcTime: 1000 * 60 * 5,
  retry: 1,
});
```

### 9.3 쓰기 요청

쓰기 요청은 retry를 끈다.

```js
useMutation({
  mutationFn: createReview,
  retry: 0,
});
```

쓰기 성공 후 필요한 query만 invalidate한다.

```js
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["reviews", menuId] });
  queryClient.invalidateQueries({ queryKey: ["menus"] });
}
```

---

## 10. API 캐싱

### 10.1 menus API 캐싱

급식 메뉴가 초 단위로 바뀌지 않는다면 짧은 캐싱을 적용한다.

```java
@GetMapping("/api/v1/menus")
public ResponseEntity<List<MenuResponse>> getMenus() {
    List<MenuResponse> menus = menuService.getMenus();

    return ResponseEntity.ok()
            .cacheControl(CacheControl.maxAge(30, TimeUnit.SECONDS).cachePublic())
            .body(menus);
}
```

더 길게 가능하면:

```java
.cacheControl(CacheControl.maxAge(5, TimeUnit.MINUTES).cachePublic())
```

### 10.2 캐싱 가능/불가능 구분

```text
캐싱 가능:
- 전체 사용자에게 같은 메뉴 목록
- 오늘의 급식 목록
- 짧은 TTL의 리뷰 목록

캐싱 주의:
- 로그인 사용자별 응답
- 내 정보
- 내가 좋아요 눌렀는지 여부 포함 응답

캐싱 금지:
- 리뷰 작성
- 리뷰 수정
- 리뷰 삭제
- 로그인/회원가입
```

---

## 11. gzip 압축

응답 JSON이 1KB 이상이면 gzip 압축이 도움이 될 수 있다.

application.properties:

```properties
server.compression.enabled=true
server.compression.mime-types=application/json,text/html,text/xml,text/plain,text/css,application/javascript
server.compression.min-response-size=1024
```

확인:

```bash
curl -H "Accept-Encoding: gzip" -I https://sku-cafeteria-65by.onrender.com/api/v1/menus
```

정상 예시:

```text
content-encoding: gzip
```

응답 크기 확인:

```bash
curl -s https://sku-cafeteria-65by.onrender.com/api/v1/menus | wc -c
```

리뷰 응답 크기 확인:

```bash
curl -s "https://sku-cafeteria-65by.onrender.com/api/v1/reviews?menuId=1" | wc -c
```

---

## 12. DB 쿼리 분석

### 12.1 Hibernate SQL 로그

개발/분석 환경에서만 사용한다.

```properties
spring.jpa.show-sql=true
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.orm.jdbc.bind=TRACE
```

확인할 것:

```text
API 한 번에 SQL이 몇 개 나가는지
리뷰 목록 조회 시 user 외 다른 Lazy 관계가 추가 조회되는지
메뉴 목록에서 각 메뉴마다 리뷰 수를 따로 조회하는지
인증 확인 API가 매 요청마다 불필요하게 DB를 조회하는지
```

운영 환경에서는 너무 많은 로그가 찍힐 수 있으므로 끄는 것이 좋다.

---

### 12.2 Supabase pg_stat_statements

Supabase SQL Editor에서 실행:

느린 쿼리:

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

자주 호출되는 쿼리:

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

확인할 것:

```text
mean_ms가 높은 쿼리
calls가 과하게 많은 쿼리
rows가 너무 많은 쿼리
where 조건은 있는데 index를 못 타는 쿼리
```

---

## 13. 인덱스 점검

리뷰 최신순 조회:

```sql
create index if not exists idx_reviews_menu_created_at
on reviews(menu_id, created_at desc);
```

사용자별 리뷰 조회:

```sql
create index if not exists idx_reviews_user_created_at
on reviews(user_id, created_at desc);
```

좋아요 여부 확인:

```sql
create index if not exists idx_review_likes_user_review
on review_likes(user_id, review_id);
```

메뉴 날짜별 조회가 있다면 예시:

```sql
create index if not exists idx_menus_served_date
on menus(served_date);
```

중요:

```text
인덱스는 무작정 추가하지 말고 실제 쿼리 패턴 기준으로 추가한다.
쓰기 성능과 저장 공간에도 영향을 준다.
```

---

## 14. 메인 화면 API 통합

프론트 초기 진입 시 API가 여러 개면 무료 배포 환경에서 체감 지연이 커진다.

나쁜 예:

```text
GET /api/v1/menus
GET /api/v1/reviews/recent
GET /api/v1/users/me
GET /api/v1/stats
```

추천:

```text
GET /api/v1/home
```

응답 예시:

```json
{
  "menus": [],
  "recentReviews": [],
  "me": {
    "id": 1,
    "nickname": "user"
  }
}
```

장점:

```text
브라우저↔서버 왕복 횟수 감소
초기 화면 렌더링 단순화
React Query 관리 단순화
```

주의:

```text
모든 데이터를 한 API에 무리하게 넣으면 응답이 커질 수 있음.
홈 화면에 실제 필요한 데이터만 포함할 것.
```

---

## 15. DTO 응답 크기 줄이기

Entity를 그대로 반환하지 말고 필요한 필드만 DTO로 반환한다.

리뷰 목록 DTO 예시:

```java
public record ReviewListResponse(
        Long id,
        String content,
        int rating,
        String nickname,
        LocalDateTime createdAt
) {}
```

불필요할 수 있는 필드:

```text
user 전체 객체
menu 전체 객체
권한/role 전체 정보
이미지 원본 메타데이터 전체
좋아요 목록 전체
댓글 전체
```

확인 명령:

```bash
curl -s https://sku-cafeteria-65by.onrender.com/api/v1/menus | wc -c
```

---

## 16. Vercel 쪽 확인

Vite SPA가 정적 프론트로 Render API를 직접 호출하는 구조라면 Vercel은 병목 가능성이 낮다.

다만 다음은 확인해야 한다.

```text
Vercel 환경변수 VITE_API_BASE_URL이 새 Render Singapore 주소인지
Production 환경변수를 수정했는지
변경 후 Production redeploy를 했는지
브라우저 Network에서 실제 Request URL이 새 Render 주소인지
```

확인 방법:

```text
F12
→ Network
→ Fetch/XHR
→ API 요청 클릭
→ Request URL 확인
```

정상:

```text
https://sku-cafeteria-65by.onrender.com/api/...
```

문제:

```text
https://sku-cafeteria-backend.onrender.com/api/...
```

하드코딩 확인:

```bash
grep -R "onrender.com" -n src .env* index.html vite.config.*
```

---

## 17. Render Free 한계

Render Free Web Service는 idle 상태에서 spin down된다.

keep-alive로 spin down을 어느 정도 막을 수 있어도 다음 한계는 남는다.

```text
무료 인스턴스 CPU 성능
메모리 제한
네트워크 품질
JVM warm-up 비용
GC 영향
Spring Boot 시작/런타임 오버헤드
```

모든 최적화를 해도 로컬처럼 0ms에 가깝게 느껴지기는 어렵다.

현실적인 목표:

```text
단순 조회 API: 300~700ms 내외
쓰기 API: 500ms~1.5s 내외
첫 cold request: keep-alive 실패 시 훨씬 길어질 수 있음
```

로컬급 체감을 원할 때 선택지:

```text
1. Render 유료 인스턴스 사용
2. 백엔드를 한국 리전 서버로 이동
3. Supabase와 백엔드를 같은 클라우드/같은 리전에 배치
4. Edge/API 캐싱 적극 적용
```

---

## 18. Codex CLI 작업 계획

### 18.1 1차 작업: 계측 추가

목표:

```text
성능 병목을 추측하지 않고 로그로 분리한다.
```

작업:

```text
1. RequestTimingFilter 추가
2. X-Response-Time-ms 헤더 추가
3. getMenus, getReviews, createReview 주요 Service에 [PERF] 로그 추가
4. 운영 로그에서 API별 elapsed 확인
```

검증:

```bash
curl -i -s https://sku-cafeteria-65by.onrender.com/api/v1/menus | grep -i "x-response-time"
```

---

### 18.2 2차 작업: DB warm 상태 유지

작업:

```text
1. /api/ping-db 추가
2. GitHub Actions keep-alive 대상을 /api/ping-db로 변경
3. HikariCP 설정 조정
```

설정:

```properties
spring.datasource.hikari.maximum-pool-size=3
spring.datasource.hikari.minimum-idle=1
spring.datasource.hikari.connection-timeout=3000
spring.datasource.hikari.idle-timeout=60000
spring.datasource.hikari.max-lifetime=600000
spring.datasource.hikari.keepalive-time=300000
```

검증:

```bash
curl -w "\nTOTAL: %{time_total}s\n" -o /dev/null -s https://sku-cafeteria-65by.onrender.com/api/ping-db
```

---

### 18.3 3차 작업: 프론트 캐싱 조정

작업:

```text
1. menus query staleTime 5분 적용
2. reviews query staleTime 30초 적용
3. mutation retry 0 적용
4. 성공 후 필요한 query만 invalidate
```

검증:

```text
첫 진입 후 페이지 이동/복귀 시 menus API가 매번 다시 나가지 않는지 Network 탭에서 확인
리뷰 작성 후 reviews/menus만 갱신되는지 확인
```

---

### 18.4 4차 작업: API 캐싱/압축

작업:

```text
1. /api/v1/menus Cache-Control 적용
2. server.compression.enabled=true 적용
3. 응답 크기 확인
```

검증:

```bash
curl -I https://sku-cafeteria-65by.onrender.com/api/v1/menus
```

```bash
curl -H "Accept-Encoding: gzip" -I https://sku-cafeteria-65by.onrender.com/api/v1/menus
```

---

### 18.5 5차 작업: 쿼리/인덱스 분석

작업:

```text
1. Supabase pg_stat_statements 활성화 여부 확인
2. 느린 쿼리 상위 20개 확인
3. 호출 많은 쿼리 상위 20개 확인
4. reviews(menu_id, created_at desc) 필요 여부 확인
5. 좋아요/사용자별 조회 인덱스 필요 여부 확인
```

검증 SQL:

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

---

### 18.6 6차 작업: API 통합 검토

작업:

```text
1. 초기 화면에서 호출되는 API 목록 확인
2. 3개 이상이면 /api/v1/home 통합 검토
3. 홈 화면에 필요한 데이터만 DTO로 반환
```

검증:

```text
Network 탭에서 초기 진입 API 수가 줄었는지 확인
초기 렌더링 체감 속도 비교
```

---

## 19. 최종 체크리스트

```text
[ ] Render 서비스 region이 Singapore인지 확인
[ ] Vercel Production API URL이 새 Render 주소인지 확인
[ ] 브라우저 Network에서 Request URL 확인
[ ] RequestTimingFilter 추가
[ ] X-Response-Time-ms 확인 가능
[ ] /api/ping-db 추가
[ ] GitHub Actions keep-alive 대상 변경
[ ] HikariCP minimum-idle=1 적용
[ ] React Query staleTime 적용
[ ] mutation retry=0 적용
[ ] /api/v1/menus Cache-Control 적용
[ ] gzip 압축 적용
[ ] 응답 JSON 크기 확인
[ ] pg_stat_statements로 느린 쿼리 확인
[ ] 필요한 복합 인덱스 추가
[ ] 초기 화면 API 수 확인
[ ] 필요 시 /api/v1/home 통합
[ ] 기존 Oregon 서비스 정리 또는 롤백용으로만 유지
```

---

## 20. 공식 문서 참고

Render Regions:

```text
https://render.com/docs/regions
```

Render Free Web Services:

```text
https://render.com/docs/free
```

Render FAQ, Free service slow response:

```text
https://render.com/docs/faq
```

Supabase database connection:

```text
https://supabase.com/docs/guides/database/connecting-to-postgres
```

Supabase connection management:

```text
https://supabase.com/docs/guides/database/connection-management
```

Supabase pg_stat_statements:

```text
https://supabase.com/docs/guides/database/extensions/pg_stat_statements
```

Vercel cache-control headers:

```text
https://vercel.com/docs/caching/cache-control-headers
```

Vercel managing deployments:

```text
https://vercel.com/docs/deployments/managing-deployments
```

---

## 21. 요약

현재 가장 중요한 판단:

```text
Region 문제는 실제 원인이 맞았다.
Render Singapore 이전으로 큰 지연이 해결됐다.
남은 딜레이는 무료 인프라 기본 오버헤드, DB connection, 쿼리, 프론트 캐싱 문제를 줄이는 단계다.
```

가장 먼저 할 일:

```text
1. RequestTimingFilter로 서버 내부 처리 시간 확인
2. /api/ping-db keep-alive 추가
3. HikariCP warm connection 유지
4. React Query staleTime 적용
5. menus API 짧은 캐싱 적용
```

가장 중요한 원칙:

```text
더 최적화하기 전에 반드시 계측부터 한다.
서버 내부 시간이 짧으면 코드 문제가 아니라 네트워크/플랫폼 오버헤드다.
서버 내부 시간이 길면 DB/쿼리/DTO/직렬화 문제다.
```

---

## 22. 프로젝트 적용 결정 업데이트

작성일: 2026-05-05
반영 위치: `docs/plans/coral-redesign/05-phase-e-performance.md` Phase E-5, `docs/plans/coral-redesign/99-progress.md` E-5

### 22.1 바로 실행할 항목

```text
PERF-R1 RequestTimingFilter
→ 모든 API에 X-Response-Time-ms를 붙여 curl total과 서버 내부 시간을 분리한다.

PERF-R2 /api/ping-db
→ 단순 health가 아니라 DB select 1까지 수행하는 keep-alive endpoint를 둔다.

PERF-R3 HikariCP 재조정
→ maximum-pool-size=3, minimum-idle=1로 무료 Supabase 연결 수를 보수적으로 관리한다.

PERF-R4 React Query/axios 정책 조정
→ timeout 8초, query retry 1, mutation retry 0, 메뉴 staleTime 5분, 리뷰 staleTime 30초.

PERF-R5 /api/v1/menus Cache-Control
→ 1차는 public max-age=30만 적용한다. 5분은 계측 후 결정한다.

PERF-R6 server.compression.enabled=true
→ prod JSON 응답 gzip을 켠다.
```

### 22.2 운영에서 확인할 항목

```text
PERF-R7 pg_stat_statements
→ Supabase SQL Editor에서 mean_exec_time/calls 상위 쿼리를 확인하고 결과를 기록한다.

PERF-R8 reviews(menu_id, created_at desc)
→ 리뷰 최신순 조회가 실제 병목이면 Flyway로 복합 인덱스를 추가한다.
  현재 단일 reviews(menu_id) 인덱스가 있으므로 무조건 교체하지 않는다.
```

### 22.3 조건부로만 적용할 항목

```text
PERF-R9 /api/v1/home
→ 현재 HomePage는 today/best 2개 API를 병렬 호출한다.
  초기 진입 API가 3개 이상이고 왕복 수가 병목으로 확인될 때만 통합한다.
```

### 22.4 이번 범위에서 제외하는 항목

```text
Next.js/Vercel API Route/Edge Runtime/unstable_cache
→ 현재 구조는 Vite SPA + Spring Boot API라 해당 없음.

리뷰 목록 public HTTP cache
→ isMine 필드가 인증 사용자별로 달라질 수 있어 적용하지 않는다.

리뷰 집계 증분 업데이트
→ 현재 aggregateByMenuId + updateStats는 이미 적용되어 있다.
  데이터가 늘어 집계 쿼리가 병목으로 확인되면 별도 단위로 다룬다.
```
