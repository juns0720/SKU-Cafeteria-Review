# Phase B — 프론트 기반 (프로필 탭)

> **역할**: 프로필 탭 구현 단위. 진행 상태는 [`99-progress.md`](./99-progress.md).
> **선행**: Phase A 배포 완료 (BE-A-7).

---

## FE-B-1 · API 모듈 정리

**목표**: Phase A 신규 API를 프론트에서 소비.

### 신규 `frontend/src/api/menus.js`
```js
export function getTodayMenus({ corner } = {}) { /* GET /menus/today?corner= */ }
export function getWeeklyMenus(date)            { /* GET /menus/weekly?date= */ }
export function getAllMenus({ sort, corner, scope = 'all' } = {}) { /* GET /menus?... */ }
export function getMenuById(id)                 { /* GET /menus/{id} */ }
export function getBestMenus()                  { /* GET /menus/best */ }
export function getCorners()                    { /* GET /menus/corners */ }
```

### 신규 `frontend/src/api/users.js`
```js
export function updateNickname(nickname) {
  return client.patch('/auth/me/nickname', { nickname });
}
```

### 수정 `frontend/src/api/reviews.js`
- `createReview(menuId, { tasteRating, amountRating, valueRating, comment, imageUrl })` — payload를 3축으로
- `updateReview(reviewId, { tasteRating, amountRating, valueRating, comment, imageUrl })`

**검증**: 브라우저 콘솔에서 각 함수 단건 호출 → 응답 확인 (로그인 상태로)

**의존성**: BE-A-7

---

## FE-B-2 · BottomNav 4-way + 라우트

### 수정 `frontend/src/components/BottomNav.jsx`
- 4개 탭: Home / CalendarDays / UtensilsCrossed / User (lucide-react 아이콘)
- 활성 탭 `text-primary` 강조

### 수정 `frontend/src/App.jsx`
```jsx
<Route path="/" element={<HomePage />} />
<Route path="/weekly" element={<WeeklyPage />} />
<Route path="/menus" element={<AllMenusPage />} />   {/* FE-C-5에서 구현, 이 시점엔 placeholder */}
<Route path="/profile" element={
  user ? <ProfilePage /> : <Navigate to="/" replace />
} />
{/* /my-reviews 제거 */}
```

**검증**:
- 탭 클릭 → URL 변경 + 빈 페이지 렌더
- 미로그인 `/profile` 직접 접근 → `/`로 리다이렉트

**의존성**: 없음 (B-1과 병렬 가능)

---

## FE-B-3 · NicknameSetupModal (최초 로그인)

### 신규 `frontend/src/components/NicknameSetupModal.jsx`
- `createPortal(…, document.body)` 사용
- Props: `{ onClose }` — 단, 저장 성공 시만 호출. 사용자가 닫지 못함.
- 입력: 2~12자 실시간 validation
- 저장: `updateNickname(nickname)` → 성공 시 `queryClient.invalidateQueries(['auth','me'])` + Toast
- 실패: 409 → "이미 사용 중인 닉네임입니다" 표시, 다른 에러 → 일반 에러 Toast
- **닫기 불가**: ESC 무시, overlay 클릭 무시

### 수정 `frontend/src/hooks/useAuth.js`
- `user.isNicknameSet === false` 감지 → 모달 트리거 상태 노출

### 수정 `frontend/src/App.jsx`
- `useAuth`의 플래그 기반으로 `<NicknameSetupModal />` 렌더 (로그인 상태 공통)

**뷰포트 검증**: 375/768/1280
- 375: 모달 가로 꽉 참, 키보드 올라올 때 input 가려지지 않음
- 768/1280: 중앙 정렬, 최대 너비 ~420px

**검증 시나리오**:
1. 신규 Google 계정 로그인 → 모달 자동 오픈
2. 1자 입력 → 버튼 비활성
3. 13자 입력 → 에러 메시지
4. 중복 닉네임 저장 시도 → 409 에러 메시지
5. 성공 → 모달 닫힘, 상단 닉네임 갱신

**의존성**: FE-B-1

---

## FE-B-4 · ProfilePage

### 신규 `frontend/src/pages/ProfilePage.jsx`
레이아웃:
```
┌─────────────────────────┐
│ [프사]  닉네임 ✎        │   ← 인라인 편집 버튼
│         🥉 브론즈        │   ← BadgeDisplay
│         리뷰 5개        │
├─────────────────────────┤
│ 내 리뷰                 │
│ [ReviewItem] 편집/삭제   │
│ ...                     │
├─────────────────────────┤
│ [로그아웃]              │
└─────────────────────────┘
```

### 신규 `frontend/src/components/BadgeDisplay.jsx`
- Props: `{ tier: 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD', reviewCount }`
- 🥉🥈🥇 이모지 + 라벨 + 리뷰수

### 삭제 `frontend/src/pages/MyReviewsPage.jsx`
- 내 리뷰 로직은 ProfilePage에 흡수

### 데이터
- `useQuery(['auth', 'me'], getMe)` — user + badgeTier + reviewCount
- `useQuery(['reviews', 'me'], getMyReviews)` — 내 리뷰 목록

### 인라인 닉네임 편집
- ✎ 버튼 → input 모드 전환 → NicknameSetupModal과 동일한 validation 재사용 (내부 헬퍼로 분리)
- 저장 성공 시 `invalidateQueries(['auth','me'])`

**뷰포트 검증**: 375/768/1280 — 프로필 카드와 리뷰 목록이 세로 적층, 최대 너비 제한 확인

**검증 시나리오**:
1. 닉네임 수정 → 상단 닉네임 + 내 리뷰의 작성자 표시 갱신
2. 내 리뷰 편집 → 리뷰 내용 즉시 갱신
3. 내 리뷰 삭제 → 목록에서 제거
4. 로그아웃 → `/` 리다이렉트
5. 미로그인 `/profile` 직접 접근 → `/` 리다이렉트

**의존성**: FE-B-1, FE-B-2, FE-B-3
