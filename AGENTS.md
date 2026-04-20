z # AGENTS.md

Universal AI instructions — works with Codex, Claude, Gemini CLI, Cursor, etc.
For Claude Code users, see CLAUDE.md (auto-loads docs context via @import).

## Project Overview

성결대학교 학식 리뷰 풀스택 앱.
- **Backend**: Spring Boot 3.5 / Java 17 / Gradle 8.14 / PostgreSQL
- **Frontend**: React 19 / Vite / TailwindCSS v3 / React Query v5 / Google Fonts(Gaegu, Jua)
- **Deployment**: Render (backend `https://sku-cafeteria-backend.onrender.com`), Supabase (PostgreSQL), Vercel (frontend)
- **Auth**: Google OAuth2 idToken → JWT (`Authorization: Bearer`)

## Commands

**로컬 DB** — 프로젝트 루트
```bash
docker compose up postgres -d           # PostgreSQL만 기동 (로컬 개발 기본)
docker compose --profile full up -d     # BE + DB 통째로 (통합 검증)
```

**Backend** — `backend/`
```bash
./gradlew bootRun
./gradlew test
./gradlew test --tests "com.sungkyul.cafeteria.SomeTest.methodName"
./gradlew compileJava
./gradlew build -x test
```

**Frontend** — `frontend/`
```bash
npm run dev      # 개발 서버 (포트 5173)
npm run build
npm run lint
```

`frontend/src/api/` — 도메인별 분리: `client.js`(axios 인터셉터) + `auth.js` / `menus.js` / `reviews.js` / `users.js`

## Docs

- [Plans & Progress Hub](docs/plans/README.md) — 활성 플랜 + 진행 상황
- [Architecture](docs/architecture.md) — 패키지 구조, Auth Flow, Security, Docker, 환경변수
- [API Reference](docs/api.md) — 전체 엔드포인트, 에러 형식, Exception → HTTP 매핑
- [Conventions](docs/conventions.md) — 레이어 구조, 도메인 규칙, 엔티티 수정 패턴
- [Frontend Design System v2](docs/DESIGN.md) — 컬러·타이포·컴포넌트 카탈로그

## Session Start

새 세션 시작 시 아래 파일을 읽고 체크리스트를 순서대로 실행하세요.

- **백엔드 세션** → [docs/onboarding/backend.md](docs/onboarding/backend.md)
- **프론트엔드 세션** → [docs/onboarding/frontend.md](docs/onboarding/frontend.md)

## Development Rules

- 한 번에 하나의 단위(P3-T2 등)만 구현. 커밋 메시지에 ID 포함
- 단위 완료 시 `docs/plans/ui-ux-redesign/99-progress.md` 체크박스만 갱신
- 신규 v2 컴포넌트는 `frontend/src/components/hi/` 하위 (기존 `components/`는 v1)
- `position: fixed` UI는 `createPortal(…, document.body)` 사용
- FE 검증: 375 / 768 / 1280 뷰포트 — 컴포넌트 단위는 `/dev/components` 카탈로그로
- `git commit` / `git push`는 사용자가 직접
