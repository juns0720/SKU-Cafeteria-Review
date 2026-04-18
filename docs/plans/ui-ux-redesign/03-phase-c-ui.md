# Phase C — 홈 / 주간 / 전체 메뉴 개편

> **역할**: 메인 3개 페이지 전면 재작성. 진행 상태는 [`99-progress.md`](./99-progress.md).
> **선행**: Phase B 완료.

---

## FE-C-1 · CornerTabs 공통 컴포넌트

### 신규 `frontend/src/components/CornerTabs.jsx`
- Props: `{ value: string | null, onChange: (corner|null) => void, corners: string[] }`
- 첫 번째 칩 "전체" (value = null)
- 가로 스크롤 (`overflow-x-auto`, 모바일 터치 스크롤)
- 활성 칩 `bg-primary text-white`, 비활성 `bg-surface`

### 데이터 재사용
- `useQuery(['menus', 'corners'], getCorners, { staleTime: 1000 * 60 * 5 })`
- HomePage·AllMenusPage가 공유

**검증**: 빈 배열·긴 코너 목록·모바일 스크롤

**의존성**: FE-B-1

---

## FE-C-2 · MultiStarRating / MultiStarDisplay

### 신규 `frontend/src/components/MultiStarRating.jsx`
- Props: `{ values: { taste: number, amount: number, value: number }, onChange: (values) => void }`
- 3행 (맛 / 양 / 가성비) × 기존 `StarRating` 재사용
- 모두 1~5 선택 완료 시 상위 폼에서 등록 버튼 활성화 판단

### 신규 `frontend/src/components/MultiStarDisplay.jsx`
- Props: `{ taste, amount, value, size?: 'sm' | 'md' }`
- 3행 읽기 전용, 기존 `StarDisplay` 재사용

**검증**: 375 뷰포트에서 한 줄에 라벨+별 5개 맞는지

**의존성**: 없음 (FE-B와 병렬 가능)

---

## FE-C-3 · HomePage 재작성

### 재작성 `frontend/src/pages/HomePage.jsx`
레이아웃:
```
┌──────────────────────────────────┐
│ 🏆 이번 주 BEST                   │  ← BestMenuBanner (2개)
│ [MenuCard] [MenuCard]            │
├──────────────────────────────────┤
│ 오늘의 메뉴                       │
│ [CornerTabs: 전체 | 한식 | ...]   │
│ 🔍 검색  [정렬▼]                 │
│ ┌────┬────┐                      │
│ │Card│Card│  grid-cols-2         │
│ │Card│Card│  md:grid-cols-3      │
│ └────┴────┘  lg:grid-cols-4      │
└──────────────────────────────────┘
```

### 신규 `frontend/src/components/BestMenuBanner.jsx`
- Props: `{ menus: MenuResponse[] }` (최대 2개)
- 빈 배열이면 섹션 생략

### 수정 `frontend/src/components/MenuCard.jsx`
- `isNew?: boolean` prop 추가 (옵셔널 배지 슬롯, HomePage에선 미사용, WeeklyPage/AllMenusPage에서 사용)

### 데이터
- `useQuery(['menus', 'today', corner], () => getTodayMenus({ corner }))`
- `useQuery(['menus', 'best'], getBestMenus)` — BestMenuBanner
- 정렬·검색은 클라이언트 사이드 필터 (오늘 메뉴는 수가 적음)

**뷰포트 검증**: 375/768/1280
- 375: 2열, 카드 가로 꽉 참
- 768: 3열
- 1280: 4열, 최대 1100px 중앙 정렬

**검증 시나리오**:
1. 코너 칩 전환 → 카드 필터링
2. 검색 input → 이름 부분 일치 필터
3. 정렬 (이름/평균/리뷰수) → 클라 정렬
4. 카드 클릭 → MenuDetailModal 오픈
5. 리뷰 3건 미만이면 BEST 배너 섹션 숨김

**의존성**: FE-C-1, FE-C-6 (모달 완성 전엔 기존 MenuDetailModal 사용)

---

## FE-C-4 · WeeklyPage 재작성

### 재작성 `frontend/src/pages/WeeklyPage.jsx`
레이아웃:
```
┌──────────────────────────────────┐
│ ✨ 이번 주 신메뉴                  │  ← NewMenuBanner (isNew=true만)
│ [Card] [Card] [Card]             │     없으면 섹션 생략
├──────────────────────────────────┤
│ 주간 식단                         │
│          월   화   수  [목]  금   │  ← 오늘 요일 하이라이트
│ ┌─────┬────┬────┬────┬────┬────┐│
│ │한식 │메뉴│메뉴│ — │메뉴│메뉴 ││  ← sticky left column
│ │양식 │메뉴│ — │메뉴│메뉴│메뉴 ││
│ │분식 │ ...                     ││
│ └─────┴────┴────┴────┴────┴────┘│
│       (모바일: 가로 스크롤)       │
└──────────────────────────────────┘
```

