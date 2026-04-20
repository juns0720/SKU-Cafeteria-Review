# Backend Session Onboarding Checklist

새 세션 시작 시 프로젝트 전체를 빠르게 파악하기 위한 체크리스트 (백엔드 세션 공통).

## 목적

- 새 세션 시작 시 프로젝트 컨텍스트 자동 파악
- 활성 플랜과 진행 상황 확인 → 바로 다음 단위 착수 가능

---

## 실행 순서

### Step 1. `docs/plans/README.md` 읽기

- 현재 활성 플랜 목록 확인
- 각 플랜의 overview / progress 링크 확인

### Step 2. 활성 플랜 `00-overview.md` 읽기

- 결정 사항, 비-목표, 의존성 그래프 파악
- 설계 드리프트 기록(있다면) 숙지

### Step 3. 활성 플랜 `99-progress.md` 읽기

- 완료된 단위 / 다음 작업 대상 단위 확인
- Known Issues 확인

### Step 4. 다음 단위의 Phase 파일 선택적 읽기

- `99-progress.md`에서 다음 단위 ID (예: BE-A-3a) 확인
- 해당 단위가 속한 `NN-phase-*.md`에서 **해당 단위 섹션만** 정독
  - SQL 마이그레이션, 파일 경로, 검증 기준 숙지

### Step 5. 참조 문서 (필요 시)

- `docs/architecture.md` — 패키지 구조·Auth·Security
- `docs/api.md` — 기존 API 시그니처
- `docs/conventions.md` — 코드/도메인 규칙

### Step 6. 현재 코드베이스 스캔

- `backend/src/main/java/com/sungkyul/cafeteria/` 하위 구조 확인
- 최근 변경 (`git log --oneline -10`, `git status`)

---

## Step 7. 요약 출력 (아래 형식)

---

## 프로젝트 현황 요약

### 활성 플랜
- (플랜 이름) — (overview 한 줄 요약)

### 완료된 단위
- [x] 완료 단위 ID 나열 (최근 5개 정도)

### 다음 작업
- **다음 단위 ID**: (예: BE-A-3a)
- **작업 파일**: (해당 Phase md 링크)
- **요지**: (1~2줄 요약)
- **선행 의존성**: (있으면)

### 주의사항 (Known Issues)
- (목록 나열)

---

## 주의사항

- `docs/plans/` 외부의 과거 플랜 파일은 존재하지 않음 (삭제되었음)
- 구현 완료 후 **`docs/plans/<feature>/99-progress.md`만** 체크박스 갱신 (중복 갱신 X)
- `git commit` / `git push`는 사용자가 직접 진행 — AI는 커밋하지 않음
