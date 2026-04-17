# Frontend Design System

## [1] 디자인 컨셉

**"Bold & Fresh"** — Zomato 스타일의 강렬한 레드 포인트로 식욕을 자극하는 UI.

- 레퍼런스: Zomato 앱 (레드 포인트 컬러 + 화이트 + 딥 네이비, bold 카드 UI, 음식 사진 중심)
- 타겟: 대학생, 빠른 정보 탐색 (오늘 학식 확인 → 리뷰 작성까지 3탭 이내)
- 전략: 모바일 우선(375px 기준), 반응형 확장

---

## [2] 컬러 팔레트

```css
:root {
  /* Primary */
  --color-primary: #D94148;
  --color-primary-dark: #B93540;
  --color-primary-light: #FDEAEB;

  /* Neutral */
  --color-bg: #FFFFFF;
  --color-surface: #F8F8F8;
  --color-border: #EFEFEF;

  /* Text */
  --color-text-primary: #1C1C1C;
  --color-text-secondary: #6B6B6B;
  --color-text-muted: #A0A0A0;

  /* Semantic */
  --color-star: #FBBF24;
  --color-success: #22C55E;
  --color-error: #D94148;
}
```

---

## [3] 타이포그래피

| 역할 | 폰트 | 비고 |
|---|---|---|
| 한국어 본문/UI | Pretendard | 기본 폰트 |
| 영문 강조/타이틀 | DM Serif Display | 헤더·브랜딩 강조 |

### 사이즈 스케일

| 토큰 | 크기 | 용도 |
|---|---|---|
| `--text-xs` | 12px | 날짜, 메타 정보 |
| `--text-sm` | 14px | 보조 텍스트, 뱃지 |
| `--text-base` | 16px | 본문, 리뷰 코멘트 |
| `--text-lg` | 18px | 카드 메뉴명 |
| `--text-xl` | 22px | 섹션 타이틀 |
| `--text-2xl` | 26px | 페이지 헤더 |
| `--text-3xl` | 30px | 브랜드 타이틀 |

---

## [4] 스페이싱 & 레이아웃

### 반응형 브레이크포인트

| 환경 | 기준 | 좌우 패딩 | 최대 너비 |
|---|---|---|---|
| 모바일 | 375px | 16px | 100% |
| 태블릿 | 768px | 24px | 100% |
| 데스크탑 | 1280px | 24px | 1100px (중앙 정렬) |

### 카드 그리드

```
모바일(~767px)  : 1열
태블릿(768px~)  : 2열
데스크탑(1280px+): 3열
```

### 간격 토큰

```css
:root {
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-10: 40px;
}
```

---

## [5] 컴포넌트 명세

### MenuCard
음식 사진 + 메타 정보를 담는 핵심 카드.

```
┌─────────────────────┐
│  [음식 사진]         │  ← aspect-ratio 4:3, object-fit cover
│  [코너 뱃지]         │  ← 좌상단 absolute, --color-primary 배경
├─────────────────────┤
│  메뉴명 (bold)       │
│  ★★★★☆  4.2  (12)  │  ← StarDisplay + 평균별점 + 리뷰수
└─────────────────────┘
```

- Props: `menuId`, `name`, `corner`, `imageUrl?`, `averageRating`, `reviewCount`
- 클릭 시 메뉴 상세 모달 오픈

### StarDisplay
표시 전용 별점 컴포넌트.

