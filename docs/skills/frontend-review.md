# Skill: frontend-review

새로운 프론트엔드 Claude Code 세션 시작 시 실행하는 Skill.

## 실행 순서

### Step 1. docs/frontend-progress.md 읽기

- 완료된 단계 확인 (FE-1-1 ~ FE-6-3)
- 다음 작업 확인
- 현재 이슈 확인

### Step 2. frontend/ 폴더 구조 스캔

- frontend/ 폴더가 있으면 하위 파일 구조 확인
- frontend/ 폴더가 없으면 "아직 프로젝트 생성 전" 으로 표시

### Step 3. 최근 커밋 확인

- git log --oneline -5 실행

### Step 4. 다음 단계 검증 체크리스트 로드

- frontend-progress.md의 "다음 작업" 항목에서 FE-N 번호 확인
- docs/FRONTEND_PLAN.md에서 해당 FE-N 섹션만 찾아 읽기
- "브라우저 검증" 항목을 추출해 요약에 포함

### Step 5. 요약 출력 (아래 형식 그대로)

---

## 프론트엔드 현황 요약

### 완료된 단계
(frontend-progress.md의 체크된 항목 나열)

### 다음 작업
(frontend-progress.md의 "다음 작업" 항목)

### 구현 전 확인 — [FE-N 이름]
(FRONTEND_PLAN.md 해당 FE-N 섹션의 내용 요약)
- **구현 파일**: (생성/수정할 파일 목록)
- **브라우저 검증 체크리스트**:
  - [ ] (검증 항목 1)
  - [ ] (검증 항목 2)
  - ...
- **다음 단계 의존성**: (완료 후 이어지는 단계)

### 현재 이슈
(frontend-progress.md의 "현재 이슈" 항목)

---

## 주의사항

- FRONTEND_PLAN.md 전체를 읽지 말 것 (토큰 낭비)
- 다음 단계의 FE-N 섹션만 읽을 것
- 구현 완료 후 frontend-progress.md의 해당 항목을 [x]로 체크하고 "다음 작업"을 다음 FE 번호로 업데이트할 것
- git commit / git push 는 실행하지 말 것 — 커밋은 사용자가 직접 진행
