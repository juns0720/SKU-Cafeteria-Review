# API Reference

모든 엔드포인트 prefix: `/api/v1/` (Cron 트리거 `/api/cron/`, DB keep-alive `/api/ping-db` 예외)

> **현재 상태 표기**: BE는 v2 Phase 1~2에서 모든 응답 확장이 완료됐다. 이후 휴일 감지 기능(holidays 테이블 + isHoliday/holidayDays 응답 필드)이 추가됐고, V3-T19에서 reviews.image_url DROP(V11)과 imageUrl 호환 코드가 제거됐다. Render + Vercel 배포 완료(V3-T20). 미구현은 PD-T1(Cloudinary upload-signature)만. 결정 사항(D1~D8) 근거는 [v2 archive overview](./plans/archive/ui-ux-redesign-v2/00-overview.md) 참조.

---

## Auth

| 메서드 | 경로 | 인증 | 설명 |
|---|---|---|---|
| POST | `/auth/google` | 불필요 | Google idToken으로 로그인, JWT 반환 |
| GET | `/auth/me` | 필요 | 현재 로그인 사용자 정보 |
| PATCH | `/auth/me/nickname` | 필요 | 닉네임 변경 (30일 쿨다운, 미경과 시 409 with `nextChangeAt`) |

### `UserResponse` 필드

| 필드 | 타입 | 비고 |
|---|---|---|
| `id` | Long | |
| `email` | String | |
| `nickname` | String | |
| `profileImage` | String? | Google 프로필 |
| `isNicknameSet` | boolean | 최초 로그인 후 NicknameSetupModal 트리거 |
| `avatarColor` | String | hex (예: `#EF8A3D`), 기본 orange |
| `badgeTier` | enum | `NONE/BRONZE/SILVER/GOLD` (1/5/30 임계값, [D1](./plans/archive/ui-ux-redesign-v2/00-overview.md)) |
| `reviewCount` | long | 작성 리뷰 수 |
| `avgRating` | Double? | 본인이 매긴 평점 평균 (없으면 null) |
| `badgeCount` | long | 보유 메달 수 (참조용) |
| `nextTarget` | int? | 다음 뱃지 임계값 (예: SILVER면 30) |
| `remaining` | int? | 다음 뱃지까지 남은 리뷰 수 |
| `nicknameChangedAt` | Instant? | 마지막 닉네임 변경 시각 |

> `badgeTier/nextTarget/remaining/avatarColor/avgRating/badgeCount`는 P2-T11에서 추가.

---

## Menus

| 메서드 | 경로 | 인증 | 설명 |
|---|---|---|---|
| GET | `/menus?sort=&scope=&corner=` | 불필요 | 전체 메뉴 목록. `Cache-Control: public, max-age=30` |
| GET | `/menus/today?slot=LUNCH` | 불필요 | 오늘 학식 (slot 파라미터, 기본 LUNCH) |
| GET | `/menus/weekly?date=yyyy-MM-dd` | 불필요 | 해당 주 월~금 식단 |
| GET | `/menus/{menuId}` | 불필요 | 메뉴 단건 상세 (없으면 404) |
| GET | `/menus/best` | 불필요 | 이번 주 BEST TOP 5 (예정: P2-T7) |
| GET | `/menus/corners` | 불필요 | 코너 목록 |

---

## Home

| 메서드 | 경로 | 인증 | 설명 |
|---|---|---|---|
| GET | `/home?slot=LUNCH` | 불필요 | 홈 화면 초기 데이터. `today` + `bestMenus`, `Cache-Control: public, max-age=30` |

### `HomeResponse` 필드

| 필드 | 타입 | 비고 |
|---|---|---|
| `today` | TodayMenuResponse | `/menus/today`와 동일한 구조 |
| `bestMenus` | MenuResponse[] | `/menus/best`와 동일한 구조 |

### `/menus` 쿼리 파라미터

- `sort`: `rating`(평균↓) / `reviewCount`(↓) / `date`(↓, 기본)
- `scope`: `reviewed`(기본, 리뷰 있는 메뉴만) / `all`(전체) — P2-T6
- `corner`: 한식/양식/분식/일품 등 문자열 필터

### `/menus/best` 사양 ([D3](./plans/archive/ui-ux-redesign-v2/00-overview.md))

이번 주(월~일) 제공된 메뉴 중 **리뷰 ≥ 3**, `avgOverall desc`, **TOP 5** 반환.

### `MenuResponse` 필드

| 필드 | 타입 | 비고 |
|---|---|---|
| `id` | Long | |
| `name` | String | |
| `corner` | String | DB는 VARCHAR 유지, 응답은 [Corner enum 매핑값](./plans/archive/ui-ux-redesign-v2/00-overview.md) (KOREAN/WESTERN/SNACK/SPECIAL, fallback KOREAN) |
| `firstSeenAt` | LocalDate | 최초 등장일 (V8 컬럼화) |
| `lastSeenAt` | LocalDate | 최근 등장일 |
| `isNew` | boolean | `firstSeenAt + 7일` 이내 ([D2](./plans/archive/ui-ux-redesign-v2/00-overview.md)) |
| `tier` | enum? | `GOLD/SILVER/BRONZE/null` ([메뉴 메달 임계값](./plans/archive/ui-ux-redesign-v2/00-overview.md)) |
| `avgTaste` | Double? | 0건 시 null |
| `avgAmount` | Double? | |
| `avgValue` | Double? | |
| `avgOverall` | Double? | 3축 평균 |
| `reviewCount` | long | 집계 캐시(V8) |
| `averageRating` | Double? | **호환 유지**: `avgOverall`과 동일값 |

