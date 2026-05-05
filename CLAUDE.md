# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

성결대학교 학식 리뷰 풀스택 앱.
- **Backend**: Spring Boot 3.5 / Java 17 / Gradle 8.14 / PostgreSQL
- **Frontend**: React 19 / Vite / TailwindCSS v3 / React Query v5 / Pretendard CDN
- **Deployment**: Render Singapore (backend `https://sku-cafeteria-n.onrender.com`), Supabase (PostgreSQL), Vercel (frontend) — 전부 무료 플랜
- **Auth**: Google OAuth2 idToken → JWT (`Authorization: Bearer`)

## Commands

**로컬 DB** — 프로젝트 루트
```bash
docker compose up postgres -d           # PostgreSQL만 기동 (로컬 개발 기본)
docker compose --profile full up -d     # BE + DB 통째로 (통합 검증)
```

**Backend** — `backend/`
```bash
./gradlew bootRun                        # dev 프로파일로 실행
./gradlew test                           # 전체 테스트
./gradlew test --tests "com.sungkyul.cafeteria.SomeTest.methodName"
./gradlew compileJava                    # 컴파일만 확인
./gradlew build -x test                  # 테스트 제외 빌드
```

**Frontend** — `frontend/`
```bash
npm run dev      # 개발 서버 (포트 5173)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
```

`frontend/src/api/` — 도메인별 분리: `client.js`(axios 인터셉터) + `auth.js` / `menus.js` / `reviews.js` / `users.js`

## Docs

- @docs/plans/README.md — **활성 플랜 + 진행 상황 허브**
- @docs/architecture.md — 패키지 구조, Auth Flow, Security, Docker, 환경변수
- @docs/api.md — 전체 API 엔드포인트, 에러 형식, Exception → HTTP 매핑
- @docs/conventions.md — 레이어 구조, 도메인 규칙, 엔티티 수정 패턴, 응답 코드
- @docs/DESIGN.md — 프론트 디자인 시스템 v3 Coral (컬러·타이포·컴포넌트 카탈로그)
- 범용 AI(Codex 등) 진입점: [AGENTS.md](AGENTS.md)

## 새 세션 시작 시

- **백엔드 세션**: `@docs/onboarding/backend.md 를 읽고 순서대로 실행해줘.`
- **프론트엔드 세션**: `@docs/onboarding/frontend.md 읽고 실행해줘.`

## 개발 규칙 (핵심)

- 한 번에 하나의 단위(V3-T2 등)만 구현. 커밋 메시지에 ID 포함
- 단위 완료 시 `docs/plans/coral-redesign/99-progress.md` 체크박스만 갱신
- 신규 v3 Coral 컴포넌트는 `frontend/src/components/coral/` 하위 (`components/hi/`는 v2, `components/`는 v1 — Phase v3-3에서 일괄 삭제)
- `position: fixed` UI는 `createPortal(…, document.body)` 사용
- FE 검증: 375 / 768 / 1280 뷰포트 브라우저 확인 — 컴포넌트 단위는 `/dev/components` 카탈로그로
- `git commit` / `git push` 자동으로 진행

## /init 규칙

- 이 파일은 **70줄 이내** 유지. 세부 내용은 docs/ 에 위임
- 새 패키지/클래스 → `docs/architecture.md`, 새 API → `docs/api.md`
- 플랜 단위 완료 → `docs/plans/<feature>/99-progress.md`, 새 규칙 → `docs/conventions.md`
- 긴 코드 예시·전체 API 목록·상세 패키지 구조는 이 파일에 직접 추가 금지
