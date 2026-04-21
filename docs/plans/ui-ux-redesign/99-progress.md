# 진행 상황 (BE + FE 통합)

> **역할**: 모든 단위의 체크박스 단일 소스. 완료 즉시 여기만 갱신.
> **실행 명세**: 각 단위 상세 내용는 `01-phase-1-db.md` … `06-phase-d-photo.md`.

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

### 완료된 v1 백엔드 (Phase A 일부)
- [x] **BE-A-1**: Flyway 도입 + V1 baseline → 흡수 없음, 그대로 효력
- [x] **BE-A-0**: menus 2-테이블 정규화 (`menus(name,corner)` + `menu_dates`) + V2
- [x] **BE-A-2a/b/c**: 닉네임 단일화 + `PATCH /auth/me/nickname` + `GET /auth/me`
- [x] **BE-A-3a/b/c/d**: Review 3축 별점 (V5/V6) + `image_url` (V7) + DTO validation
- [x] **BE-A-5a**: `findAggregated` JPQL + N+1 해결
- [x] **BE-A-5b**: `corner` 필터 + `GET /menus/corners`

> v1 미완료 단위(BE-A-5c~5e, BE-A-6a/b, FE-B-*, FE-C-*)는 모두 아래 Phase 1~5 + D의 P*-T* 단위에 흡수되었다. 매핑은 문서 하단 [v1 → v2 Task 매핑] 참조.

---

## Phase 1 — DB 마이그레이션 (Flyway V8~V11)

- [x] **P1-T1**: V8 — `menus`에 `first_seen_at`/`last_seen_at` + 집계 캐시 5종(`avg_taste/amount/value/overall`, `review_count`) + 백필
- [x] **P1-T2**: V9 — `menu_dates.meal_slot` 추가(default `LUNCH`, CHECK) + UNIQUE를 `(menu_id, served_date, meal_slot)`로 재정의
- [x] **P1-T3**: V10 — `reviews.photo_urls TEXT[]` 추가(NOT NULL DEFAULT `{}`, CHECK ≤3) + `image_url` 백필
- [x] **P1-T4**: V10(계속) — `users.avatar_color VARCHAR(7) NOT NULL DEFAULT '#EF8A3D'`
- [ ] **P1-T5**: V11(Phase 5에서 실행) — `reviews.image_url` DROP. **사전 조건**: FE/BE photo_urls 전환 + Supabase 백업.

---

## Phase 2 — 백엔드 확장 (시그니처 호환 유지)

- ~~**P2-T1**: `Corner` enum + `CornerMapper.fromString`~~ → **취소**: `corner`는 raw String 유지, DB DISTINCT로 필터 목록 제공 (enum 매핑 불필요)
- [x] **P2-T2**: `BadgeTier` enum + `of(long)` (1/5/30 임계값)
- [x] **P2-T3**: `MenuTier` enum + `of(Double avg, Long count)` (4.5/4.0/3.5 임계값)
- [x] **P2-T4**: `ReviewService.create/update/delete`에서 `recomputeMenuStats(menuId)` 트랜잭션 호출
- [x] **P2-T5**: `MenuResponse` 확장 (`tier/isNew/firstSeenAt/avgTaste/Amount/Value/Overall`) — 기존 `averageRating/reviewCount` 호환 유지
- [x] **P2-T6**: `GET /menus?scope=all|reviewed` 파라미터 (default `reviewed`)
- [x] **P2-T7**: `GET /menus/best` (이번 주 + 리뷰 ≥ 3 + 평균 desc + TOP 5)
- [x] **P2-T8**: `GET /menus/today?slot=LUNCH` slot 파라미터
- [x] **P2-T9**: `ReviewRequest`/`ReviewUpdateRequest`에 `photoUrls: List<String>` 추가 (image_url 호환 유지, 0~3장)
- [x] **P2-T10**: `ReviewResponse`에 `photoUrls`, `authorBadgeTier` 추가 (배치 조회로 N+1 방지)
- [x] **P2-T11**: `UserResponse`/`AuthService.getMe` 확장 (`badgeTier/nextTarget/remaining/avatarColor/avgRating/reviewCount/badgeCount`)
- [x] **P2-T12**: 닉네임 30일 쿨다운 — `users.nickname_changed_at` 컬럼 추가(별도 마이그레이션) + 검증
- [x] **P2-T13**: `POST /api/cron/crawl` + `X-Cron-Secret` 헤더 검증 (`CRON_SECRET` env)
- [x] **P2-T14**: 크롤러 `meal_slot=LUNCH` 명시 + Corner 매핑 적용
- [x] **P2-T15**: `GlobalExceptionHandler` 정정 — `IllegalArgumentException` → 400 (현재 403)

