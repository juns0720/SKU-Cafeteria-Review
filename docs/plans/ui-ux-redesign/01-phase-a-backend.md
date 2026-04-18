# Phase A — 백엔드 스키마 & API

> **역할**: Phase A 각 단위의 실행 명세(SQL, 파일, 검증). 진행 상태는 [`99-progress.md`](./99-progress.md).
> **단위 크기**: 단일 마이그레이션 or 단일 엔드포인트 = 단위 1개.

---

## ✅ BE-A-1 · Flyway 도입 + V1 baseline (완료)

**최종 결과**
- `backend/build.gradle`: `implementation 'org.flywaydb:flyway-core'`, `runtimeOnly 'org.flywaydb:flyway-database-postgresql'`
- `backend/src/main/resources/application.yml`: `spring.flyway.enabled=true`, `baseline-on-migrate=true`, `baseline-version=0`
- `backend/src/main/resources/db/migration/V1__baseline.sql`: 기존 `users`/`menus`/`reviews` DDL 스냅샷
- 개발·운영 모두 `ddl-auto=validate`로 전환 완료

---

## ✅ BE-A-0 · menus 2-테이블 정규화 (완료)

**변경 사유**: 동일 (name, corner) 메뉴가 여러 날짜 서빙될 때 중복 Menu 레코드 발생 → 리뷰·평균 계산이 분산. 정규화로 Menu 1건으로 고정.

**최종 결과**
- `V2__restructure_menus.sql`: `menu_dates` 생성 → `servedDate` 이관 → `reviews.menu_id` 대표 id로 병합 → 중복 Menu 삭제 → `menus.served_date` DROP → `UNIQUE (name, corner)` 추가
- `menu/entity/Menu.java`: `servedDate` 제거
- `menu/entity/MenuDate.java` 신규
- `menu/repository/MenuDateRepository.java` 신규 (`findByServedDateFetchMenu`, `findByServedDateBetweenFetchMenu`, `existsByMenuAndServedDate`, `findLatestServedDateByMenuId`)
- `MenuService`·`MenuCrawlerService`가 `menu_dates` 기반으로 동작

**파생 효과 (후속 단위에서 활용)**:
- `firstSeenAt` = `MIN(menu_dates.served_date)` 파생 → 별도 컬럼 불필요
- `isNew` = `MIN(menu_dates.served_date) >= 이번 주 월요일`

---

## ✅ BE-A-2 · 닉네임 단일화 + `PATCH /auth/me/nickname` (완료)

> 초기 설계는 `customNickname` 별도 필드였으나 구현 단계에서 단일 필드로 통합. 근거는 [`00-overview.md`](./00-overview.md) "설계 드리프트 기록" 참조.

### ✅ BE-A-2a · `is_nickname_set` + V3/V4
- `V3__add_custom_nickname.sql`: (역사적 기록) custom_nickname 컬럼 추가 시도
- `V4__unify_nickname.sql`: custom_nickname DROP + `is_nickname_set BOOLEAN NOT NULL DEFAULT false` 추가
- `user/entity/User.java`: `isNicknameSet` 필드, `changeNickname(String)` / `updateProfile(nickname, profileImage)` 메서드. Google 재로그인 시 `isNicknameSet=false`일 때만 nickname 덮어씀.

### ✅ BE-A-2b · `PATCH /auth/me/nickname` → 409 중복
- `auth/controller/AuthController.java`: `PATCH /auth/me/nickname` 핸들러
- `auth/dto/NicknameUpdateRequest.java`: `@NotBlank @Size(min=2, max=12)`
- `auth/service/AuthService.changeNickname()`: 선조회 후 저장, `DataIntegrityViolationException` → `IllegalStateException("이미 사용 중인 닉네임입니다")` 재던지기 → GlobalExceptionHandler가 409 응답
- `common/config/SecurityConfig.java`: `PATCH /auth/me/**` authenticated

### ✅ BE-A-2c · `GET /auth/me` + `LoginResponse.isNicknameSet`
- `auth/dto/UserResponse.java`: `isNicknameSet` 포함
- `auth/dto/LoginResponse.java`: `isNicknameSet` 포함
- `GET /auth/me` 응답에 설정된 닉네임 반영

---

## ⏳ BE-A-3 · Review 3축 별점 + imageUrl

**목표**: 별점 세분화 + 사진 컬럼 선반영(Phase D에서 사용).

### BE-A-3a · V5 add_review_triple_ratings (nullable)