- Props: `rating` (1.0~5.0, 소수점 허용), `size?: 'sm' | 'md' | 'lg'`
- 0.5 단위 반 별 표시
- 색상: `--color-star` (#FBBF24)

### StarRating
리뷰 작성용 별점 입력 컴포넌트.

- Props: `value`, `onChange`
- hover 시 해당 별까지 채워짐, 클릭으로 확정
- 애니메이션: 선택 시 `scale(1.2) 0.1s ease`

### ReviewItem
리뷰 한 건 표시.

```
[아바타] 닉네임          날짜
         ★★★★☆
         코멘트 텍스트...
         [수정] [삭제]   ← isMine일 때만 노출
```

- Props: `reviewId`, `authorName`, `avatarUrl?`, `rating`, `comment?`, `createdAt`, `isMine`

### WeekTab
월~금 날짜 탭, 가로 스크롤.

```
[월 4/14] [화 4/15] [수 4/16▶] [목 4/17] [금 4/18]
```

- 오늘 날짜 자동 선택, 선택된 탭은 `--color-primary` 언더라인 + bold
- 모바일에서 overflow-x: auto, 스크롤바 숨김

### BottomNav
모바일 하단 고정 네비게이션.

```
[홈]     [주간표]   [전체리뷰]
 🏠        📅          ⭐
```

- 아이콘: lucide-react (`Home`, `CalendarDays`, `Star`)
- 활성 탭: `--color-primary`, 비활성: `--color-text-muted`
- `position: fixed; bottom: 0` + safe-area-inset 대응

### Toast
성공/실패 알림.

- Props: `message`, `type: 'success' | 'error'`
- 화면 상단 중앙 고정, 2초 후 fadeOut 자동 소멸
- success: `--color-success` 좌측 보더, error: `--color-error` 좌측 보더

### SkeletonCard
MenuCard 로딩 플레이스홀더.

- MenuCard와 동일한 크기/레이아웃
- shimmer 애니메이션: `background: linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%)` → 1.5s infinite

---

## [6] 페이지 레이아웃

### 홈 `/`
오늘 학식을 코너별 카드 그리드로 표시.

```
┌─────────────────────────────┐
│  성결 학식     [로그인 버튼]  │  ← 헤더
├─────────────────────────────┤
│  오늘 4월 17일 (목)          │  ← 날짜 타이틀
│                             │
│  [MenuCard] [MenuCard]      │  ← 카드 그리드
│  [MenuCard] [MenuCard]      │
└─────────────────────────────┘
│  [홈]  [주간표]  [전체리뷰]  │  ← BottomNav
```

### 주간표 `/weekly`
날짜 탭으로 요일별 메뉴 확인.

```
┌─────────────────────────────┐
│  이번 주 학식                │
├─────────────────────────────┤
│  [월] [화] [수▶] [목] [금]  │  ← WeekTab
├─────────────────────────────┤
│  [MenuCard]                 │
│  [MenuCard]                 │
└─────────────────────────────┘
```

### 전체 리뷰 `/reviews`
검색 + 정렬 + 전체 메뉴 카드 목록.

```
┌─────────────────────────────┐
│  전체 메뉴                   │
│  [🔍 검색창                ] │
│  정렬: [별점↓] [리뷰수↓] [날짜↓] │
├─────────────────────────────┤
│  [MenuCard] [MenuCard]      │
│  [MenuCard] [MenuCard]      │
└─────────────────────────────┘
```

### 메뉴 상세 (모달)
MenuCard 클릭 시 바텀시트 형태로 오버레이.

```
┌─────────────────────────────┐
│  ✕                          │
│  [음식 사진]                 │
│  메뉴명         ★ 4.2 (12)  │
│  코너 뱃지 • 날짜            │
├─────────────────────────────┤
│  리뷰 작성 (로그인 시)        │
│  ★★★★☆  [코멘트 입력]  [등록] │
├─────────────────────────────┤
│  리뷰 목록                   │
│  [ReviewItem]               │
│  [ReviewItem]               │
└─────────────────────────────┘
```

### 내 리뷰 `/my-reviews`
로그인 필요. 내가 작성한 리뷰 전체 목록.

```
┌─────────────────────────────┐
│  내 리뷰                    │
├─────────────────────────────┤
│  [ReviewItem] ← [수정][삭제] │
│  [ReviewItem] ← [수정][삭제] │
└─────────────────────────────┘
```

---

## [7] 애니메이션

| 대상 | 효과 | 지속 시간 |
|---|---|---|
| 카드 hover | `translateY(-2px)` | `0.2s ease` |
| 페이지 진입 | `fadeInUp` (opacity 0→1, translateY 12px→0) | `0.3s ease` |
| 별점 선택 | `scale(1.2)` | `0.1s ease` |
| 스켈레톤 shimmer | 좌→우 그라디언트 sweep | `1.5s infinite` |
| 모달 진입 | `fadeIn` (overlay) + `slideUp` (시트) | `0.2s ease` |

```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
```

---

## [8] 참고 라이브러리

| 라이브러리 | 용도 |
|---|---|
| `lucide-react` | 아이콘 (`Home`, `CalendarDays`, `Star`, `X`, `Search` 등) |
| `@react-oauth/google` | 구글 로그인 버튼 (`useGoogleLogin`) |
| `@tanstack/react-query` | 서버 상태 관리 (캐싱, 로딩/에러 상태, 낙관적 업데이트) |
