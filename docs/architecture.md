# Architecture

## Package Structure

```
com.sungkyul.cafeteria
├── CafeteriaApplication.java
├── common/
│   ├── config/
│   │   ├── AppConfig.java               # RestTemplate 빈
│   │   ├── SecurityConfig.java          # Security + CORS + JwtAuthFilter 등록
│   │   └── DevFlywayConfig.java         # dev 프로파일 Flyway 보조
│   ├── controller/HealthController.java # GET /api/v1/health
│   ├── controller/PingController.java   # GET /api/v1/ping-db (DB keep-alive)
│   ├── controller/WarmupController.java # GET /api/v1/warmup (DB+today+best+최근 리뷰 사전 로드)
│   ├── exception/
│   │   ├── ErrorResponse.java           # 공통 에러 응답 record
│   │   └── GlobalExceptionHandler.java  # @RestControllerAdvice
│   └── upload/
│       └── CloudinaryConfig.java        # (예정: PD-T1) Cloudinary 빈
├── auth/
│   ├── controller/AuthController.java   # /auth/google, /auth/me, PATCH /auth/me/nickname
│   ├── dto/LoginRequest.java, LoginResponse.java, UserResponse.java
│   ├── jwt/JwtProvider.java, JwtAuthFilter.java
│   └── service/AuthService.java
├── admin/
│   └── controller/AdminController.java  # POST /api/v1/admin/crawl, /admin/crawl/debug
├── home/
│   ├── controller/HomeController.java   # GET /api/v1/home
│   ├── dto/HomeResponse.java            # today + bestMenus
│   └── service/HomeService.java         # 홈 초기 데이터 조합
├── cron/
│   └── controller/CronController.java   # (예정: P2-T13) POST /api/cron/crawl + X-Cron-Secret
├── crawler/
│   ├── dto/CrawlingResult.java
│   ├── scheduler/CrawlerScheduler.java  # 매주 월요일 08:00 자동 실행
│   └── service/MenuCrawlerService.java  # Jsoup 기반 크롤링 + meal_slot=LUNCH 명시
├── user/
│   ├── domain/BadgeTier.java            # (예정: P2-T2) NONE/BRONZE(1~4)/SILVER(5~29)/GOLD(30+)
│   ├── entity/User.java                 # avatar_color, nickname_changed_at 포함
│   └── repository/UserRepository.java
├── menu/
│   ├── controller/MenuController.java
│   ├── domain/
│   │   ├── Corner.java                  # (예정: P2-T1) KOREAN/WESTERN/SNACK/SPECIAL
│   │   ├── CornerMapper.java            # 한식→KOREAN 등 + 미매칭 fallback WARN
│   │   └── MenuTier.java                # (예정: P2-T3) GOLD/SILVER/BRONZE/null
│   ├── dto/MenuResponse.java, TodayMenuResponse.java, WeeklyMenuResponse.java, AggregateProjection
│   ├── entity/Menu.java                 # first/last_seen_at + 집계 캐시 5종
│   ├── entity/MenuDate.java             # menu_id + served_date + meal_slot
│   ├── entity/Holiday.java              # holidays 테이블 (holiday_date UNIQUE)
│   ├── repository/MenuRepository.java
│   ├── repository/HolidayRepository.java
│   └── service/MenuService.java
└── review/
    ├── controller/ReviewController.java
    ├── dto/ReviewRequest.java, ReviewUpdateRequest.java, ReviewResponse.java, UploadSignatureResponse.java
    ├── entity/Review.java               # 3축 별점 + photo_urls TEXT[]
    ├── repository/ReviewRepository.java
    └── service/ReviewService.java       # recomputeMenuStats 트랜잭션 트리거
```

새 기능은 도메인별 패키지에 `controller` → `service` → `repository` → `entity` 레이어로 추가한다. 도메인 enum/매퍼는 `<domain>/domain/` 하위에 둔다.

## Auth Flow

1. 프론트에서 Google 로그인 후 `idToken`을 `POST /api/v1/auth/google`로 전송
2. `AuthService.verifyGoogleToken()` → `https://oauth2.googleapis.com/tokeninfo?id_token=` 호출로 검증
3. `User` upsert (googleId로 조회 → 없으면 `save`, 있으면 `user.updateProfile()`. `isNicknameSet=true`면 nickname 덮어쓰지 않음)
4. `JwtProvider`로 accessToken / refreshToken 발급 → `LoginResponse` 반환
5. 이후 요청은 `Authorization: Bearer {accessToken}` 헤더로 인증
6. `JwtAuthFilter` → 토큰 유효 시 `SecurityContextHolder`에 userId(Long) 저장

