/re# 진행 상황 (Coral Redesign)

> **역할**: 모든 v3 단위의 체크박스 단일 소스. 완료 즉시 여기만 갱신.
> **실행 명세**: 각 단위 상세는 `01-phase-1-foundation.md` … `06-phase-d-photo.md` / `05-phase-e-performance.md`.
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

- [x] **PD-T1**: BE Cloudinary 빈 + gradle 의존성 + application.yml + 다중 파일 서명 (`GET /api/v1/reviews/upload-signature`)
- [x] **PD-T2**: Render 환경변수 (`CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET`) 등록 + 재배포
- [x] **PD-T3**: FE `api/upload.js` + `ReviewWritePage` 첨부 UX (5MB/each, 0~3장, jpeg/png/webp) + 썸네일 + 라이트박스 + 업로드 실패 폴백

---

## Phase E — 버그 수정 · 성능 · PWA

실행 명세: [`05-phase-e-performance.md`](./05-phase-e-performance.md)

### E-1 버그 수정
- [x] **BUG-T1**: 닉네임 쿨다운 UX 개선 — `ProfilePage`에서 `nicknameChangedAt` 기반 잠금 + "N일 후 변경 가능" 표시. `NicknameSetupModal` `nextChangeAt` 문구 추가. BE 로직은 정상.

### E-2 DB 성능 최적화
- [x] **DB-T1**: Flyway V17 — `reviews.menu_id` 인덱스 추가 (풀 스캔 방지)
- [x] **DB-T2**: `getReviews()` N+1 제거 — `ReviewRepository`에 `JOIN FETCH r.user` @Query 추가
- [x] **DB-T3**: `recomputeMenuStats()` 최적화 — `MenuRepository`에 @Modifying UPDATE 추가, `findById` 제거
- [x] **DB-T4**: HikariCP 커넥션 풀 설정 + `RestTemplate` timeout 설정

### E-3 프론트엔드 성능
- [x] **PERF-T1**: GitHub Actions keep-alive — 이미 cron job으로 완료
- [x] **FE-T1**: `client.js` timeout 30s + React Query `retry:2` / `gcTime` 명시 설정
- [x] **FE-T2**: Vite `manualChunks` vendor 분리 + `React.lazy` 라우트 분할
- [x] **FE-T3**: `index.html` preconnect 힌트 추가 (Pretendard CDN)

### E-4 PWA
- [x] **PWA-T1**: PWA 설정 — `vite-plugin-pwa` 설치 + manifest(이름: 성결 학식, 테마: #FF6B5C) + 아이콘(192/512 PNG) + Service Worker(정적 에셋 Cache First, API Network Only).

### E-5 Render/Supabase 후속 성능 계측

상세 설계: [`05-phase-e-performance.md`](./05-phase-e-performance.md#phase-e-5--rendersupabase-후속-성능-계측)

- [x] **PERF-R1**: `RequestTimingFilter` 추가 — 모든 API에 `X-Response-Time-ms` 헤더와 `[REQ]` elapsed 로그 추가
- [x] **PERF-R2**: DB warm keep-alive — `GET /api/v1/ping-db` 추가 + keep-alive 대상 변경
- [x] **PERF-R3**: HikariCP prod 재조정 — `maximum-pool-size: 3`, `minimum-idle: 1`, 짧은 connection timeout, keepalive 적용
- [x] **PERF-R4**: React Query/axios 정책 조정 — axios timeout 8초, query retry 1, mutation retry 0, 메뉴/리뷰 staleTime 분리
- [x] **PERF-R5**: `GET /api/v1/menus` 30초 Cache-Control 적용 — 5분 확대는 계측 후 결정
- [x] **PERF-R6**: Spring response compression 적용 — JSON gzip 활성화
- [x] **PERF-R7**: Supabase `pg_stat_statements` 확인 — 실행 SQL/기록 양식 추가, 운영 결과는 배포 후 기록
- [x] **PERF-R8**: `reviews(menu_id, created_at DESC)` 복합 인덱스 필요성 판단 — Flyway V18 추가
- [x] **PERF-R9**: 홈 초기 API 수 확인 — `GET /api/v1/home`으로 `today` + `bestMenus` 통합

### E-6 perform.md 후속 (실데이터 warmup + URL 정합)

상세 설계: `~/.claude/plans/perform-md-robust-wadler.md` (perform.md 기반 후속 분석·우선순위·단위 명세)

- [x] **PERF-R14**: 운영 URL 검증 · stale 참조 정리 — Vercel `VITE_API_BASE_URL` 확인 + `CLAUDE.md` Project Overview · `frontend/vite.config.js` PWA urlPattern을 `sku-cafeteria-n.onrender.com`으로 교체. 브라우저 Network 탭으로 실제 호출 도메인 검증
- [x] **PERF-R10**: `/api/v1/warmup` 엔드포인트 추가 — `WarmupController`(common) 신설. `select 1` + `getTodayMenus(LUNCH)` + `getBestOfWeek()` + 최근 리뷰 10건. 단계별 try/catch로 fail-soft, 응답에 `elapsedMs` 포함. `SecurityConfig`에 `permitAll`
- [x] **PERF-R11**: `.github/workflows/keep-alive.yml` 갱신 — `BACKEND_URL` 기본값 `sku-cafeteria-n.onrender.com`으로 교정 + `/api/v1/warmup` 호출 추가(`/api/v1/ping-db`는 유지). 둘 다 `curl -fsS -m 30 || true`
- [x] **PERF-R15**: 검증 명령어 문서화 — `05-phase-e-performance.md`에 E-6 섹션 추가. curl 상세 시간 측정(PowerShell 변형 포함) · `X-Response-Time` 헤더 확인 · before/after 표 양식
- [x] **PERF-R13**: Flyway V19 — `idx_reviews_user_created_at (user_id, created_at DESC)` 복합 인덱스. `/reviews/me` 풀스캔 방지
- [x] **PERF-R12**: 메뉴/홈 query에 한해 `refetchOnWindowFocus: false` — `HomePage`/`WeeklyPage`/`AllMenusPage`/`MenuDetailPage`(메뉴 부분만)/`ReviewWritePage`(메뉴 부분만). 리뷰·인증 query는 default(true) 유지

#### E-6 보류 결정 (이번 라운드 제외)

- **Spring Cache + Caffeine** (perform.md F항): Render Free 메모리 압박 + 현재 `Cache-Control: public, max-age=30`로 브라우저/CDN 캐시 적용 상태. PERF-R10 적용 후 Render 로그의 `[REQ] elapsed` 분포를 보고 재논의
- **리뷰 통계 증분 업데이트** (perform.md I항): 현재 `recomputeMenuStats`가 SELECT AVG/COUNT + UPDATE 2쿼리. 증분 전환 시 별점 수정 시 oldRating 추적 필요 + row-level 락 정합성 위험. ROI 비대칭으로 보류

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
