# Progress (Backend)

## Current Progress

- [x] STEP1: 프로젝트 초기 셋업 (HealthController, SecurityConfig, GlobalExceptionHandler)
- [x] STEP2: DB 스키마 및 Entity (User, Menu, Review + Repository)
- [x] STEP3: Google OAuth2 + JWT 로그인
- [x] STEP4: 학식 크롤러 (MenuCrawlerService, CrawlerScheduler, AdminController) + 단위 테스트
- [x] STEP5: 메뉴 조회 API (MenuService, MenuController, menu/dto)
- [x] STEP6: 리뷰 CRUD API (ReviewService, ReviewController, review/dto)

## Phase A — UI/UX 개편 준비 (백엔드)

세부 설계: [`docs/ui-ux-redesign-plan.md`](./ui-ux-redesign-plan.md)

- [x] **BE-A-1**: Flyway 도입 + V1 baseline
- [ ] **BE-A-2**: User `customNickname` + UNIQUE + `PATCH /auth/me/nickname`
- [ ] **BE-A-3**: Review 3축 별점(`tasteRating/amountRating/valueRating`) + `imageUrl` + `rating` DROP
- [ ] **BE-A-4**: Menu `firstSeenAt` + 크롤러 연동
- [ ] **BE-A-5**: Menu API 확장 (`corner`, `scope`, `/menus/best`, `/menus/corners`, `isNew`) + **N+1 해결**(단일 JPQL)
- [ ] **BE-A-6**: `BadgeTier` enum + `ReviewRepository.countByUserId`
- [ ] **BE-A-7**: Railway 배포 + 스모크 테스트

## Phase D — 사진 업로드 (백엔드)

- [ ] **BE-D-1**: Cloudinary 설정 + `/reviews/upload-signature` (서명에 format/크기 제약 묶기)
- [ ] **BE-D-2**: Railway 환경변수 등록 + 재배포

---

## Known Issues / TODO

- [ ] RefreshToken 관리 미구현 (현재 발급만 하고 저장 안 함)
  → 백엔드 완료 후 Redis로 구현 예정 (Upstash Redis 무료 플랜)
- [ ] AdminController 인가: 현재 일반 JWT로 접근 가능 → 추후 ROLE_ADMIN 분리 필요
- [x] ~~Menu API N+1 쿼리~~ → **Phase A-5에서 함께 해결 예정** (단일 JPQL 프로젝션으로 재작성)
