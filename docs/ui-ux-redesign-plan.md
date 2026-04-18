# UI/UX 전면 개편 계획 (2026-04-18 확정)

이 문서는 v2 UI/UX 개편의 **실행 단위**를 체크리스트로 보관한다. 설계 배경·대안 비교·전체 서술은 `~/.claude/plans/ui-ux-zany-boot.md` (세션 플랜 파일) 참조.

> ⚠️ **이 문서가 현재 유효한 프론트·백엔드 로드맵이다.** `docs/FRONTEND_PLAN.md`(v1)는 아카이브 상태이며 하위 레거시 문서다.

---

## 핵심 결정 (확정)

| 항목 | 값 |
|---|---|
| 탭 구조 | 홈 / 주간 / 전체 메뉴 / 프로필 (4탭) |
| 이미지 저장소 | Cloudinary |
| 별점 스키마 | 3축(`tasteRating`, `amountRating`, `valueRating`) 1~5점, `rating` DROP |
| 베스트 기준 | 이번 주 제공 + 리뷰 ≥ 3 + 평균 별점 desc, 상위 2건 |
| 뱃지 임계값 | 🥉 1~9 / 🥈 10~29 / 🥇 30+ (`BadgeTier.of(long)`) |
| 주간표 | 행=코너, 열=요일, 가로 스크롤 |
| 전체 메뉴 범위 | 모든 날짜의 모든 메뉴 (`scope=all`) |
| New 뱃지 | 해당 주(월~일) 내내 노출 |
| 닉네임 | `customNickname` 2~12자, **UNIQUE**, `customNickname ?? nickname` 표시 |
| DB 마이그레이션 | Flyway (신규 도입), V1 baseline은 기존 스키마 보존 |

---

## Phase A · 백엔드 스키마 & API (선행 필수)

> **단위 크기 기준**: 단일 스키마 변경 or 단일 엔드포인트. Flyway 마이그레이션 1개 = 단위 1개.

- [x] **BE-A-1**: Flyway 도입 + V1 baseline SQL
- [x] **BE-A-0**: `menus` 2-테이블 정규화 (`menus(name,corner)` + `menu_dates(menu_id, served_date)`) + V2 migration
  - 검증: `bootRun` → Flyway 로그 V2 적용 확인

**customNickname**
- [ ] **BE-A-2a**: `customNickname` 컬럼 추가 (nullable) + V3 migration
  - 검증: `bootRun` → Flyway V3 적용 확인
- [ ] **BE-A-2b**: `PATCH /auth/me/nickname` 엔드포인트 + 중복 시 409 핸들링
  - 검증: Postman PATCH 성공 / 중복값 → 409 응답 확인
- [ ] **BE-A-2c**: `GET /auth/me` `displayName` 필드 추가 (`customNickname ?? nickname`)
  - 검증: Postman GET → `displayName` 필드 확인

**Review 3축 별점**
- [ ] **BE-A-3a**: `tasteRating/amountRating/valueRating` 컬럼 추가 (nullable) + V4 migration
  - 검증: Flyway V4 적용 확인
- [ ] **BE-A-3b**: 기존 `rating` → 3축 백필 + `rating` 컬럼 DROP + V5 migration
  - 검증: Flyway V5 적용 + 기존 리뷰 레코드 값 확인
- [ ] **BE-A-3c**: `imageUrl` 컬럼 추가 + V6 migration
  - 검증: Flyway V6 적용 확인
- [ ] **BE-A-3d**: ReviewRequest/ReviewResponse DTO 3축 업데이트 + `@Min(1) @Max(5)` 유효성 검증
  - 검증: POST /reviews (3축 값) → 201 / 유효성 실패 → 400 확인

**Menu firstSeenAt**
- [ ] **BE-A-4a**: `firstSeenAt` 컬럼 추가 (기존 레코드는 `created_at`으로 백필) + V7 migration
  - 검증: Flyway V7 적용 + 기존 메뉴 `firstSeenAt` 값 확인
- [ ] **BE-A-4b**: 크롤러 신규 메뉴 생성 시 `firstSeenAt` 설정
  - 검증: POST /admin/crawl → 신규 메뉴 `firstSeenAt` 확인

**Menu API 확장**
- [ ] **BE-A-5a**: MenuService N+1 해결 (단일 JPQL 프로젝션으로 재작성)
  - 검증: GET /menus → `spring.jpa.show-sql=true` 로그 1 쿼리 확인
- [ ] **BE-A-5b**: `corner` 필터 파라미터 + `GET /menus/corners` 엔드포인트
  - 검증: GET /menus?corner=한식 + GET /menus/corners 응답 확인
- [ ] **BE-A-5c**: `scope=all` 파라미터 (기본: 리뷰 있는 메뉴만, all: 전체)
  - 검증: GET /menus?scope=all 응답 건수 > 기본 응답 건수
- [ ] **BE-A-5d**: `isNew` 필드 계산 (`firstSeenAt` 기준 이번 주 월~일)
  - 검증: 이번 주 신규 메뉴 `isNew=true`, 이전 메뉴 `isNew=false` 확인
