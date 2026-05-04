/re# 진행 상황 (Coral Redesign)

> **역할**: 모든 v3 단위의 체크박스 단일 소스. 완료 즉시 여기만 갱신.
> **실행 명세**: 각 단위 상세는 `01-phase-1-foundation.md` … `06-phase-d-photo.md`.
> **이전 플랜**: v2 진행 상태 + v1→v2 매핑은 [`../archive/ui-ux-redesign-v2/99-progress.md`](../archive/ui-ux-redesign-v2/99-progress.md)에 보존.

---

## 사전 — docs 재구성 (완료)

- [x] `docs/plans/ui-ux-redesign/` → `docs/plans/archive/ui-ux-redesign-v2/` 이동
- [x] `docs/DESIGN.md` → `docs/archive/DESIGN-v2.md` 이동
- [x] `docs/plans/coral-redesign/` 신설 (00-overview / 01~03 / 06 / 99)
- [x] 새 `docs/DESIGN.md` (Coral 버전) 작성
- [x] `CLAUDE.md` / `docs/plans/README.md` / `docs/conventions.md` / `docs/onboarding/{backend,frontend}.md` 갱신

---

## Phase v3-1 — Foundation (디자인 시스템)

- [x] **V3-T1**: `tailwind.config.js`에 Coral 토큰 추가 (coral / coralSoft / g50~g900 / frame shadow / hairline / Pretendard / 2xs·xs radius)
- [x] **V3-T2**: `index.html`에 Pretendard CDN link 추가 (Gaegu/Jua는 일단 유지)
- [x] **V3-T3**: `components/coral/Icon.jsx` (17 SVG path)
- [x] **V3-T4**: 기본 컴포넌트 9종 — `Frame` / `Status` / `Header` / `Stars` / `Chip` / `Sec` / `Thumb` (corner→illustration 매핑) / `Button` / `Tab`
- [x] **V3-T5**: 컴포지트 10종 — `BestRow` / `WeekPicker` / `CategoryFilter` / `MedalDot` / `MultiStarInput` / `MultiStarSummary` / `ProgressBar` / `StatsGrid` / `Empty` / `AxisProgress`
- [x] **V3-T6**: `/dev/components` 카탈로그에 Coral 섹션 추가

> **Phase v3-1 게이트**: `/dev/components`에서 19개 컴포넌트 + 21 아이콘 + 컬러/타이포 시각 확인 (375/768/1280) + `npm run build` → Phase v3-2 진입.

---

## Phase v3-2 — 페이지 재작성 (9화면)

- [x] **V3-T7**: `LoginPage` (`/login`) — 카테고리 일러스트 컬러 유지 (예외)
- [x] **V3-T8**: `NicknameSetupModal` (App 조건부) — 닫기 불가, 추천 칩 5개, 가용성 체크
- [x] **V3-T9**: `HomePage` (`/`) — `BestRow` + 오늘 메뉴 코너별 리스트
- [x] **V3-T10**: `WeeklyPage` (`/weekly`) — `WeekPicker` + 요일별 코너 리스트
- [x] **V3-T11**: `AllMenusPage` (`/menus`) — 검색 + `CategoryFilter` + 정렬 + `MedalDot`
- [x] **V3-T12**: `MenuDetailPage` (`/menus/:id`) — 모달→풀스크린, 3축 `AxisProgress` + 리뷰 리스트
- [x] **V3-T13**: `ReviewWritePage` (`/menus/:id/review`) — `MultiStarInput` 3축 + textarea
- [x] **V3-T14**: `ProfilePage` (`/profile`) — 아바타 + `ProgressBar` + `StatsGrid` + 내 리뷰
- [x] **V3-T15**: `EmptyState` 통합 — Home/Weekly/AllMenus/Profile/MenuDetail 빈 상태에 `Empty` 적용
- [x] **V3-T16**: `App.jsx` 라우터 정리 — hi/ import 제거, coral/ 페이지로 교체

> **Phase v3-2 게이트**: 9화면 라우팅 + 새 디자인 적용 + `npm run build` + 375/768/1280 수동 → Phase v3-3 진입.

---

## Phase v3-3 — Cleanup

- [x] **V3-T17**: `frontend/src/components/hi/` 폴더 일괄 삭제 + Tailwind v2 토큰(paper/ink/orange/yellow/green/peach/rule/mute) 제거 + `index.html`에서 Gaegu/Jua link 제거
- [x] **V3-T18**: v1 `components/` 잔재 삭제 (`BottomNav`, `Header`, `MenuCard`, `MenuDetailModal`, `ReviewItem`, `StarRating`, `StarDisplay`, `WeekTab`) + `ReviewsPage` / `MyReviewsPage` 삭제. `Toast`/`SkeletonCard`는 `coral/`로 이동
- [x] **V3-T19**: V11 마이그레이션 작성 + 적용 (`reviews.image_url DROP`). **사전 조건**: Supabase 백업 + FE/BE의 `imageUrl` 참조 0건 확인
- [x] **V3-T20**: Render + Vercel production 배포 + `ALLOWED_ORIGINS` 갱신 + 스모크 8단계 통과

