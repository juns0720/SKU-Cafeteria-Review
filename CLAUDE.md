# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

성결대학교 학식 리뷰 풀스택 앱.
- **Backend**: Spring Boot 3.5 / Java 17 / Gradle 8.14 / PostgreSQL
- **Frontend**: React 19 / Vite / TailwindCSS v3 / React Query v5
- **Deployment**: Railway (backend), Vercel (frontend)
- **Auth**: Google OAuth2 idToken → JWT (`Authorization: Bearer`)

## Commands

**Backend** — `backend/` 디렉토리에서 실행

```bash
./gradlew bootRun                  # 개발 서버 실행 (dev 프로파일)
./gradlew build -x test            # 빌드 (테스트 제외)
./gradlew test                     # 전체 테스트
./gradlew test --tests "com.sungkyul.cafeteria.SomeTest.methodName"
./gradlew compileJava              # 컴파일 확인
```

**Frontend** — `frontend/` 디렉토리에서 실행

```bash
npm run dev      # 개발 서버 (기본 포트 5173, 충돌 시 자동 증가)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 검사
```

## Docs

- @docs/plans/README.md — **활성 플랜 + 진행 상황 허브** (현재는 UI/UX 개편)
- @docs/architecture.md — 패키지 구조, Auth Flow, Security 규칙, Crawler, Configuration
- @docs/api.md — 전체 API 엔드포인트, 에러 응답 형식, Exception → HTTP Status 매핑
- @docs/conventions.md — 레이어 구조, 도메인 규칙, 엔티티 수정 패턴, 응답 코드 규칙
- @docs/DESIGN.md — 프론트 디자인 시스템 (컬러·타이포·애니메이션)

## /init 규칙

/init 실행 시 아래 규칙을 따를 것:

1. CLAUDE.md는 70줄 이내로 유지
    - 핵심 정보만 (스택, 패키지 루트, 포트, 배포)
    - 나머지는 docs/ 파일에 위임

2. 변경 사항 반영 위치
    - 새 패키지/클래스 추가 → docs/architecture.md 업데이트
    - 새 API 추가 → docs/api.md 업데이트
    - 플랜 단위 완료 → docs/plans/<feature>/99-progress.md 체크리스트 업데이트
    - 새 규칙/컨벤션 → docs/conventions.md 업데이트

3. CLAUDE.md에 직접 추가하지 말 것
    - 긴 코드 예시
    - 전체 API 목록
    - 상세 패키지 구조

## 새 세션 시작 시

- **백엔드 세션**: `@docs/skills/project-review.md 를 읽고 순서대로 실행해줘.`
- **프론트엔드 세션**: `@docs/skills/frontend-review.md 읽고 실행해줘.`

## 프론트엔드 개발 방식

- 기능 단위: FE-B-1처럼 최소 단위로 쪼개서 구현, 한 번에 하나만
- 구현 완료 후 `docs/plans/ui-ux-redesign/99-progress.md` 체크박스 업데이트
- `position: fixed` UI(모달 등)는 `createPortal(…, document.body)` 사용 — transform 조상의 stacking context 우회
- 검증: 브라우저에서 눈으로 확인 (375 / 768 / 1280 뷰포트)