컨트롤러에서 userId 추출 패턴:
```java
Long userId = (Long) authentication.getPrincipal();
```

> RefreshToken은 발급만, 저장 안 함 (Known Issue — Redis 별도 트랙).

## Security 인가 규칙

`SecurityConfig.filterChain()`에 정의된 현재 규칙:

| 경로 | 메서드 | 인증 |
|---|---|---|
| `/api/v1/auth/google` | POST | permitAll |
| `/api/v1/ping-db` | GET | permitAll |
| `/api/v1/warmup` | GET | permitAll |
| `/api/v1/health` | GET | permitAll |
| `/api/v1/home` | GET | permitAll |
| `/api/v1/menus/**` | GET | permitAll |
| `/api/v1/reviews/**` | GET | permitAll |
| `/api/cron/**` | POST | permitAll (헤더 검증은 컨트롤러에서) |
| `/api/v1/admin/crawl` | POST | permitAll (X-Cron-Secret 헤더 검증은 컨트롤러에서) |
| `/api/v1/admin/crawl/debug` | GET | permitAll (X-Cron-Secret 헤더 검증은 컨트롤러에서) |
| `/api/v1/admin/**` | * | authenticated (ROLE_ADMIN 분리 예정 — Known Issue) |
| 나머지 | * | authenticated |

JWT 없는 authenticated 요청은 `AuthenticationEntryPoint`가 401 반환.
CORS 허용 오리진은 `app.allowed-origins` 환경변수로 주입한다 (`SecurityConfig`에서 쉼표 분리). 로컬 기본값은 `http://localhost:5173`, prod에서는 Render 환경변수 `ALLOWED_ORIGINS`에 Vercel 도메인을 설정한다.

`POST /api/cron/crawl`, `POST /api/v1/admin/crawl`, `GET /api/v1/admin/crawl/debug`는 Spring Security에서 permitAll이지만, 컨트롤러 진입 시 `X-Cron-Secret` 헤더와 환경변수 `CRON_SECRET`를 비교해 헤더가 존재하되 불일치 시 401을 반환한다. (헤더 누락 시에는 JWT 인증으로 대체 가능)

## Crawler 구조

- **대상 URL**: `https://www.sungkyul.ac.kr/skukr/340/subview.do`
- **HTML 구조**: `<th>요일<br>yyyy.MM.dd</th>` 헤더, `<td class="no-data">` 주말 빈칸
- **날짜 파싱**: `\d{4}\.\d{2}\.\d{2}` 정규식으로 추출 (`parseDates()`)
- **SSL 이슈**: 성결대 사이트는 KISA(한국 CA) 인증서를 사용해 JVM 기본 truststore에 없음 → `fetchDocument()`에서 trust-all `SSLContext`로 우회
- **테스트 설계**: `fetchDocument()`가 package-private이라 같은 패키지의 테스트에서 Mockito `spy`로 stubbing 가능 (`MenuCrawlerServiceTest`)
- **MealSlot**: `menu_dates.meal_slot`에 `LUNCH` 명시 저장. 현재 식단표가 점심만이므로 DINNER는 후속.
- **Corner 매핑**: 크롤링한 raw 코너명("한식"/"양식"/"분식"/"일품" 등)은 그대로 VARCHAR로 저장. 응답 직렬화 시 `CornerMapper.fromString()`이 enum으로 변환, 미매칭은 KOREAN fallback + WARN 로그.
- **휴일 감지**: `HOLIDAY_KEYWORDS`(휴일/휴무/휴관/공휴일 등) 기반 필터로 휴일 안내 문구를 메뉴명으로 저장하지 않음. 해당 날짜에 저장된 메뉴가 0건이면 `holidays` 테이블에 자동 기록. `CrawlingResult.holidayCount`로 감지 수 확인 가능.

## 집계 캐시 갱신

`menus`에 캐시 컬럼 5종(`avg_taste`, `avg_amount`, `avg_value`, `avg_overall`, `review_count`)을 두고 단일 SELECT로 카드 렌더한다(상관 서브쿼리 제거).

