너는 이 프로젝트의 성능 개선 계획을 세우는 시니어 백엔드/프론트엔드 엔지니어다.

목표:
Render + Supabase + Vercel 무료 배포 환경에서 남아있는 “최초 데이터 로딩 지연”을 줄이기 위한 수정 계획을 세워라. 바로 코드를 수정하지 말고, 먼저 코드베이스를 분석한 뒤 단계별 실행 계획을 작성해라.

현재 배포 구조:
- Frontend: Vercel Korea
- Backend: Render Singapore
- DB: Supabase Korea
- 기존에는 Backend가 Render Oregon이었고 지연이 컸음
- Backend를 Singapore로 새로 배포한 뒤 지연은 많이 해결됨
- 하지만 로컬 실행 대비 배포 환경에서는 아직 약간의 딜레이가 있음
- 지연은 모든 요청이 아니라 “새로운 데이터를 최초 로딩할 때” 주로 발생함
- 한 번 조회한 데이터는 이후 빠르게 나오는 경향이 있음

현재 판단:
- 단순 콜드스타트 문제라기보다 “캐시 미스 / 첫 조회 지연 / DB 연결 warm-up / 최초 쿼리 실행 비용 / 프론트 캐시 미사용” 문제일 가능성이 높음
- 단순 /api/health만 호출하는 keep-alive로는 부족할 수 있음
- /api/ping-db는 DB 연결을 깨우는 용도로 좋지만, 새로운 데이터 최초 로딩 지연까지 완전히 해결하지는 못함
- 실제 사용자가 처음 보는 홈/메뉴/리뷰 데이터를 미리 데우는 /api/warmup 방식이 필요할 수 있음

분석해야 할 항목:
1. 현재 백엔드에 health, ping, actuator, warmup 관련 endpoint가 있는지 확인
2. 현재 GitHub Actions keep-alive workflow가 어떤 URL을 호출하는지 확인
3. 현재 React Query 설정을 확인
    - staleTime
    - gcTime
    - retry
    - refetchOnWindowFocus
    - queryKey 구조
4. 메뉴 목록 조회 API 확인
    - /api/v1/menus
    - DB 조회 방식
    - DTO 변환 방식
    - 캐싱 여부
5. 리뷰 조회 API 확인
    - menuId 기준 조회 여부
    - JOIN FETCH 적용 여부
    - N+1 가능성
    - 정렬/페이징 여부
6. 리뷰 작성/수정/삭제 시 메뉴 통계 갱신 방식 확인
    - 전체 재계산인지
    - 증분 업데이트인지
    - 캐시 무효화가 필요한지
7. HikariCP 설정 확인
    - maximum-pool-size
    - minimum-idle
    - connection-timeout
    - idle-timeout
    - max-lifetime
    - keepalive-time
8. API 응답 크기 확인
    - user/menu/review entity 전체가 JSON으로 나가는지
    - DTO가 필요한 필드만 보내는지
9. gzip compression 설정 확인
10. 최초 로딩 시 프론트가 API를 몇 개 호출하는지 확인
    - 홈 진입 시 여러 API가 순차적으로 호출되는지
    - 병렬 호출인지
    - 하나의 home endpoint로 합칠 수 있는지

우선 제안하고 싶은 개선 방향:
A. 서버 내부 처리시간 계측 추가
- 모든 API 응답에 X-Response-Time-ms 헤더를 추가하는 OncePerRequestFilter 검토
- 로그 예시:
  [REQ] method=GET uri=/api/v1/menus status=200 elapsed=42ms
- 목적:
  curl total 시간과 서버 내부 처리시간을 분리하기 위함

B. /api/ping-db 추가 또는 개선
- DB 연결 warm-up 전용
- JdbcTemplate으로 select 1 실행
- 예시:
  GET /api/ping-db
  → select 1
  → "ok"

C. /api/warmup 추가
- 실제 사용자가 처음 보는 데이터를 미리 조회하는 endpoint
- 단, 모든 데이터를 긁으면 안 됨
- 좋은 warmup 대상:
    - DB select 1
    - menuService.getMenus()
    - 오늘 메뉴
    - 최근 리뷰 5~10개
    - 인기 메뉴
    - 홈 화면 최초 렌더링에 필요한 데이터
- 나쁜 warmup 대상:
    - 전체 리뷰 전부
    - 모든 유저 데이터
    - 모든 상세 데이터
    - 대용량 이미지/파일

D. GitHub Actions keep-alive 변경
- 기존 /api/health 또는 / 호출이면 /api/warmup으로 변경하는 계획 수립
- 예시:
  curl -fsS https://sku-cafeteria-65by.onrender.com/api/warmup
- 주기:
  10분 간격 검토

E. React Query 최적화
- 메뉴 목록:
  staleTime: 5분
  gcTime: 30분
  retry: 1
  refetchOnWindowFocus: false 검토
- 리뷰 목록:
  staleTime: 30초
  gcTime: 5분
  retry: 1
- 쓰기 mutation:
  retry: 0
- 작성/수정/삭제 성공 시 필요한 query invalidate만 수행

