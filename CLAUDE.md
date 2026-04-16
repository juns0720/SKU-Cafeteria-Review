# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

성결대학교 학식 리뷰 앱의 백엔드 서버.
- **Stack**: Spring Boot 3.5 / Java 17 / Gradle 8.14 / PostgreSQL
- **Deployment**: Railway (backend), Vercel (frontend)
- **Auth**: Google OAuth2 + JWT (구현 예정)

## Commands

모든 Gradle 명령은 `backend/` 디렉토리에서 실행한다.

```bash
# 개발 서버 실행 (dev 프로파일)
./gradlew bootRun

# 프로파일 지정 실행
./gradlew bootRun --args='--spring.profiles.active=prod'

# 빌드 (테스트 포함)
./gradlew build

# 빌드 (테스트 제외)
./gradlew build -x test

# 전체 테스트
./gradlew test

# 단일 테스트 클래스 실행
./gradlew test --tests "com.sungkyul.cafeteria.SomeTest"

# 단일 테스트 메서드 실행
./gradlew test --tests "com.sungkyul.cafeteria.SomeTest.methodName"

# 컴파일만 확인
./gradlew compileJava
```

## Architecture

### Package Structure

```
com.sungkyul.cafeteria
├── CafeteriaApplication.java          # @SpringBootApplication 진입점
└── common/                            # 기능 도메인과 무관한 횡단 관심사
    ├── config/SecurityConfig.java     # Security + CORS 설정
    ├── controller/HealthController.java  # GET /api/v1/health
    └── exception/
        ├── ErrorResponse.java         # 공통 에러 응답 record
        └── GlobalExceptionHandler.java   # @RestControllerAdvice
```

새 기능은 도메인별 패키지로 추가한다 (예: `menu/`, `review/`, `user/`). 각 도메인 패키지 내부는 `controller` → `service` → `repository` → `domain` 레이어로 구성한다.

### API Convention

- 모든 엔드포인트 prefix: `/api/v1/`
- 에러 응답은 반드시 `ErrorResponse` record 형식 사용 (`GlobalExceptionHandler`가 자동 처리)
- 새로운 예외 타입이 필요하면 `GlobalExceptionHandler`에 `@ExceptionHandler` 추가

### Configuration Profiles

| 프로파일 | 용도 | ddl-auto | 활성화 방법 |
|---------|------|----------|------------|
| `dev` (기본) | 로컬 개발 | `update` | 기본값 |
| `prod` | Railway 배포 | `validate` | `SPRING_PROFILES_ACTIVE=prod` |

prod 프로파일의 DB 연결 정보는 환경변수 `SPRING_DATASOURCE_URL` / `SPRING_DATASOURCE_USERNAME` / `SPRING_DATASOURCE_PASSWORD` 로 주입한다.

### Security

현재 모든 요청 `permitAll`. JWT 필터를 추가할 때는 `SecurityConfig.filterChain()` 안에서 `http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)` 패턴을 사용하고, `authorizeHttpRequests` 규칙을 세분화한다.

CORS 허용 오리진은 `SecurityConfig.corsConfigurationSource()`에서 관리한다. 배포 시 Vercel 도메인을 추가해야 한다.

## Pending Cleanup

- `backend/src/main/java/com/example/sku_cafeteria_review/` — 구 패키지 디렉토리, 삭제 필요
- `backend/src/test/java/com/example/sku_cafeteria_review/` — 구 테스트 클래스, 삭제 필요
- `backend/src/main/resources/application.yaml` — `application.yml`로 대체됨, 삭제 필요