`ReviewService.create/update/delete`는 트랜잭션 종료 전 `recomputeMenuStats(menuId)`를 호출:

```java
@Transactional
public void create(...) {
    reviewRepository.save(review);
    menuService.recomputeMenuStats(menuId); // AVG/COUNT 재계산 후 menus UPDATE
}
```

자세한 구현은 [v2 archive Phase 2 P2-T4](./plans/archive/ui-ux-redesign-v2/02-phase-2-backend.md) 참조 (BE는 v2에서 완료, v3 Coral은 FE 전용).

## Docker / 로컬 개발

| 파일 | 역할 |
|---|---|
| `docker-compose.yml` (루트) | 로컬 개발용. `postgres` 서비스 단독 기동 또는 `--profile full`로 BE까지 |
| `backend/Dockerfile` | 멀티 스테이지 빌드 (Gradle 빌드 → JRE 실행). Render 배포에서도 사용 |

```bash
docker compose up postgres -d           # PostgreSQL만 (일반 로컬 개발)
docker compose --profile full up -d     # PostgreSQL + 백엔드 통합 검증
```

로컬 DB 접속: `localhost:5432`, DB `sungkyul_cafeteria`, user/pass `postgres/postgres`

## Configuration Profiles

| 프로파일 | 용도 | ddl-auto | Flyway | 활성화 방법 |
|---|---|---|---|---|
| `dev` (기본) | 로컬 개발 | `none` | enabled | 기본값 |
| `prod` | Render 배포 | `validate` | enabled | `SPRING_PROFILES_ACTIVE=prod` |

prod 프로파일 환경변수 (Render 대시보드에서 설정):
- `SPRING_DATASOURCE_URL` / `SPRING_DATASOURCE_USERNAME` / `SPRING_DATASOURCE_PASSWORD` — Supabase 연결 정보
  > Render 무료 플랜은 IPv6 미지원. Supabase 직접 연결(포트 5432) 대신 **Connection Pooler — Session 모드**(포트 5432, IPv4)를 사용해야 한다. URL은 `aws-0-xxx.pooler.supabase.com` 형태, username은 `postgres.<project-ref>` 형태.
  > prod HikariCP는 무료 플랜 연결 수를 고려해 `maximum-pool-size=3`, `minimum-idle=1`, `connection-timeout=3000ms`, `keepalive-time=300000ms`로 보수적으로 운영한다.
- prod는 JSON 등 1KB 이상 응답에 Spring response compression을 활성화한다. 배포 후 `Accept-Encoding: gzip` 요청에서 `content-encoding: gzip` 여부를 확인한다.
- `JWT_SECRET` — Render가 자동 생성(`generateValue`)
- `CRON_SECRET` — Render가 자동 생성
- `ALLOWED_ORIGINS` — 쉼표 구분 허용 오리진 (예: `https://sku-cafeteria.vercel.app,http://localhost:5173`)
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` (Phase D 이후)

## Flyway 마이그레이션 이력

| 버전 | 내용 | 상태 |
|---|---|---|
| V1 | baseline (users/menus/reviews) | 적용 |
| V2 | menus 정규화 + menu_dates | 적용 |
| V3 | custom_nickname 추가 | 적용 (V4에서 폐기) |
| V4 | nickname 단일 + is_nickname_set | 적용 |
| V5 | review 3축 nullable 추가 | 적용 |
| V6 | review 3축 NOT NULL + 기존 rating DROP | 적용 |
| V7 | reviews.image_url 추가 | 적용 |
| V8 | menus 집계 캐시 + first/last_seen_at | 적용 |
| V9 | menu_dates.meal_slot + UNIQUE 재정의 | 적용 |
| V10 | reviews.photo_urls + users.avatar_color | 적용 |
| V11 | reviews.image_url DROP (롤백 불가) | 적용 (out-of-order) |
| V12 | users.nickname_changed_at | 적용 |
| V13 | users.nickname_normalized 컬럼 추가 | 적용 |
| V14 | menus first/last_seen_at 백필 | 적용 |
| V15 | holidays 테이블 신설 (holiday_date UNIQUE) | 적용 |
| V16 | 기존 휴일 메시지 메뉴 데이터 정리 (menu_dates → menus DELETE) | 적용 |

V11은 V12~V16 이후에 추가됐으므로 dev/prod 모두 `spring.flyway.out-of-order=true` 설정 필요 (이미 적용됨).
