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
├── common/                            # 횡단 관심사
│   ├── config/SecurityConfig.java     # Security + CORS 설정
│   ├── controller/HealthController.java  # GET /api/v1/health
│   └── exception/
│       ├── ErrorResponse.java         # 공통 에러 응답 record
│       └── GlobalExceptionHandler.java   # @RestControllerAdvice
├── user/
│   ├── entity/User.java
│   └── repository/UserRepository.java
├── menu/
│   ├── entity/Menu.java
│   └── repository/MenuRepository.java
└── review/
    ├── entity/Review.java
    └── repository/ReviewRepository.java
```

새 기능은 도메인별 패키지에 `controller` → `service` → `repository` → `entity` 레이어로 추가한다.

### API Convention

- 모든 엔드포인트 prefix: `/api/v1/`
- 에러 응답은 반드시 `ErrorResponse` record 형식 사용 (`GlobalExceptionHandler`가 자동 처리)
- 새로운 예외 타입이 필요하면 `GlobalExceptionHandler`에 `@ExceptionHandler` 추가

### Domain Rules

- **리뷰**: 1인 1메뉴 1리뷰 (`uk_review_user_menu` UNIQUE 제약 — `user_id + menu_id`)
- **별점**: 1~5점 정수 (`@Min(1) @Max(5)`)
- **코멘트**: 최대 500자, nullable (별점만 남길 수 있음)
- **메뉴**: 매주 월요일 자동 크롤링, 수동 트리거 API 별도 제공 예정
  - 중복 방지 UNIQUE 제약: `uk_menu_name_corner_date` (`name + corner + served_date`)

### Configuration Profiles

| 프로파일 | 용도 | ddl-auto | 활성화 방법 |
|---------|------|----------|------------|
| `dev` (기본) | 로컬 개발 | `update` | 기본값 |
| `prod` | Railway 배포 | `validate` | `SPRING_PROFILES_ACTIVE=prod` |

prod 프로파일의 DB 연결 정보는 환경변수 `SPRING_DATASOURCE_URL` / `SPRING_DATASOURCE_USERNAME` / `SPRING_DATASOURCE_PASSWORD` 로 주입한다.

### Security

현재 모든 요청 `permitAll`. JWT 필터를 추가할 때는 `SecurityConfig.filterChain()` 안에서 `http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)` 패턴을 사용하고, `authorizeHttpRequests` 규칙을 세분화한다.

CORS 허용 오리진은 `SecurityConfig.corsConfigurationSource()`에서 관리한다. 배포 시 Vercel 도메인을 추가해야 한다.

## Current Progress

- [x] STEP1: 프로젝트 초기 셋업 (HealthController, SecurityConfig, GlobalExceptionHandler)
- [x] STEP2: DB 스키마 및 Entity (User, Menu, Review + Repository)
- [ ] STEP3: Google OAuth2 + JWT 로그인
- [ ] STEP4: 학식 크롤러
- [ ] STEP5: 메뉴 조회 API
- [ ] STEP6: 리뷰 CRUD API

## Pending Cleanup

- `backend/src/main/java/com/example/sku_cafeteria_review/` — 구 패키지 디렉토리, 삭제 필요
- `backend/src/test/java/com/example/sku_cafeteria_review/` — 구 테스트 클래스, 삭제 필요
- `backend/src/main/resources/application.yaml` — `application.yml`로 대체됨, 삭제 필요
