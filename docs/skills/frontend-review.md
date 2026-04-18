# Skill: frontend-review

새로운 프론트엔드 Claude Code 세션 시작 시 실행하는 Skill.

## 실행 순서

### Step 1. `docs/plans/README.md` 읽기

- 활성 플랜 목록 + 구조 파악

### Step 2. 활성 플랜 `00-overview.md` 읽기

- 4탭 구조·결정 사항·의존성 그래프 숙지
- 설계 드리프트 기록 숙지 (닉네임 단일화, menus 정규화)

### Step 3. 활성 플랜 `99-progress.md` 읽기

- 완료된 FE-B / FE-C / FE-D 단위 확인
- 다음 작업 대상 FE-* 단위 확인

### Step 4. 다음 단위의 Phase 파일 선택적 읽기

- FE-B-* → `02-phase-b-profile.md`의 해당 단위 섹션
- FE-C-* → `03-phase-c-ui.md`의 해당 단위 섹션
- FE-D-* → `04-phase-d-photo.md`의 해당 단위 섹션

**반드시 해당 단위 섹션만 읽는다** — 다른 Phase 파일 전체를 스캔하지 않는다.

### Step 5. 디자인 토큰 확인 (필요 시)

- `docs/DESIGN.md` — 컬러/타이포/브레이크포인트/애니메이션

### Step 6. frontend/ 폴더 구조 + 최근 커밋

- `frontend/src/` 하위 확인
- `git log --oneline -5`

---

## Step 7. 요약 출력 (아래 형식)

---

## 프론트엔드 현황 요약

### 완료된 단계
(`99-progress.md`의 체크된 FE-* 항목 나열)

### 다음 작업 — [FE-N 이름]
- **작업 파일**: 해당 Phase md 링크
- **구현 파일**: (생성/수정할 파일 목록)
- **컴포넌트 Props** (해당되면): (시그니처)
- **React Query 키** (해당되면)
- **브라우저 검증 체크리스트** (375 / 768 / 1280):
  - [ ] (검증 항목 1)
  - [ ] (검증 항목 2)
- **선행 의존성**: (BE-A-* / FE-B-* 등)

### 현재 이슈
(`99-progress.md`의 Known Issues)

---

## 주의사항

- `~/.claude/plans/` 사설 디렉토리는 **참조하지 말 것** — 모든 컨텍스트는 `docs/plans/`에 있음
- `docs/plans/archive/frontend-v1.md`는 **아카이브**, 디자인 토큰 확인 외에는 읽지 말 것
- 구현 완료 후 `docs/plans/ui-ux-redesign/99-progress.md` 체크박스만 갱신
- `position: fixed` UI는 `createPortal(…, document.body)` 사용
- `git commit` / `git push`는 사용자가 직접 진행 — Claude는 커밋하지 않음
