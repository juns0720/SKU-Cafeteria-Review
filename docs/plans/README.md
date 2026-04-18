# Plans

## 서비스 개요

**SKU 학식 리뷰** — 성결대학교 학생들이 교내 학생식당(학식) 메뉴를 조회하고 리뷰를 남기는 웹 앱.

- 학식 메뉴는 매주 월요일 학교 홈페이지를 크롤링해 자동 수집
- 학생은 Google 계정으로 로그인 후 메뉴에 맛·양·가성비 3축 별점과 코멘트를 남길 수 있음
- 목표: 오늘 뭐 먹을지 4탭(홈·주간·전체메뉴·프로필) 이내로 결정, 리뷰 신뢰도 확보

---

이 디렉토리는 프로젝트의 **활성 플랜과 진행 상황**을 담는다. 설계 의도(변하지 않음) / 실행 명세(Phase 단위) / 진행 상태(변함)를 **역할별 파일**로 분리해 중복 없이 관리한다.

---

## 활성 플랜

### [UI/UX 전면 개편](./ui-ux-redesign/) (진행 중)

2026-04-18 확정된 v2 UI/UX 개편. 4탭 구조 + 3축 별점 + 프로필 탭 + 사진 업로드.

읽는 순서:
1. [`00-overview.md`](./ui-ux-redesign/00-overview.md) — 결정 사항·의존성·배포 전략
2. [`99-progress.md`](./ui-ux-redesign/99-progress.md) — 현재 진행 상태 (체크박스 단일 소스)
3. **다음 작업할 단위의 Phase 파일**만 선택적으로:
   - [`01-phase-a-backend.md`](./ui-ux-redesign/01-phase-a-backend.md) — BE-A-*
   - [`02-phase-b-profile.md`](./ui-ux-redesign/02-phase-b-profile.md) — FE-B-*
   - [`03-phase-c-ui.md`](./ui-ux-redesign/03-phase-c-ui.md) — FE-C-*
   - [`04-phase-d-photo.md`](./ui-ux-redesign/04-phase-d-photo.md) — BE-D-*, FE-D-*

---

## 아카이브

완료되었거나 현재 유효하지 않은 플랜. 참조 전용.

- [`archive/frontend-v1.md`](./archive/frontend-v1.md) — v1 프론트 초기 계획 (디자인 토큰은 `docs/DESIGN.md`에 통합)

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

@./ui-ux-redesign/00-overview.md
@./ui-ux-redesign/99-progress.md
