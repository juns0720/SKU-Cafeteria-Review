# 진행 상황 (BE + FE 통합)

> **역할**: 모든 단위의 체크박스 단일 소스. 완료 즉시 여기만 갱신.
> **실행 명세**: 각 단위 상세는 `01-phase-a-backend.md` / `02-phase-b-profile.md` / `03-phase-c-ui.md` / `04-phase-d-photo.md`.

---

## 완료된 레거시 (참조용)

### 백엔드 STEP1~6 (초기 구현)
- [x] STEP1: 프로젝트 초기 셋업 (HealthController, SecurityConfig, GlobalExceptionHandler)
- [x] STEP2: DB 스키마 및 Entity (User, Menu, Review + Repository)
- [x] STEP3: Google OAuth2 + JWT 로그인
- [x] STEP4: 학식 크롤러 (MenuCrawlerService, CrawlerScheduler, AdminController)
- [x] STEP5: 메뉴 조회 API (MenuService, MenuController, menu/dto)
- [x] STEP6: 리뷰 CRUD API (ReviewService, ReviewController, review/dto)

### 프론트 FE-1 ~ FE-5 (v1)
- [x] 인프라: Vite + TailwindCSS + Axios + React Query + React Router
- [x] 공통 컴포넌트: Header, BottomNav, StarDisplay, SkeletonCard, Toast
- [x] 인증: useAuth, Google 로그인 버튼
- [x] 페이지 (Mock): HomePage, WeeklyPage, ReviewsPage, MenuDetailModal, ReviewItem
- [x] 리뷰: StarRating, 리뷰 작성/수정/삭제 폼

> v1 미완료 항목(FE-5-4, FE-6-1~FE-6-3)은 Phase B·C·D에 흡수됨. 별도 진행 금지.

---

## Phase A — 백엔드 스키마 & API

- [x] **BE-A-1**: Flyway 도입 + V1 baseline
- [x] **BE-A-0**: menus 2-테이블 정규화 (`menus(name,corner)` + `menu_dates`) + V2
- [x] **BE-A-2a**: `is_nickname_set` + V3(custom_nickname) + V4(unify_nickname)
- [x] **BE-A-2b**: `PATCH /auth/me/nickname` + 중복 시 409
- [x] **BE-A-2c**: `GET /auth/me` + `LoginResponse.isNicknameSet`

**Review 3축 별점 + imageUrl**
- [x] **BE-A-3a**: V5 `add_review_triple_ratings` (nullable + CHECK)
- [x] **BE-A-3b**: V6 `backfill_and_drop_rating` (3축 NOT NULL + `rating` DROP)
- [x] **BE-A-3c**: V7 `add_review_image_url`
- [x] **BE-A-3d**: ReviewRequest/Response 3축 validation 최종

**Menu API 확장 + N+1 해결**
- [x] **BE-A-5a**: `findAggregated` JPQL + MenuService 재작성 (N+1 해결)
- [x] **BE-A-5b**: `corner` 필터 파라미터 + `GET /menus/corners`
- [ ] **BE-A-5c**: `scope=all` 파라미터
- [ ] **BE-A-5d**: `isNew` 계산 (`MIN(menu_dates.served_date) >= 이번 주 월요일`)
- [ ] **BE-A-5e**: `GET /menus/best` (이번 주 + 리뷰 ≥ 3 + 평균 상위 2)

**BadgeTier**
- [ ] **BE-A-6a**: `BadgeTier` enum + `BadgeTier.of(long)` + `BadgeTierTest`
- [ ] **BE-A-6b**: `ReviewRepository.countByUserId` + `UserResponse.badgeTier` + `ReviewResponse.authorBadgeTier`

**배포**
- [ ] **BE-A-7**: prod DB 스냅샷 → `./gradlew test` pass → Railway 배포 → Flyway V5~V7 적용 확인 → 스모크 테스트

---

## Phase B — 프론트 프로필 탭

- [ ] **FE-B-1**: `api/menus.js`·`api/users.js` 신설 + `api/reviews.js` 3축 시그니처
- [ ] **FE-B-2**: BottomNav 4-way + `/profile`·`/menus` 라우트 (미로그인 `/profile` 리다이렉트)
- [ ] **FE-B-3**: `NicknameSetupModal` (최초 로그인 자동 오픈, 닫기 불가)
- [ ] **FE-B-4**: `ProfilePage` + `BadgeDisplay` (MyReviewsPage 흡수 후 삭제)

---

## Phase C — 홈 / 주간 / 전체 메뉴

- [ ] **FE-C-1**: `CornerTabs` 공통 컴포넌트
- [ ] **FE-C-2**: `MultiStarRating` / `MultiStarDisplay`
- [ ] **FE-C-3**: `HomePage` 재작성 (🏆 BEST 배너 + 오늘의 메뉴 + CornerTabs + 검색/정렬 + 2열 그리드)
- [ ] **FE-C-4**: `WeeklyPage` 재작성 (✨ 신메뉴 배너 + 주간표 · 행=코너 · 열=요일 · 가로 스크롤) + `WeekTab.jsx` 삭제
- [ ] **FE-C-5**: `AllMenusPage` 신설 (`/menus`) + `ReviewsPage.jsx` 삭제
- [ ] **FE-C-6**: `MenuDetailModal` 3축 + `ReviewItem` 3축 칩·뱃지·썸네일 슬롯
- [ ] **FE-C-7**: 레거시 파일 정리 + Vercel 배포 (+ CORS 갱신 필요 시)

---

## Phase D — 사진 업로드

- [ ] **BE-D-1a**: Cloudinary 빈 + gradle 의존성 + application.yml
- [ ] **BE-D-1b**: `GET /reviews/upload-signature` (서명에 folder/포맷/크기/resource_type 묶기)
- [ ] **BE-D-2**: Railway 환경변수(`CLOUDINARY_*`) 등록 + 재배포
- [ ] **FE-D-3**: `api/upload.js` + 첨부 UX (5MB/image 선검증, 썸네일, 스피너) + 라이트박스 + 업로드 실패 폴백

---

## Known Issues / TODO

- [ ] RefreshToken 관리 미구현 (현재 발급만 하고 저장 안 함)
  → 백엔드 완료 후 Redis로 구현 예정 (Upstash Redis 무료 플랜)
- [ ] AdminController 인가: 현재 일반 JWT로 접근 가능 → 추후 ROLE_ADMIN 분리 필요
- [x] ~~Menu API N+1 쿼리~~ → **BE-A-5a에서 해결 예정** (단일 JPQL 프로젝션)

---

## 구현 원칙 (모든 Phase 공통)

- 한 번에 하나의 단위만 구현. 단위 ID를 커밋 메시지에 포함 (`feat(BE-A-3a): add triple rating columns`)
- 단위 완료 시 **이 파일**의 체크박스 업데이트 (다른 곳 X)
- FE는 브라우저 **375 / 768 / 1280** 뷰포트에서 눈으로 확인
- BE는 단위 테스트 + Postman 스모크
- `position: fixed` UI는 `createPortal(…, document.body)` 사용 (stacking context 우회)
- `git commit` / `git push`는 사용자가 직접 진행 (Claude는 커밋하지 않음)