> `tier/isNew/firstSeenAt/lastSeenAt/avgTaste/Amount/Value/Overall`은 P2-T5에서 추가. `averageRating`은 v1 호환을 위해 유지.

### `TodayMenuResponse` 추가 필드

| 필드 | 타입 | 비고 |
|---|---|---|
| `isHoliday` | boolean | 오늘 메뉴가 0건이고 holidays 테이블에 오늘 날짜가 있으면 true |

### `/menus/weekly` 응답

`days` 필드: `"MON"~"FRI"` 키, 데이터 없는 요일은 빈 리스트.
`holidayDays` 필드: 빈 리스트이면서 holidays 테이블에 해당 날짜가 있는 요일 키의 Set (예: `["TUE", "WED"]`).

---

## Reviews

| 메서드 | 경로 | 인증 | 설명 |
|---|---|---|---|
| GET | `/reviews?menuId=&page=&size=` | 선택 | 특정 메뉴 리뷰 (페이징, 최신순) |
| GET | `/reviews/me` | 필요 | 내 리뷰 전체 (최신순) |
| POST | `/reviews` | 필요 | 리뷰 작성 → 201 Created |
| PUT | `/reviews/{reviewId}` | 필요 | 리뷰 수정 (본인만) → 200 OK |
| DELETE | `/reviews/{reviewId}` | 필요 | 리뷰 삭제 (본인만) → 204 No Content |
| GET | `/reviews/upload-signature` | 필요 | Cloudinary 서명 발급 (예정: PD-T1) |

### `ReviewRequest` (POST/PUT 본문)

| 필드 | 타입 | 제약 |
|---|---|---|
| `menuId` | Long | POST 필수 |
| `tasteRating` | int | 1~5 NOT NULL |
| `amountRating` | int | 1~5 NOT NULL |
| `valueRating` | int | 1~5 NOT NULL |
| `comment` | String? | 0~500자 |
| `photoUrls` | List\<String\> | 0~3장 (Cloudinary URL) |
| `imageUrl` | — | **제거됨** (V11, V3-T19). `photoUrls`로 완전 대체 |

### `ReviewResponse` 필드

| 필드 | 타입 | 비고 |
|---|---|---|
| `id` | Long | |
| `menuId` | Long | |
| `userId` | Long | |
| `nickname` | String | |
| `avatarColor` | String | |
| `authorBadgeTier` | enum | 작성자 BadgeTier (P2-T10에서 N+1 방지 배치 조회) |
| `tasteRating` | int | |
| `amountRating` | int | |
| `valueRating` | int | |
| `overallRating` | double | 3축 평균 |
| `comment` | String? | |
| `photoUrls` | List\<String\> | 0~3장 |
| `isMine` | boolean | 인증 시에만 true 가능 |
| `createdAt` | Instant | |
| `updatedAt` | Instant | |

---

## Admin / Cron

| 메서드 | 경로 | 인증 | 설명 |
|---|---|---|---|
| POST | `/api/v1/admin/crawl` | JWT 또는 `X-Cron-Secret` 헤더 | 학식 크롤링 수동 트리거. 응답: `savedCount` / `skippedCount` / `holidayCount` |
| GET | `/api/v1/admin/crawl/debug` | JWT 또는 `X-Cron-Secret` 헤더 | 크롤링 대상 페이지 raw HTML 반환 |
| POST | `/api/cron/crawl` | `X-Cron-Secret` 헤더 | 외부 cron 트리거. `CRON_SECRET` env와 일치 시 202, 불일치/누락 시 401 |

> `/admin/crawl`, `/admin/crawl/debug`는 `X-Cron-Secret` 헤더가 존재하되 불일치 시 401. 헤더 누락 시 JWT 인증으로 대체 가능.
> ⚠ AdminController는 현재 ROLE_ADMIN 분리 미구현(Known Issue). 일반 JWT로 접근 가능.

---

## Health

| 메서드 | 경로 | 인증 | 설명 |
|---|---|---|---|
| GET | `/health` | 불필요 | 헬스체크 |
| GET | `/api/v1/ping-db` | 불필요 | DB keep-alive. `select 1` 실행 후 `ok` 반환 |
| GET | `/api/v1/warmup` | 불필요 | DB + 오늘 메뉴 + best + 최근 리뷰 10건을 조회해 Hibernate metadata·쿼리 plan을 사전에 데움. 각 단계 fail-soft, 응답에 `elapsedMs` 포함 |

---

## 에러 응답 형식

모든 에러는 `ErrorResponse` record 형식.

```json
{ "status": 404, "message": "메뉴를 찾을 수 없습니다" }
```

### Exception → HTTP Status 매핑

| 예외 | 상태코드 | 비고 |
|---|---|---|
| `EntityNotFoundException` | 404 Not Found | |
| `IllegalStateException` | 409 Conflict | 닉네임 쿨다운, 닉네임 중복, 1인 1메뉴 1리뷰 위반 등 |
| `IllegalArgumentException` | 400 Bad Request | **P2-T15에서 정정**(이전 403). 잘못된 요청값 |
| `AccessDeniedException` | 403 Forbidden | 본인 리뷰 아닌 것 수정/삭제 등 |
| `MethodArgumentNotValidException` | 400 Bad Request | DTO validation 실패 |
| `Exception` (기타) | 500 Internal Server Error | |

새 예외는 `GlobalExceptionHandler`에 `@ExceptionHandler` 추가.
