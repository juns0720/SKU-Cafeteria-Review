# Skill: frontend-review

새로운 프론트엔드 Claude Code 세션 시작 시 실행하는 Skill.

## 실행 순서

### Step 1. docs/frontend-progress.md 읽기

- 완료된 단계 확인
- 다음 작업 확인
- 현재 이슈 확인

### Step 2. frontend/ 폴더 구조 스캔

- frontend/ 폴더가 있으면 하위 파일 구조 확인
- frontend/ 폴더가 없으면 "아직 프로젝트 생성 전" 으로 표시

### Step 3. 최근 커밋 확인

- git log --oneline -5 실행

### Step 4. 요약 출력 (아래 형식 그대로)

---

## 프론트엔드 현황 요약

### 완료된 단계

(frontend-progress.md의 체크된 항목 나열)

### 다음 작업

(frontend-progress.md의 "다음 작업" 항목)

### 현재 이슈

(frontend-progress.md의 "현재 이슈" 항목)

---

## 주의사항

- FRONTEND_PLAN.md는 읽지 말 것 (토큰 낭비)
- 특정 단계 상세 내용이 필요할 때만 FRONTEND_PLAN.md에서 해당 FE-N 부분만 읽을 것
