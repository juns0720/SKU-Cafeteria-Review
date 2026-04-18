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

- [x] **BE-A-1**: Flyway 도입 + V1 baseline SQL
- [ ] **BE-A-2**: User `customNickname` + UNIQUE + `PATCH /auth/me/nickname` (중복 시 409)
- [ ] **BE-A-3**: Review 3축 별점(`tasteRating/amountRating/valueRating`) + `imageUrl` 컬럼 + 기존 `rating` DROP + 백필
- [ ] **BE-A-4**: Menu `firstSeenAt` 컬럼 + 크롤러 연동
- [ ] **BE-A-5**: Menu API 확장 (`corner` 필터, `scope`, `/menus/best`, `/menus/corners`, `isNew`) **+ 기존 N+1 해결**(단일 JPQL 프로젝션)
- [ ] **BE-A-6**: `BadgeTier` enum + `ReviewRepository.countByUserId`
- [ ] **BE-A-7**: 로컬 전체 테스트 → prod DB 스냅샷 → Railway 배포 → Flyway 적용 로그 + 스모크 테스트

### Phase A 브랜치
- `feat/be-schema-phase-a` — A-1~A-6 단일 PR(마이그레이션 묶음)

---

## Phase B · 프론트 기반 (프로필 탭)

- [ ] **FE-B-1**: `api/menus.js`·`api/users.js` 신설 + `api/reviews.js`를 3축 시그니처로 업데이트
- [ ] **FE-B-2**: `BottomNav` 4-way 확장 + `/profile`·`/menus` 라우트 + 미로그인 `/profile` 리다이렉트
- [ ] **FE-B-3**: `NicknameSetupModal` — 최초 로그인(`isNicknameSet === false`) 자동 오픈, 닫기 불가
- [ ] **FE-B-4**: `ProfilePage` — 프사/닉네임/뱃지/내 리뷰/로그아웃 (기존 `MyReviewsPage.jsx` 흡수 후 삭제)

### Phase B 브랜치
- `feat/fe-profile-phase-b` — B-1~B-4

---

## Phase C · 홈 / 주간 / 전체 메뉴 개편

- [ ] **FE-C-1**: `CornerTabs` 공통 컴포넌트 (가로 스크롤 칩, `useQuery(['menus','corners'])`)
- [ ] **FE-C-2**: `MultiStarRating` / `MultiStarDisplay` (맛/양/가성비 3행)
- [ ] **FE-C-3**: `HomePage` 재작성 — 🏆 이번 주 BEST 배너 + "오늘의 메뉴" + CornerTabs + 검색/정렬 + `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- [ ] **FE-C-4**: `WeeklyPage` 재작성 — ✨ 신메뉴 배너 + 주간표(행=코너, 열=요일, 가로 스크롤, 오늘 열 강조), `WeekTab.jsx` 삭제
- [ ] **FE-C-5**: `AllMenusPage` 신설 (`/menus`) — 기존 `ReviewsPage.jsx` 삭제하고 로직 이관, `scope=all`
- [ ] **FE-C-6**: `MenuDetailModal` — `MultiStarRating` 통합, 3축 모두 입력해야 등록 활성화. `ReviewItem`에 3축 칩 + 작성자 뱃지 + 이미지 썸네일 슬롯
- [ ] **FE-C-7**: 레거시 파일 제거 확인(`ReviewsPage.jsx`, `MyReviewsPage.jsx`, `WeekTab.jsx`) → Vercel preview → CORS 갱신(필요 시) → 프로덕션 배포

### Phase C 브랜치
- `feat/fe-ui-phase-c` — C-1~C-7

---

## Phase D · 사진 업로드 (독립)

- [ ] **BE-D-1**: Cloudinary 빈 + `GET /reviews/upload-signature` (서명에 `folder=reviews`, `allowed_formats=jpg,jpeg,png,webp`, `max_file_size=5242880`, `resource_type=image` 묶어서 발급)
- [ ] **BE-D-2**: Railway 환경변수(`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) 등록 + 재배포
- [ ] **FE-D-3**: `api/upload.js` + `MenuDetailModal` 사진 첨부 UX(5MB 선검증, 썸네일 프리뷰, 업로드 스피너) + `ReviewItem` 썸네일·라이트박스

### Phase D 브랜치
- `feat/photo-upload-phase-d`

---

## 의존성 요약

```
BE-A-1 (Flyway) ──┬── BE-A-2 (User)
                  ├── BE-A-3 (Review) ──┐
                  ├── BE-A-4 (Menu firstSeenAt) ──┤
                  └── BE-A-6 (BadgeTier)          │
                                                  └── BE-A-5 (Menu API + N+1) ── BE-A-7 (배포)
                                                                                   │
                              ┌──────────────────────────────────────────────────┘
                              ↓
  FE-B-1 (API) ── FE-B-2 (Nav) ── FE-B-3 (Nickname) ── FE-B-4 (Profile)
                                                             │
                                   ┌─────────────────────────┘
                                   ↓
  FE-C-1 / FE-C-2 → FE-C-3 / FE-C-4 / FE-C-5 → FE-C-6 → FE-C-7 (배포)
                                                             │
                                                             ↓
                                        BE-D-1 → BE-D-2 → FE-D-3
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
   - prod에 실 사용자 리뷰가 있는지 확인 — 있다면 V3 백필 SQL이 안전하게 동작하는지 dev 환경에서 리허설
   - 로컬 `./gradlew test` 100% pass
3. **CORS 갱신**: Phase C 배포 시 Vercel 도메인이 바뀌면 `SecurityConfig.corsConfigurationSource()` 수정 → BE 재배포
4. **환경변수**: Phase D에서 Railway 신규 추가 필요 (목록 위 참조)

---

## 구현 원칙 (모든 Phase 공통)

- 한 번에 하나의 단위만 구현. 단위 ID를 커밋 메시지에 포함(예: `feat(BE-A-2): add customNickname with unique constraint`)
- 단위 완료 시 이 문서의 체크박스 업데이트
- FE는 브라우저 375/768/1280 뷰포트에서 눈으로 확인
- BE는 단위 테스트 + Postman 스모크
- `position: fixed` UI는 `createPortal(…, document.body)` 사용(기존 규칙 유지)