- [ ] **BE-A-5e**: `GET /menus/best` (이번 주 제공 + 리뷰 ≥ 3 + 평균 별점 desc, 상위 2건)
  - 검증: GET /menus/best → 2건 이하 응답 확인

**BadgeTier**
- [ ] **BE-A-6a**: `BadgeTier` enum + `BadgeTier.of(long)` 정적 메서드
  - 검증: 단위 테스트 `of(0)→NONE`, `of(9)→BRONZE`, `of(30)→GOLD` pass
- [ ] **BE-A-6b**: `ReviewRepository.countByUserId` + `GET /auth/me` 응답에 `badge` 필드 추가
  - 검증: GET /auth/me → `badge` 필드 확인

**배포**
- [ ] **BE-A-7**: 로컬 `./gradlew test` 100% pass → prod DB 스냅샷 → Railway 배포 → Flyway 로그 + 스모크 테스트

### Phase A 브랜치
- `feat/phase-a` — A-0~A-7 단일 PR

---

## Phase B · 프론트 기반 (프로필 탭)

> **단위 크기 기준**: 단일 API 파일 or 단일 컴포넌트. 브라우저 3 뷰포트(375/768/1280) 확인 = 검증.

**API 레이어**
- [ ] **FE-B-1a**: `api/menus.js` 신설 (`getMenus`, `getTodayMenus`, `getWeeklyMenus`, `getMenuDetail`)
  - 검증: import 후 콘솔 에러 없음
- [ ] **FE-B-1b**: `api/users.js` 신설 (`getMe`, `patchNickname`)
  - 검증: import 후 콘솔 에러 없음
- [ ] **FE-B-1c**: `api/reviews.js` 3축 시그니처 업데이트 (`tasteRating/amountRating/valueRating`)
  - 검증: 기존 리뷰 작성 플로우 동작 확인

**라우팅 & 네비게이션**
- [ ] **FE-B-2a**: BottomNav 4-way 확장 (홈 / 주간 / 전체메뉴 / 프로필)
  - 검증: 브라우저 3 뷰포트 UI 확인
- [ ] **FE-B-2b**: `/menus`·`/profile` 라우트 추가 + 미로그인 `/profile` → `/` 리다이렉트
  - 검증: 비로그인 상태에서 `/profile` 직접 입력 → 리다이렉트 확인

**닉네임 & 프로필**
- [ ] **FE-B-3**: `NicknameSetupModal` (최초 로그인 `isNicknameSet===false` 시 자동 오픈, 닫기 불가)
  - 검증: mock `isNicknameSet=false` → 모달 자동 오픈 + X 버튼 없음 확인
- [ ] **FE-B-4a**: `ProfilePage` 기본 구조 (프사 / 닉네임 / 뱃지 / 로그아웃)
  - 검증: 브라우저 UI 확인
- [ ] **FE-B-4b**: `ProfilePage` 내 리뷰 섹션 추가 + `MyReviewsPage.jsx` 삭제
  - 검증: 내 리뷰 목록 표시 + 빌드 에러 없음 확인

### Phase B 브랜치
- `feat/fe-profile-phase-b` — B-1~B-4

---

## Phase C · 홈 / 주간 / 전체 메뉴 개편

**공통 컴포넌트**
- [ ] **FE-C-1**: `CornerTabs` 공통 컴포넌트 (가로 스크롤 칩, `useQuery(['menus','corners'])`)
  - 검증: HomePage에 삽입 후 탭 클릭 → 필터 동작 확인
- [ ] **FE-C-2a**: `MultiStarRating` (맛/양/가성비 3행 입력)
  - 검증: 3축 각각 클릭 → 값 변경 확인
- [ ] **FE-C-2b**: `MultiStarDisplay` (맛/양/가성비 3행 표시)
  - 검증: 임의 props로 렌더링 확인

**HomePage**
- [ ] **FE-C-3a**: `HomePage` 실제 API 연동 (오늘의 메뉴 + CornerTabs)
  - 검증: 실 데이터 카드 목록 표시 확인
- [ ] **FE-C-3b**: `HomePage` 이번 주 BEST 배너 추가 (GET /menus/best 연동)
  - 검증: BEST 배너 2건 표시 확인

**WeeklyPage**
- [ ] **FE-C-4a**: `WeeklyPage` 주간표 레이아웃 (행=코너, 열=요일, 가로 스크롤, 오늘 열 강조)
  - 검증: 주간표 렌더링 + 가로 스크롤 동작 확인
- [ ] **FE-C-4b**: `WeeklyPage` 신메뉴 배너 (isNew 메뉴 표시) + `WeekTab.jsx` 삭제
  - 검증: 신메뉴 배너 표시 + 빌드 에러 없음 확인

**AllMenusPage**
- [ ] **FE-C-5**: `AllMenusPage` 신설 (`/menus`, `scope=all`) + `ReviewsPage.jsx` 삭제하고 로직 이관
  - 검증: 전체 메뉴 목록 표시 + 빌드 에러 없음 확인