### 신규 `frontend/src/components/WeeklyTable.jsx`
- Props: `{ monday, friday, days: { MON: MenuResponse[], TUE: [], ... } }`
- 헤더: 요일 이름 + 날짜, `오늘 요일`은 `text-primary`
- 왼쪽 열: 코너 라벨 sticky (`sticky left-0 bg-white`)
- 상단 행: 요일 sticky (`sticky top-0 bg-white`)
- 빈 셀: 회색 "—"
- 모바일 `overflow-x-auto`
- 셀 클릭 → MenuDetailModal 오픈

### 신규 `frontend/src/components/NewMenuBanner.jsx`
- Props: `{ menus: MenuResponse[] }` — `isNew=true`인 메뉴만
- 빈 배열이면 null 반환 (렌더 안 함)

### 삭제 `frontend/src/components/WeekTab.jsx`
- 기존 탭 UI 제거

### 데이터
- `useQuery(['menus', 'weekly', dateKey], () => getWeeklyMenus(dateKey))`
- 응답의 `days.MON~FRI` 각각을 코너별로 재그룹핑 (Service에서 이미 요일별로 제공되지만, UI는 코너×요일 매트릭스가 필요)

**코너 추출 로직** (클라이언트):
```js
const allCorners = new Set();
Object.values(days).forEach(list => list.forEach(m => allCorners.add(m.corner)));
const cornerRows = [...allCorners].sort();
```

**뷰포트 검증**: 375/768/1280
- 375: 가로 스크롤 동작
- 768+: 전체 테이블이 화면에 들어옴
- 오늘 요일 열 강조 확인

**검증 시나리오**:
1. 주간 셀 클릭 → 모달 오픈
2. 신메뉴 없는 주 → 상단 배너 섹션 생략
3. 주말(토/일)이면 금요일까지만 표시

**의존성**: FE-B-1, BE-A-5d (isNew)

---

## FE-C-5 · AllMenusPage 신설

### 신규 `frontend/src/pages/AllMenusPage.jsx`
라우트 `/menus` 바인딩 (FE-B-2에서 placeholder로 등록한 자리).

레이아웃: HomePage 하단 부분과 동일 (타이틀만 "전체 메뉴").
- CornerTabs + 검색 + 정렬 + MenuCard grid

### 데이터
- `useQuery(['menus', 'all', sort, corner], () => getAllMenus({ sort, corner, scope: 'all' }))`
- `scope=all` → 리뷰 없는 메뉴까지 포함

### 삭제 `frontend/src/pages/ReviewsPage.jsx`
- 정렬·검색 로직은 AllMenusPage로 이관

**검증 시나리오**:
1. 전체 코너·scope=all → 리뷰 없는 메뉴도 표시 (평균 별점 "-")
2. 정렬 옵션 (rating/reviewCount/date) → 서버 정렬 반영

**의존성**: FE-C-1

---

## FE-C-6 · MenuDetailModal 3축 적용

### 수정 `frontend/src/components/MenuDetailModal.jsx`
- 상단 요약: 메뉴 이름 + 코너 + `MultiStarDisplay` (3축 평균 + 개별 작게)
- 하단 폼:
  - `MultiStarRating` (기존 단일 StarRating 교체)
  - 코멘트 textarea
  - (Phase D에서) 파일 첨부 input
  - 3축 모두 선택 + 필요 시 코멘트 입력해야 등록 버튼 활성화
- 등록 성공 시 `queryClient.invalidateQueries(['reviews', menuId])` + `invalidateQueries(['menus'])`

### 수정 `frontend/src/components/ReviewItem.jsx`
- 3축 점수 칩 (맛 4.0 / 양 5.0 / 가성비 3.0)
- 작성자 뱃지 아이콘 (`BadgeDisplay` 재사용, size='sm')
- 이미지 썸네일 슬롯 (`imageUrl`이 있으면 썸네일, 없으면 빈 상태) — **Phase D에서 실제 라이트박스 연결**

**뷰포트 검증**: 375/768/1280 — 모달 풀 높이/centered 전환, 키보드 대응

**검증 시나리오**:
1. 3축 중 1개만 선택 → 등록 버튼 비활성
2. 3축 모두 선택 → 활성
3. 등록 → 리뷰 목록에 즉시 반영, 메뉴 평균/리뷰수 즉시 갱신
4. 자기 리뷰는 편집/삭제 버튼 노출, 타인 리뷰는 숨김

**의존성**: FE-C-2, FE-B-1, BE-A-3 (배포)

---

## FE-C-7 · 정리 및 배포

### 삭제 확인 체크리스트
- [ ] `frontend/src/pages/ReviewsPage.jsx`
- [ ] `frontend/src/pages/MyReviewsPage.jsx`
- [ ] `frontend/src/components/WeekTab.jsx`

### `docs/plans/ui-ux-redesign/99-progress.md` 체크박스 업데이트

### Vercel 배포
1. PR 머지 → Vercel preview 자동 생성
2. 프론트 URL 확인
3. **백엔드 CORS 갱신 (도메인 변경 시)**: `backend/.../SecurityConfig.corsConfigurationSource()`의 allowed origins에 Vercel 도메인 추가 → 재배포
4. main 머지 → Vercel 프로덕션 배포

**검증**: 프로덕션 URL에서 로그인 → 홈/주간/전체/프로필 전부 정상 → 리뷰 작성/수정/삭제 정상

**의존성**: FE-C-1~C-6