**마이그레이션** `backend/src/main/resources/db/migration/V5__add_review_triple_ratings.sql`
```sql
ALTER TABLE reviews ADD COLUMN taste_rating  INT;
ALTER TABLE reviews ADD COLUMN amount_rating INT;
ALTER TABLE reviews ADD COLUMN value_rating  INT;

ALTER TABLE reviews ADD CONSTRAINT reviews_taste_range
  CHECK (taste_rating  IS NULL OR taste_rating  BETWEEN 1 AND 5);
ALTER TABLE reviews ADD CONSTRAINT reviews_amount_range
  CHECK (amount_rating IS NULL OR amount_rating BETWEEN 1 AND 5);
ALTER TABLE reviews ADD CONSTRAINT reviews_value_range
  CHECK (value_rating  IS NULL OR value_rating  BETWEEN 1 AND 5);
```

**엔티티** `review/entity/Review.java`
- 기존 `rating` 필드 **유지** (아직 DROP 안 함)
- 추가: `tasteRating`, `amountRating`, `valueRating: Integer` (nullable, `@Min(1) @Max(5)`)
- 파생 메서드: `public double overallRating()` — 3축이 모두 non-null이면 평균, 아니면 `(double) rating`

**검증**
- `./gradlew test` 그린
- dev DB에서 3축 null인 채로 기존 리뷰 조회 가능한지 확인

**의존성**: BE-A-1 (Flyway)

---

### BE-A-3b · V6 backfill_and_drop_rating

**마이그레이션** `V6__backfill_and_drop_rating.sql`
```sql
-- 기존 rating을 3축으로 복사
UPDATE reviews
   SET taste_rating  = COALESCE(taste_rating,  rating),
       amount_rating = COALESCE(amount_rating, rating),
       value_rating  = COALESCE(value_rating,  rating);

-- NOT NULL 승격
ALTER TABLE reviews ALTER COLUMN taste_rating  SET NOT NULL;
ALTER TABLE reviews ALTER COLUMN amount_rating SET NOT NULL;
ALTER TABLE reviews ALTER COLUMN value_rating  SET NOT NULL;

-- CHECK 제약 재정의 (NULL 허용 제거)
ALTER TABLE reviews DROP CONSTRAINT reviews_taste_range;
ALTER TABLE reviews DROP CONSTRAINT reviews_amount_range;
ALTER TABLE reviews DROP CONSTRAINT reviews_value_range;
ALTER TABLE reviews ADD CONSTRAINT reviews_taste_range  CHECK (taste_rating  BETWEEN 1 AND 5);
ALTER TABLE reviews ADD CONSTRAINT reviews_amount_range CHECK (amount_rating BETWEEN 1 AND 5);
ALTER TABLE reviews ADD CONSTRAINT reviews_value_range  CHECK (value_rating  BETWEEN 1 AND 5);

-- 기존 rating 제거 (되돌리기 불가!)
ALTER TABLE reviews DROP COLUMN rating;
```

**엔티티** `review/entity/Review.java`
- `rating` 필드 삭제
- 3축 `@Column(nullable=false)`로 승격
- `update(int taste, int amount, int value, String comment)` 시그니처 변경
- `overallRating()` → 3축 평균만 반환

**Repository** `review/repository/ReviewRepository.java`
- `findAverageRatingByMenuId` JPQL을 `AVG((r.tasteRating + r.amountRating + r.valueRating) / 3.0)`로 수정

**DTO** `review/dto/`
- `ReviewRequest.java`: `tasteRating`, `amountRating`, `valueRating: Integer` 각 `@NotNull @Min(1) @Max(5)`. 기존 `rating` 필드 제거.
- `ReviewUpdateRequest.java`: 동일
- `ReviewResponse.java`: `taste`, `amount`, `value: int`, `overall: double`(서버 계산). `rating` 필드 제거.

**Service** `review/service/ReviewService.java`
- `create()`/`update()` 파라미터 3축으로 수정
- `toResponse()` 3축 매핑

**검증**
- `ReviewServiceTest` 전면 갱신(단위 테스트에서 `rating` 참조 제거, 3축으로)
- 로컬 PG 리허설: rating=5인 기존 리뷰 → V6 실행 → 3축 모두 5, rating 컬럼 소멸 확인
- Postman: `POST /reviews` 3축 요청 → 201 → `GET /reviews?menuId=...` 응답 확인

**⚠️ 배포 경고**: 이 단위 배포 후 **되돌릴 수 없다**. BE-A-7 스냅샷 확보 필수.

**의존성**: BE-A-3a

---

### BE-A-3c · V7 add_review_image_url

**마이그레이션** `V7__add_review_image_url.sql`
```sql
ALTER TABLE reviews ADD COLUMN image_url VARCHAR(500);
```