> **Phase 2 게이트 완료 (2026-04-20)**: `./gradlew test` 31건 전원 통과 + Render 배포(`https://sku-cafeteria-backend.onrender.com`) + 스모크 테스트 통과 → Phase 3 진입.

---

## Phase 3 — 프론트 디자인 시스템

- [x] **P3-T1**: Tailwind 토큰 등록 (컬러 14종 / 그림자 3종 / 폰트 2종) + Google Fonts(Gaegu/Jua) import + `--font-hand`/`--font-disp` CSS 변수
- [x] **P3-T2**: `api/menus.js`, `api/users.js` 신설 (FE-B-1 흡수)
- [x] **P3-T3**: `api/reviews.js` 3축 + photoUrls 시그니처 (P0 버그 fix)
- [x] **P3-T4**: `components/hi/` 기초 9종 — Icon(14 SVG)/FoodIllust/Pill/Card/Button/Stars/UL/SecLabel/AxisBar + `/dev/components` 카탈로그
- [x] **P3-T5**: `components/hi/` 컴포지트 10종 — TabBarHi/BestCarousel/WeekDayTabs/CornerFilterChips/MedalSticker/MultiStarRating/MultiStarSummary/BadgeProgressBar/StatsGrid/EmptyState

> **Phase 3 게이트**: `npm run build` 성공 + `/dev/components`에서 모든 컴포넌트 시각 확인 (375/768/1280) → Phase 4.

---

## Phase 4 — 프론트 페이지 재작성

- [x] **P4-T1**: `OnboardingLogin` (`/login` 신규) — orangeSoft 배경 + Google G 로고
- [x] **P4-T2**: `NicknameSetupModal` (FE-B-3 흡수) — 추천 칩 5개, 닫기 불가, 가용성 체크
- [x] **P4-T3**: `ProfilePage` (`/profile`, FE-B-4 흡수) — 카드/진행도/통계/내 리뷰 4섹션, MyReviewsPage 흡수
- [x] **P4-T4**: `BottomNav` → `TabBarHi` 4탭 교체 (FE-B-2 흡수)
- [x] **P4-T5**: `HomePage` 재작성 — BEST 가로 스크롤 + 오늘 운영 코너 리스트 (FE-C-3 흡수, MOCK_TODAY 제거)
- [ ] **P4-T6**: `WeeklyPage` 재작성 — `WeekDayTabs` + 선택 요일 코너 리스트 (FE-C-4 흡수, WeekTab 삭제)
- [ ] **P4-T7**: `AllMenusPage` (`/menus`, FE-C-5 흡수) — 검색/코너 필터/정렬/MedalSticker 리스트
- [ ] **P4-T8**: `MenuDetailPage` (`/menus/:id`, FE-C-6 흡수) — 모달 → 풀스크린 라우트, 3축 집계 + 리뷰 리스트
- [ ] **P4-T9**: `ReviewWritePage` (`/menus/:id/review`) — `MultiStarRating` 3축 + 한 마디
- [ ] **P4-T10**: `EmptyState` 흐름 — 오늘 메뉴 0건 시 빈 상태 + 지난 주 베스트 미리보기

> **Phase 4 게이트**: 4탭 전부 새 디자인 + `npm run build` + 375/768/1280 수동 → Phase 5.

---

## Phase 5 — 정리 (Cleanup)

- [ ] **P5-T1**: 레거시 컴포넌트/페이지 삭제 — `WeekTab.jsx`, `MyReviewsPage.jsx`, 기존 `ReviewsPage.jsx`, `MenuDetailModal.jsx`, 기존 `BottomNav.jsx`, 기존 `Header.jsx`(또는 hi/ 버전으로 교체)
- [ ] **P5-T2**: V11 `reviews.image_url` DROP — Phase 5 직전 prod DB 스냅샷 필수
- [ ] **P5-T3**: docs 정리 — 본 문서 + `00-overview.md` + `docs/api.md`/`architecture.md` 갱신, archive 링크 정상 확인
- [ ] **P5-T4**: 배포 — Render 재배포 + Vercel 프로덕션 + CORS 갱신 (Render 환경변수 `ALLOWED_ORIGINS` 업데이트)

---

## Phase D — 사진 업로드 (별도 트랙, Phase 4 이후 병행 가능)

