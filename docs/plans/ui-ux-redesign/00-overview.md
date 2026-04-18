# UI/UX 전면 개편 — Overview

> **역할**: 이 플랜의 결정 사항·의존성·배포 전략을 기록한다. 변하지 않는 설계 기준.
> **변함**: 진행 상태는 [`99-progress.md`](./99-progress.md), 실행 명세는 `01-phase-*.md` 참조.

---

## Context

기존 3탭(홈·주간·리뷰) 구조는 탭 간 역할이 겹치고, 리뷰는 단일 별점이라 신빙성이 약하며, 사용자 정체성(Google 표시명 그대로)이 드러나지 않는다. 2026-04-18 다음 방향으로 전면 개편한다:

- **4탭** (홈·주간·전체메뉴·프로필) — 역할 분리
- **3축 별점**(맛·양·가성비) + 사진 — 리뷰 신빙성 강화
- **커스텀 닉네임** + 리뷰수 뱃지 — 사용자 정체성
- **코너 카테고리 필터** — 탐색 효율
- **주간표**(행=코너·열=요일) — 주간 탭을 '열람 전용'으로 재정의

---

## 확정된 결정

| 항목 | 결정 | 근거 |
|---|---|---|
| 탭 구조 | 홈 / 주간 / 전체 메뉴 / 프로필 (4탭) | 역할 분리 |
| 이미지 저장소 | Cloudinary 무료 25GB | MVP 속도 |
| 별점 스키마 | 3축(`tasteRating`/`amountRating`/`valueRating`) 1~5점, 기존 `rating` DROP | 세부 평가 |
| 베스트 기준 | 이번 주 제공 + 리뷰 ≥ 3 + 평균 별점 desc, 상위 2건 | 신뢰도 하한 |
| 뱃지 임계값 | 🥉 1~9 / 🥈 10~29 / 🥇 30+ (`BadgeTier.of(long)`) | 보통 수준 |
| 주간표 | 행=코너, 열=요일, 가로 스크롤 | 코너 라인업 비교 |
| 전체 메뉴 범위 | 모든 날짜의 모든 메뉴 (`scope=all`) | 빈 메뉴도 노출 |
| New 뱃지 | 해당 주(월~일) 내내 노출 | 단순 규칙 |
| 닉네임 | **단일 `nickname` 필드** + `isNicknameSet` 플래그, 2~12자, UNIQUE | 구현 단순성 |
| DB 마이그레이션 | **Flyway** (BE-A-1에서 도입) | prod=`ddl-auto=validate` 자동화 |
| 메뉴 스키마 | `menus(name, corner)` + `menu_dates(menu_id, served_date)` **정규화** | 중복 제거, 첫 등장일 파생 가능 |
| `firstSeenAt` | **별도 컬럼 없이 `MIN(menu_dates.served_date)` 파생** | 정규화로 자연 유도 |

---

## 설계 드리프트 기록 (중요)

초기 설계와 구현이 달라진 부분. 새 세션이 혼동하지 않도록 근거를 남긴다.

### 1) 닉네임 2-필드 → 단일 필드 (V3 → V4)

- **초기 설계**: `customNickname`(UNIQUE, nullable) + `nickname`(Google 표시명, 재로그인 시 덮어씀) 2-필드
- **실제 구현**: `nickname` 단일 + `isNicknameSet` 플래그. Google 재로그인 시 `updateProfile()`이 `isNicknameSet=false`일 때만 nickname을 덮어씀.
- **근거**: 동작이 동일하고 컬럼이 하나 줄어 단순. DB 스키마상으론 V3에서 custom_nickname 추가 → V4에서 drop 후 is_nickname_set 추가. 마이그레이션 역사는 그대로 보존.

### 2) Menu 스키마 2-테이블 정규화 (BE-A-0, V2)

- **초기 설계**: `menus(name, corner, served_date)` 단일 테이블, UNIQUE(name, corner, served_date)
- **실제 구현**: `menus(name, corner)` + `menu_dates(menu_id, served_date)`. 동일 (name, corner) 메뉴가 여러 날짜에 서빙되어도 Menu 1건.
- **효과**:
  - `firstSeenAt` 별도 컬럼 불필요 → `MIN(menu_dates.served_date)` 파생
  - `isNew` = `MIN(menu_dates.served_date) >= 이번 주 월요일`
  - 중복 Menu 제거, 리뷰는 Menu에 1:N 고정