**엔티티**
- `Review.java`: `imageUrl: String` (nullable, `@Size(max=500)`)
- `update()` 시그니처에 `String imageUrl` 추가

**DTO**
- `ReviewRequest`/`ReviewUpdateRequest`: `imageUrl: String` 선택 필드 (`@Size(max=500)`)
- `ReviewResponse`: `imageUrl` 포함

**검증**
- Postman으로 imageUrl 포함·미포함 양쪽 요청 모두 성공

**의존성**: BE-A-3b

---

### BE-A-3d · DTO Validation 최종 정리

- `@Valid` 경로 점검 (`ReviewController`에서 `@RequestBody @Valid`)
- `GlobalExceptionHandler`가 `MethodArgumentNotValidException`을 400으로 반환하는지 Postman 확인
- 음수/6 이상/0 요청 시 400 응답 메시지 확인

**의존성**: BE-A-3a/b/c

---

## ⏳ BE-A-5 · Menu API 확장 + N+1 해결

**목표**: 코너 필터·전체 메뉴 범위·베스트·코너 목록·isNew 추가. **동시에 기존 N+1 쿼리 해결**(메뉴당 avg/count 개별 조회 → 단일 JPQL 프로젝션).

### 공통: MenuAggregateProjection + findAggregated

**신규** `menu/dto/MenuAggregateProjection.java` (record)
```java
public record MenuAggregateProjection(
    Long id,
    String name,
    String corner,
    LocalDate firstSeenAt,      // MIN(menu_dates.served_date)
    LocalDate latestServedDate, // MAX(menu_dates.served_date)
    Double averageRating,       // null if no reviews
    Long reviewCount
) {}
```

**수정** `menu/repository/MenuRepository.java`
- 기존 `findMenusWithReviews`, `findAverageRatingByMenuId`, `countReviewsByMenuId` **삭제**
- 추가: `findAggregated(String corner)` — 코너 필터(nullable) + 상관 서브쿼리로 한 번에 조회
```java
@Query("""
  SELECT new com.sungkyul.cafeteria.menu.dto.MenuAggregateProjection(
    m.id, m.name, m.corner,
    (SELECT MIN(md.servedDate) FROM MenuDate md WHERE md.menu = m),
    (SELECT MAX(md.servedDate) FROM MenuDate md WHERE md.menu = m),
    (SELECT AVG((r.tasteRating + r.amountRating + r.valueRating) / 3.0) FROM Review r WHERE r.menu = m),
    (SELECT COUNT(r) FROM Review r WHERE r.menu = m)
  )
  FROM Menu m
  WHERE (:corner IS NULL OR m.corner = :corner)
""")
List<MenuAggregateProjection> findAggregated(@Param("corner") String corner);
```
- `findDistinctCorners()`:
```java
@Query("SELECT DISTINCT m.corner FROM Menu m ORDER BY m.corner")
List<String> findDistinctCorners();
```

**수정** `menu/service/MenuService.java` — 모든 조회 메서드가 `findAggregated` 또는 날짜 기반 `MenuDateRepository` 페치로 동작하고, 메뉴당 개별 avg/count 호출 제거.

**검증 공통**
- Hibernate `spring.jpa.properties.hibernate.generate_statistics=true`로 쿼리 수 확인
- 메뉴 100건 × 리뷰 500건 시드 → `GET /menus` 쿼리 수가 상수여야 함

---

### BE-A-5a · N+1 해결 (MenuService 재작성)

**기존 `MenuService.toResponse()`의 메뉴당 `findAverageRatingByMenuId`·`countReviewsByMenuId` 호출 제거**. 모든 경로가 `findAggregated` 결과로 매핑.

**검증**: Hibernate statistics 로그로 기존 대비 쿼리 수 감소 확인.

---

### BE-A-5b · `corner` 필터 파라미터 + `GET /menus/corners`

**Controller** `menu/controller/MenuController.java`
- `GET /menus?corner=한식&sort=` — `corner` 쿼리 파라미터 추가
- `GET /menus/today?corner=` — 오늘 메뉴에도 corner 필터
- `GET /menus/corners` — 응답: `["한식", "양식", ...]`

**Service**: `getMenus(sort, corner)`, `getTodayMenus(corner)`, `getCorners()` 추가

---

### BE-A-5c · `scope=all` 파라미터

- `GET /menus?scope=all` (기본: `reviewed`)
- `reviewed`: `reviewCount > 0`인 메뉴만
- `all`: 리뷰 유무 관계없이 전체
- 서비스 로직: `findAggregated` 결과를 Java 스트림으로 필터 (scope=reviewed면 reviewCount > 0)