- [ ] **PD-T1**: BE — Cloudinary 빈 + gradle 의존성 + application.yml + 다중 파일 서명 (`GET /reviews/upload-signature`)
- [ ] **PD-T2**: Render 환경변수(`CLOUDINARY_*`) 등록 + 재배포
- [ ] **PD-T3**: FE — `api/upload.js` + `ReviewWritePage` 첨부 UX (5MB/each, 0~3장, jpeg/png/webp) + 썸네일 + 라이트박스 + 업로드 실패 폴백

---

## Known Issues / TODO

- [ ] RefreshToken 관리 미구현 — 발급만, 저장 안 함. Redis(Upstash 무료) 별도 트랙
- [ ] AdminController 인가 — 일반 JWT로 접근 가능, ROLE_ADMIN 분리 별도 트랙
- [ ] 닉네임 비속어/은어 필터 고도화 — 범위가 넓어 Phase 4/5 완료 후 별도 후속 작업으로 진행
- [ ] BE-A-7 (Phase A 단독 Railway 배포) — Phase 2 게이트로 흡수
- [x] ~~Menu API N+1 쿼리~~ → BE-A-5a 완료
- [x] ~~`GlobalExceptionHandler` IllegalArgumentException → 403 매핑 부적절~~ → P2-T15에서 정정 예정
- [x] ~~`MenuCrawlerService.splitByBr` 리터럴 `\n` 버그~~ → P2-T14 작업 시 함께 수정 권장 (Phase 2 사이드 픽스)
- [x] ~~프론트 P0: api/reviews.js 단일 rating ↔ BE 3축 NOT NULL 불일치~~ → P3-T3에서 fix

---

## v1 → v2 Task 매핑

기존 v1 명명(BE-A-* / FE-B-* / FE-C-* / BE-D-* / FE-D-*)이 v2 P*-T*로 어떻게 흡수되었는지:

| v1 단위 | v2 흡수 위치 | 비고 |
|---|---|---|
| BE-A-5c (`scope=all`) | P2-T6 | |
| BE-A-5d (`isNew`) | P2-T5 | `firstSeenAt` 컬럼화로 정의 변경 (D2: 7일 윈도우) |
| BE-A-5e (`/menus/best`) | P2-T7 | 사양 변경: 상위 2 → 상위 5 (D3) |
| BE-A-6a (`BadgeTier`) | P2-T2 | 임계값 변경 1/10/30 → 1/5/30 (D1) |
| BE-A-6b (`badgeTier`/`authorBadgeTier`) | P2-T10, P2-T11 | |
| BE-A-7 (Railway 배포) | Phase 2 게이트로 흡수 | |
| FE-B-1 (api/menus.js, api/users.js) | P3-T2 | |
| FE-B-2 (BottomNav 4-way) | P4-T4 | `BottomNav` → `TabBarHi` 신규 |
| FE-B-3 (NicknameSetupModal) | P4-T2 | |
| FE-B-4 (ProfilePage) | P4-T3 | MyReviewsPage 흡수 |
| FE-C-1 (CornerTabs) | P3-T5(`CornerFilterChips`) | |
| FE-C-2 (MultiStarRating/Display) | P3-T5 | |
| FE-C-3 (HomePage 재작성) | P4-T5 | |
| FE-C-4 (WeeklyPage 재작성) | P4-T6 | 행=코너×열=요일 매트릭스 → `WeekDayTabs`+요일별 코너 리스트로 단순화 |
| FE-C-5 (AllMenusPage) | P4-T7 | |
| FE-C-6 (MenuDetailModal 3축) | P4-T8 | 모달 → 풀스크린 라우트 |
| FE-C-7 (정리/배포) | P5-T1, P5-T4 | |
| BE-D-1a/b (Cloudinary) | PD-T1 | 다중 파일 지원 추가 |
| BE-D-2 (Railway env) | PD-T2 | |
| FE-D-3 (첨부 UX) | PD-T3 | photoUrls 0~3장으로 확장 |

---

## 구현 원칙 (모든 Phase 공통)

- 한 번에 하나의 단위만 구현. 단위 ID를 커밋 메시지에 포함 (예: `feat(P2-T7): GET /menus/best`)
- 단위 완료 시 **이 파일**의 체크박스 업데이트 (다른 곳 X)
- FE는 브라우저 **375 / 768 / 1280** 뷰포트에서 눈으로 확인
- BE는 단위 테스트 + Postman 스모크
- `position: fixed` UI는 `createPortal(…, document.body)` 사용 (stacking context 우회)
- `git commit` / `git push`는 사용자가 직접 진행 (Claude는 커밋하지 않음)
- 새 컴포넌트는 `frontend/src/components/hi/` 하위에 둔다 (기존 `components/`는 v1, 한 페이지씩 교체)
