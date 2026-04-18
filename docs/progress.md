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

> 단위 크기 기준: 단일 스키마 변경 or 단일 엔드포인트. Flyway 마이그레이션 1개 = 단위 1개.

- [x] **BE-A-1**: Flyway 도입 + V1 baseline
- [x] **BE-A-0**: `menus` 2-테이블 정규화 (`menus(name,corner)` + `menu_dates`) + V2 migration

**customNickname**
- [ ] **BE-A-2a**: `customNickname` 컬럼 (nullable) + V3 migration
- [ ] **BE-A-2b**: `PATCH /auth/me/nickname` + 중복 시 409
- [ ] **BE-A-2c**: `GET /auth/me` `displayName` 필드 (`customNickname ?? nickname`)

**Review 3축 별점**
- [ ] **BE-A-3a**: `tasteRating/amountRating/valueRating` 컬럼 (nullable) + V4 migration
- [ ] **BE-A-3b**: 기존 `rating` 백필 + `rating` DROP + V5 migration
- [ ] **BE-A-3c**: `imageUrl` 컬럼 + V6 migration
- [ ] **BE-A-3d**: ReviewRequest/ReviewResponse DTO 3축 업데이트 + 유효성 검증

**Menu firstSeenAt**
- [ ] **BE-A-4a**: `firstSeenAt` 컬럼 (기존 레코드 `created_at` 백필) + V7 migration
- [ ] **BE-A-4b**: 크롤러 신규 메뉴 생성 시 `firstSeenAt` 설정

**Menu API 확장**
- [ ] **BE-A-5a**: MenuService N+1 해결 (단일 JPQL 프로젝션)
- [ ] **BE-A-5b**: `corner` 필터 파라미터 + `GET /menus/corners`
- [ ] **BE-A-5c**: `scope=all` 파라미터
- [ ] **BE-A-5d**: `isNew` 필드 계산 (firstSeenAt 기준 이번 주)
- [ ] **BE-A-5e**: `GET /menus/best` (이번 주 + 리뷰 ≥ 3 + 평균 별점 상위 2건)

**BadgeTier**
- [ ] **BE-A-6a**: `BadgeTier` enum + `BadgeTier.of(long)`
- [ ] **BE-A-6b**: `ReviewRepository.countByUserId` + `GET /auth/me` badge 필드

**배포**
- [ ] **BE-A-7**: 로컬 테스트 100% pass → Railway 배포 → 스모크 테스트

## Phase D — 사진 업로드 (백엔드)

- [ ] **BE-D-1a**: Cloudinary 설정 빈 + 서명 생성 유틸
- [ ] **BE-D-1b**: `GET /reviews/upload-signature` 엔드포인트
- [ ] **BE-D-2**: Railway 환경변수 등록 + 재배포

---

## Known Issues / TODO

- [ ] RefreshToken 관리 미구현 (현재 발급만 하고 저장 안 함)
  → 백엔드 완료 후 Redis로 구현 예정 (Upstash Redis 무료 플랜)
- [ ] AdminController 인가: 현재 일반 JWT로 접근 가능 → 추후 ROLE_ADMIN 분리 필요
- [x] ~~Menu API N+1 쿼리~~ → **BE-A-5a에서 해결 예정** (단일 JPQL 프로젝션으로 재작성)