---

### BE-A-5d · `isNew` 계산

**DTO** `menu/dto/MenuResponse.java` — `isNew: boolean`, `firstSeenAt: LocalDate` 추가

**Service**: `MenuResponse` 매핑 시
```java
LocalDate thisMonday = LocalDate.now().with(DayOfWeek.MONDAY);
boolean isNew = projection.firstSeenAt() != null && !projection.firstSeenAt().isBefore(thisMonday);
```

**적용 범위**: `GET /menus/weekly` 응답에 각 메뉴 `isNew` 포함 (프론트 FE-C-4 신메뉴 배너에서 사용)

---

### BE-A-5e · `GET /menus/best`

**Repository**
```java
@Query("""
  SELECT new com.sungkyul.cafeteria.menu.dto.MenuAggregateProjection(
    m.id, m.name, m.corner,
    (SELECT MIN(md2.servedDate) FROM MenuDate md2 WHERE md2.menu = m),
    (SELECT MAX(md2.servedDate) FROM MenuDate md2 WHERE md2.menu = m),
    AVG((r.tasteRating + r.amountRating + r.valueRating) / 3.0),
    COUNT(r)
  )
  FROM Menu m
  JOIN MenuDate md ON md.menu = m
  LEFT JOIN Review r ON r.menu = m
  WHERE md.servedDate BETWEEN :monday AND :sunday
  GROUP BY m.id, m.name, m.corner
  HAVING COUNT(r) >= :minReviews
  ORDER BY AVG((r.tasteRating + r.amountRating + r.valueRating) / 3.0) DESC
""")
List<MenuAggregateProjection> findBestOfWeek(LocalDate monday, LocalDate sunday, long minReviews, Pageable pageable);
```

**Controller**: `GET /menus/best` — 이번 주(월~일), `minReviews=3`, `Pageable.of(0, 2)`

**검증**: 리뷰 2건인 메뉴는 제외, 3건 이상만 상위 2개 반환

---

## ⏳ BE-A-6 · BadgeTier

### BE-A-6a · enum + `BadgeTier.of(long)`

**신규** `user/BadgeTier.java`
```java
public enum BadgeTier {
    NONE, BRONZE, SILVER, GOLD;

    public static BadgeTier of(long reviewCount) {
        if (reviewCount >= 30) return GOLD;
        if (reviewCount >= 10) return SILVER;
        if (reviewCount >= 1)  return BRONZE;
        return NONE;
    }
}
```

**테스트** `BadgeTierTest` — 경계값 0/1/9/10/29/30

---

### BE-A-6b · `countByUserId` + `/auth/me` badge

**Repository** `review/repository/ReviewRepository.java`
- 추가: `long countByUserId(Long userId)` (파생 쿼리)

**DTO**:
- `UserResponse.java`: `reviewCount: long`, `badgeTier: BadgeTier` 추가
- `ReviewResponse.java`: `authorBadgeTier: BadgeTier` 추가 (작성자 리뷰수 기반)

**Service**:
- `AuthService.getMe(userId)`: `reviewRepository.countByUserId` → `BadgeTier.of` → UserResponse
- `ReviewService.toResponse()`: 리뷰 작성자의 `countByUserId` → `authorBadgeTier`
  - N+1 주의: 리뷰 목록 조회 시 userId별 배치 조회 또는 Map 캐시 1회만

---

## ⏳ BE-A-7 · Railway 배포 + 스모크 테스트

**사전 조건**
- BE-A-3~A-6 완료, `./gradlew test` 100% pass
- **prod DB 스냅샷 확보** (Railway UI 또는 `pg_dump`)

**배포 순서**
1. Railway 환경변수 확인 (기존 값 유지)
2. `feat/be-phase-a-remainder` → main 머지 → Railway 자동 배포
3. 기동 로그에서 Flyway V5~V7 적용 확인
4. 스모크 테스트 (Postman)
   - `GET /api/v1/health` → 200
   - `GET /api/v1/menus/today` → 200
   - `GET /api/v1/menus/corners` → 200, 배열
   - `GET /api/v1/menus/best` → 200 (이번 주 리뷰 3건 이상 메뉴 없으면 빈 배열)
   - `GET /api/v1/auth/me` → 200, `badgeTier` 포함
   - `POST /api/v1/reviews` 3축 → 201
5. 실패 시: 스냅샷 복원 + 이전 커밋 재배포

**CORS**: 이 시점 프론트 도메인 미변경이므로 `SecurityConfig.corsConfigurationSource()` 수정 불필요.