F. 서버 캐시 검토
- Spring Cache + Caffeine 검토
- 메뉴 목록은 캐싱 후보
- 리뷰 목록은 짧은 TTL 후보
- 캐시 무효화 필요:
    - 메뉴 생성/수정/삭제
    - 리뷰 작성/수정/삭제
    - 메뉴 평점/리뷰 수 변경

G. HikariCP 설정 검토
- 현재 설정을 확인한 뒤 아래 방향이 적합한지 판단:
  spring.datasource.hikari.maximum-pool-size=3
  spring.datasource.hikari.minimum-idle=1
  spring.datasource.hikari.connection-timeout=3000
  spring.datasource.hikari.idle-timeout=60000
  spring.datasource.hikari.max-lifetime=600000
  spring.datasource.hikari.keepalive-time=300000
- 단, Supabase Free 연결 수와 Render Free 메모리 고려

H. DB 인덱스 검토
- 이미 reviews.menu_id 인덱스는 추가됨
- 리뷰 조회가 menuId + createdAt desc라면 복합 인덱스 검토:
  create index if not exists idx_reviews_menu_created_at
  on reviews(menu_id, created_at desc);
- user별 리뷰 조회가 있으면:
  create index if not exists idx_reviews_user_created_at
  on reviews(user_id, created_at desc);
- 좋아요 여부 조회가 있으면:
  create index if not exists idx_review_likes_user_review
  on review_likes(user_id, review_id);

I. 리뷰 통계 갱신 방식 검토
- 리뷰 작성 후 recomputeMenuStats()가 전체 리뷰 avg/count 재계산이면 증분 업데이트 전환 검토
- 작성:
  review_count + 1
  rating_sum + rating
  rating_avg 재계산
- 수정:
  rating_sum - oldRating + newRating
- 삭제:
  review_count - 1
  rating_sum - rating

J. gzip compression 검토
- application.properties에 아래 설정 가능 여부 확인:
  server.compression.enabled=true
  server.compression.mime-types=application/json,text/html,text/xml,text/plain,text/css,application/javascript
  server.compression.min-response-size=1024

K. 홈 화면 API 통합 검토
- 최초 화면 진입 시 여러 API가 순차적으로 실행되면 /api/v1/home 같은 집계 endpoint 검토
- 단, 과도한 통합으로 캐시 무효화가 복잡해지지 않도록 주의

작업 방식:
1. 현재 코드베이스 구조를 먼저 탐색해라.
2. 관련 파일 위치를 찾아라.
    - Controller
    - Service
    - Repository
    - React Query 설정
    - API client
    - GitHub Actions workflow
    - application.properties 또는 application.yml
3. 바로 수정하지 말고 현재 상태를 요약해라.
4. 어떤 개선이 필요한지 우선순위로 정리해라.
5. 각 개선마다 다음을 포함해라:
    - 수정 대상 파일
    - 현재 문제
    - 수정 방향
    - 위험도
    - 예상 효과
    - 검증 방법
6. 위험도가 낮은 것부터 실행 순서를 제안해라.
7. 실제 수정이 필요하면 별도 단계로 나눠라.

원하는 최종 출력:
- “현재 상태 분석”
- “병목 가능성 판단”
- “수정 우선순위”
- “파일별 수정 계획”
- “구현 예시 코드”
- “검증 명령어”
- “롤백 방법”
- “적용 순서”

검증 명령어 예시:
curl 상세 시간 측정:
curl -H "Cache-Control: no-cache" \
-w "\nDNS: %{time_namelookup}s\nCONNECT: %{time_connect}s\nTLS: %{time_appconnect}s\nTTFB: %{time_starttransfer}s\nTOTAL: %{time_total}s\n" \
-o /dev/null -s \
"https://sku-cafeteria-65by.onrender.com/api/v1/menus?ts=$(date +%s%N)"

서버 내부 시간 헤더 확인:
curl -i -s https://sku-cafeteria-65by.onrender.com/api/v1/menus | grep -i "x-response-time"

warmup 확인:
curl -i https://sku-cafeteria-65by.onrender.com/api/warmup

ping-db 확인:
curl -i https://sku-cafeteria-65by.onrender.com/api/ping-db

주의사항:
- 무작정 전체 데이터를 warmup하지 마라.
- 캐시를 넣을 경우 반드시 무효화 전략을 같이 설계해라.
- POST/PUT/DELETE mutation에 retry를 넣지 마라.
- Supabase Free 환경이므로 Hikari pool을 크게 잡지 마라.
- Render Free 환경이므로 메모리 많이 쓰는 캐시는 피하라.
- 먼저 계측을 넣고, 그 다음 캐시/인덱스/쿼리 최적화를 판단하라.
- 운영 URL과 기존 Oregon URL을 혼동하지 마라.
- Vercel이 실제로 새 Render Singapore URL을 호출하는지 Network 탭 기준으로 확인하는 단계도 계획에 포함해라.

이 작업의 핵심 결론:
단순 콜드스타트 방지는 /api/ping-db가 맞지만,
현재 문제처럼 “새로운 데이터 최초 로딩”이 느린 경우에는 /api/warmup + React Query staleTime + 서버 캐시 + 쿼리 계측이 더 중요하다.