---

## Phase 의존성 그래프

```
[BE]
  BE-A-1 (Flyway) ──┬── BE-A-0 (menus 정규화, V2)  ← 완료
                    ├── BE-A-2a/b/c (닉네임, V3/V4) ← 완료
                    ├── BE-A-3a/b/c/d (3축 별점 + imageUrl, V5~V7)
                    ├── BE-A-6a/b (BadgeTier)
                    └── BE-A-5a/b/c/d/e (Menu API + N+1)
                                                 │
                              ┌──────────────────┘
                              ↓
                         BE-A-7 (배포)
                              │
                              ↓
[FE]       FE-B-1 (API) ── FE-B-2 (Nav) ── FE-B-3 (Nickname) ── FE-B-4 (Profile)
                                                                     │
                          ┌──────────────────────────────────────────┘
                          ↓
           FE-C-1 · FE-C-2 → FE-C-3 · FE-C-4 · FE-C-5 → FE-C-6 → FE-C-7 (배포)
                                                                     │
                                                                     ↓
                                              BE-D-1 → BE-D-2 → FE-D-3
```

---

## 배포·브랜치 전략

### 배포 순서 (중요)

1. **Phase A 단독 배포**: BE만 Railway에 먼저 배포. 이 시점엔 리뷰 생성 API 시그니처가 바뀌므로 **기존 프론트의 리뷰 작성 기능이 일시적 비정상** → FE Phase B·C는 반드시 feature 브랜치에서 진행 후 일괄 머지.
2. **Phase B + C 일괄 배포**: feature 브랜치 완료 → Vercel preview → main 머지 → Vercel 프로덕션.
3. **CORS 갱신**: 프론트 도메인이 바뀔 때만 `SecurityConfig.corsConfigurationSource()` 수정 후 BE 재배포.
4. **Phase D**: BE → 환경변수 → FE 순.

### 브랜치

- `feat/be-phase-a-remainder` — 잔여 BE-A-3/5/6
- `feat/fe-profile-phase-b`
- `feat/fe-ui-phase-c`
- `feat/photo-upload-phase-d`

### 롤백

- Flyway Community Edition은 Undo 미지원.
- **V6의 `rating` DROP은 되돌리기 불가** → Phase A 배포 전 **반드시 Railway PG 스냅샷 확보**.
- 문제 시 스냅샷 복원 + 이전 커밋 재배포.

---

## 환경변수 추가 요약

| 변수 | 위치 | 도입 시점 |
|---|---|---|
| (없음) | — | Phase A |
| `CLOUDINARY_CLOUD_NAME` | Railway | Phase D-2 |
| `CLOUDINARY_API_KEY` | Railway | Phase D-2 |
| `CLOUDINARY_API_SECRET` | Railway | Phase D-2 |

---

## 비-목표 (이번 개편 범위 밖)

- RefreshToken 자동 재로그인 (별도 트랙)
- 뱃지 에셋 실제 디자인 (🥉🥈🥇 이모지 플레이스홀더로 시작)
- 관리자 UI, 댓글·좋아요, 푸시 알림, 소셜 공유
- Flyway Undo 기반 롤백 (CE 미지원)

---

## 재사용 자산

| 자산 | 경로 | 재사용 위치 |
|---|---|---|
| `useAuth` | `frontend/src/hooks/useAuth.js` | FE-B-3, FE-B-4 |
| `useToast` | `frontend/src/hooks/useToast.jsx` | 전 Phase |
| `StarDisplay`·`StarRating` | `frontend/src/components/` | FE-C-2 내부 |
| `MenuCard` | `frontend/src/components/MenuCard.jsx` | FE-C-3, FE-C-5 (isNew prop 추가) |
| `MenuDetailModal` | `frontend/src/components/MenuDetailModal.jsx` | FE-C-6 (폼 교체) |
| `SkeletonCard` | `frontend/src/components/SkeletonCard.jsx` | 로딩 상태 |
| `api/client.js` | `frontend/src/api/client.js` | 인터셉터 그대로 |
| `MenuCrawlerService` | backend `crawler/service/` | 기존 유지 (menu_dates 대응은 이미 완료) |
| `GlobalExceptionHandler` | backend `common/exception/` | 신규 유효성 예외 자동 처리 |
| 디자인 토큰 | [`docs/DESIGN.md`](../../DESIGN.md) | 컬러·타이포·애니메이션 |
