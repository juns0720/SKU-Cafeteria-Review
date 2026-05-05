# Plans

## 서비스 개요

**SKU 학식 리뷰** — 성결대학교 학생들이 교내 학생식당(학식) 메뉴를 조회하고 리뷰를 남기는 웹 앱.

- 학식 메뉴는 매주 월요일 학교 홈페이지를 크롤링해 자동 수집
- 학생은 Google 계정으로 로그인 후 메뉴에 맛·양·가성비 3축 별점과 코멘트를 남길 수 있음
- 목표: 오늘 뭐 먹을지 4탭(홈·주간·전체·프로필) 이내로 결정, 리뷰 신뢰도 확보

---

이 디렉토리는 프로젝트의 **활성 플랜과 진행 상황**을 담는다. 설계 의도(변하지 않음) / 실행 명세(Phase 단위) / 진행 상태(변함)를 **역할별 파일**로 분리해 중복 없이 관리한다.

---

## 활성 플랜

### [Coral Redesign](./coral-redesign/) (진행 중)

2026-04-27 새 Coral 디자인 핸드오프(`new_handoff/`) 도착으로 **시각 시스템 전면 재교체**. 종이/잉크 톤(v2) → 순백/코랄(#FF6B5C) + Toss 그레이 9단계 + Pretendard. 4탭/9화면 구조와 BE 스키마는 v2 그대로 유지, FE 시각 시스템과 페이지만 재작성.

읽는 순서:
1. [`00-overview.md`](./coral-redesign/00-overview.md) — Context · 결정사항(D1~D12) · 의존성 그래프 · v2→v3 매핑
2. [`99-progress.md`](./coral-redesign/99-progress.md) — 현재 진행 상태 (체크박스 단일 소스)
3. **다음 작업할 단위의 Phase 파일**만 선택적으로:
   - [`01-phase-1-foundation.md`](./coral-redesign/01-phase-1-foundation.md) — Tailwind 토큰·Pretendard·coral/ 컴포넌트 19종 (V3-T1~T6)
   - [`02-phase-2-pages.md`](./coral-redesign/02-phase-2-pages.md) — 9화면 재작성 (V3-T7~T16)
   - [`03-phase-3-cleanup.md`](./coral-redesign/03-phase-3-cleanup.md) — hi/ + v1 components/ 삭제·V11 DROP·배포 (V3-T17~T20)
   - [`05-phase-e-performance.md`](./coral-redesign/05-phase-e-performance.md) — 버그 수정·성능·PWA + Render/Supabase 후속 성능 계측 (BUG-T1, DB-T*, FE-T*, PWA-T1, PERF-R1~R9)
   - [`06-phase-d-photo.md`](./coral-redesign/06-phase-d-photo.md) — Cloudinary 다중 업로드 (PD-T1~T3, 병행 가능)

---

## 아카이브

완료되었거나 현재 유효하지 않은 플랜. 참조 전용.

- [`archive/frontend-v1.md`](./archive/frontend-v1.md) — v1 프론트 초기 계획
- [`archive/ui-ux-v1-phases/`](./archive/ui-ux-v1-phases/) — v1 Phase A/B/C/D 명명 (BE-A-* / FE-B-* / FE-C-* / BE-D-* / FE-D-*) 시절 단위 명세
- [`archive/ui-ux-redesign-v2/`](./archive/ui-ux-redesign-v2/) — v2 종이/잉크 톤 플랜. P1·P2 백엔드 단위는 모두 완료(효력 유지), P3~P5 FE 단위는 Coral Redesign V3-T*에 흡수. 매핑은 [`coral-redesign/99-progress.md`](./coral-redesign/99-progress.md) 하단 표 참조.

---

## 새 플랜을 추가할 때

1. 새 디렉토리 `docs/plans/<feature>/` 생성
2. `00-overview.md` / `NN-phase-*.md` / `99-progress.md` 구조 유지
3. 이 README의 "활성 플랜" 섹션에 링크 추가
4. `CLAUDE.md`의 Docs 섹션은 수정 불필요 — 이 README만 참조하면 됨

## 플랜이 완료되면

1. 해당 플랜의 `99-progress.md` 모든 체크박스 확인
2. 디렉토리를 `archive/` 아래로 이동 (또는 유지하되 README "아카이브" 섹션으로 옮김)
3. `docs/architecture.md` / `docs/api.md` / `docs/conventions.md`를 최종 상태에 맞춰 갱신

---

## import 체인

`CLAUDE.md`는 이 README를 `@docs/plans/README.md`로 import한다. 여기서 활성 플랜의 overview와 progress를 자동으로 끌어오도록 아래 링크를 유지한다:

@./coral-redesign/00-overview.md
@./coral-redesign/99-progress.md