**MenuDetailModal & ReviewItem**
- [ ] **FE-C-6a**: `MenuDetailModal` `MultiStarRating` 통합 (3축 모두 입력해야 등록 버튼 활성화)
  - 검증: 3축 미입력 시 버튼 비활성화 확인
- [ ] **FE-C-6b**: `ReviewItem` 3축 별점 칩 + 작성자 뱃지 + 이미지 썸네일 슬롯
  - 검증: 브라우저 UI 확인

**배포**
- [ ] **FE-C-7**: 레거시 파일 제거 확인(`ReviewsPage.jsx`, `MyReviewsPage.jsx`, `WeekTab.jsx`) → Vercel preview → CORS 갱신(필요 시) → 프로덕션 배포

### Phase C 브랜치
- `feat/fe-ui-phase-c` — C-1~C-7

---

## Phase D · 사진 업로드 (독립)

**Backend**
- [ ] **BE-D-1a**: Cloudinary 설정 빈 + 서명 생성 유틸 (`CloudinarySignatureService`)
  - 검증: 단위 테스트 (서명 파라미터 포함 여부 검증)
- [ ] **BE-D-1b**: `GET /reviews/upload-signature` 엔드포인트 (folder/format/크기 제약 서명 발급)
  - 검증: Postman GET → `signature`, `timestamp`, `apiKey` 응답 확인
- [ ] **BE-D-2**: Railway 환경변수(`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) 등록 + 재배포
  - 검증: prod GET /reviews/upload-signature 응답 확인

**Frontend**
- [ ] **FE-D-3a**: `api/upload.js` + 5MB 선검증 유틸
  - 검증: 5MB 초과 파일 선택 → 에러 메시지 확인
- [ ] **FE-D-3b**: `MenuDetailModal` 사진 첨부 UX (썸네일 프리뷰 + 업로드 스피너)
  - 검증: 파일 선택 → 썸네일 표시 → 업로드 스피너 확인
- [ ] **FE-D-3c**: `ReviewItem` 이미지 썸네일 + 라이트박스
  - 검증: 이미지 클릭 → 라이트박스 열림 확인

### Phase D 브랜치
- `feat/photo-upload-phase-d`

---

## 의존성 요약

```
BE-A-1 (Flyway) ──┬── BE-A-0 (Menu 정규화)
                  ├── BE-A-2a→2b→2c (User)
                  ├── BE-A-3a→3b→3c→3d (Review) ──┐
                  ├── BE-A-4a→4b (Menu firstSeenAt) ──┤
                  └── BE-A-6a→6b (BadgeTier)          │
                                                       └── BE-A-5a→5e (Menu API) ── BE-A-7 (배포)
                                                                                      │
                               ┌──────────────────────────────────────────────────────┘
                               ↓
  FE-B-1a/b/c → FE-B-2a/b → FE-B-3 → FE-B-4a → FE-B-4b
                                                      │
                        ┌─────────────────────────────┘
                        ↓
  FE-C-1 / FE-C-2a/b → FE-C-3a/b / FE-C-4a/b / FE-C-5 → FE-C-6a/b → FE-C-7
                                                                           │
                                                                           ↓
                                          BE-D-1a/b → BE-D-2 → FE-D-3a/b/c
```

---

## 제외 사항 (이번 개편 범위 밖)

- RefreshToken 자동 재로그인
- 뱃지 에셋 실제 디자인(플레이스홀더 🥉🥈🥇로 시작)
- 관리자 UI, 댓글·좋아요, 푸시 알림
- Flyway Undo(CE 미지원) — 롤백 필요 시 DB 스냅샷 복원

---

## 배포 운영 규칙

1. **Phase A 배포 ≠ Phase B·C 배포**: 백엔드 먼저 단독 배포. 이 시점엔 기존 프론트의 리뷰 작성 기능이 일시적 비정상 상태 — FE Phase B·C는 반드시 feature 브랜치에서 진행 후 일괄 머지.
2. **Phase A 배포 전 체크리스트**:
   - Railway PG 스냅샷 확보
   - prod에 실 사용자 리뷰가 있는지 확인 — 있다면 V5 백필 SQL이 안전하게 동작하는지 dev 환경에서 리허설
   - 로컬 `./gradlew test` 100% pass
3. **CORS 갱신**: Phase C 배포 시 Vercel 도메인이 바뀌면 `SecurityConfig.corsConfigurationSource()` 수정 → BE 재배포
4. **환경변수**: Phase D에서 Railway 신규 추가 필요 (목록 위 참조)

---

## 구현 원칙 (모든 Phase 공통)

- **단위 크기 기준**: 단일 스키마 변경 or 단일 엔드포인트 or 단일 컴포넌트. Flyway 마이그레이션 1개 = 단위 1개.
- 한 번에 하나의 단위만 구현. 단위 ID를 커밋 메시지에 포함(예: `feat(BE-A-2b): add PATCH /auth/me/nickname`)
- 단위 완료 시 이 문서의 체크박스 업데이트
- FE는 브라우저 375/768/1280 뷰포트에서 눈으로 확인
- BE는 단위 테스트 or Postman 스모크
- `position: fixed` UI는 `createPortal(…, document.body)` 사용(기존 규칙 유지)