> **Phase v3-3 완료 후**: 본 디렉토리를 `archive/coral-redesign/`로 이동 검토.

---

## Phase D — 사진 업로드 (병행 가능)

기존 `archive/ui-ux-redesign-v2/06-phase-d-photo.md`를 그대로 복사. PD-T1~T3 시그니처 유지.

- [ ] **PD-T1**: BE Cloudinary 빈 + gradle 의존성 + application.yml + 다중 파일 서명 (`GET /api/v1/reviews/upload-signature`)
- [ ] **PD-T2**: Render 환경변수 (`CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET`) 등록 + 재배포
- [ ] **PD-T3**: FE `api/upload.js` + `ReviewWritePage` 첨부 UX (5MB/each, 0~3장, jpeg/png/webp) + 썸네일 + 라이트박스 + 업로드 실패 폴백

---

## Phase E — 버그 수정 · 성능 · PWA

- [ ] **BUG-T1**: 닉네임 쿨다운 UX 개선 — `ProfilePage`에서 `nicknameChangedAt` 기반 잠금 + "N일 후 변경 가능" 표시. `NicknameSetupModal` `nextChangeAt` 문구 추가. BE 로직은 정상.
- [ ] **PERF-T1**: GitHub Actions keep-alive — `.github/workflows/keep-alive.yml` 생성. 평일 07:00–21:00 KST 매 13분 `/api/v1/health` 핑 (Render cold start 방지).
- [ ] **PERF-T2**: FE 로딩 UX 개선 — `client.js` timeout 30s / React Query `retry:2` + `gcTime` 명시 / 5초 이상 로딩 시 "서버 연결 중…" 메시지 / Vite `manualChunks` 코드 스플리팅.
- [ ] **PWA-T1**: PWA 설정 — `vite-plugin-pwa` 설치 + manifest(이름: 성결 학식, 테마: #FF6B5C) + 아이콘(192/512 PNG) + Service Worker(정적 에셋 Cache First, API Network Only).

---

## Known Issues / TODO (v2에서 이월)

- [ ] RefreshToken 관리 미구현 — 발급만, 저장 안 함. Redis(Upstash 무료) 별도 트랙
- [ ] AdminController 인가 — 일반 JWT로 접근 가능, ROLE_ADMIN 분리 별도 트랙
- [ ] 닉네임 비속어/은어 필터 고도화 — 범위가 넓어 v3 완료 후 별도 후속

---

## 구현 원칙 (모든 Phase 공통)

- 한 번에 하나의 단위만 구현. 단위 ID를 커밋 메시지에 포함 (예: `feat(V3-T9): rewrite HomePage with coral`)
- 단위 완료 시 **이 파일**의 체크박스만 업데이트 (다른 곳 X)
- FE는 브라우저 **375 / 768 / 1280** 뷰포트에서 눈으로 확인
- BE는 단위 테스트 + Postman 스모크 (이번 Phase는 V11 외 BE 변경 거의 없음)
- `position: fixed` UI는 `createPortal(…, document.body)` 사용 (stacking context 우회)
- `git commit` / `git push`는 사용자가 직접 진행 (Claude는 커밋하지 않음)
- 새 컴포넌트는 `frontend/src/components/coral/` 하위에 둔다 (hi/는 v3-3에서 일괄 삭제)

---

## v2 → v3 흡수 매핑 (요약)

상세 매핑은 [`./00-overview.md` v2 → v3 Coral 전환 매핑 표](./00-overview.md#v2--v3-coral-전환-매핑) 참조.

| 미완료였던 v2 단위 | v3 흡수 |
|---|---|
| P1-T5 (V11 DROP) | V3-T19 |
| P4-T6 (WeeklyPage) | V3-T10 |
| P4-T7 (AllMenusPage) | V3-T11 |
| P4-T8 (MenuDetailPage) | V3-T12 |
| P4-T9 (ReviewWritePage) | V3-T13 |
| P4-T10 (EmptyState) | V3-T15 |
| P5-T1 (레거시 삭제) | V3-T17, V3-T18 |
| P5-T4 (배포) | V3-T20 |
| PD-T1~T3 | 그대로 |

이미 완료된 v2 단위 중 P3 + P4-T1~T5는 hi/ 산출물을 폐기하고 V3-T1~T9, T14로 재작성된다.
