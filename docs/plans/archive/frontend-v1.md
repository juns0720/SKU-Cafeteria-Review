# Frontend v1 Plan (아카이브)

> ⚠️ **이 문서는 아카이브입니다.** 현재 유효한 플랜은 [`../ui-ux-redesign/`](../ui-ux-redesign/)입니다.
>
> v1(FE-1 ~ FE-22)의 완료된 항목(FE-1~FE-5 대부분)은 현재 코드에 반영되어 있으며, 미완료 항목(FE-5-4, FE-6-1~FE-6-3)은 v2 Phase B·C·D에 완전히 흡수되었습니다. 레거시 미완료 항목을 별도로 진행하지 마세요.

---

## 디자인 시스템

디자인 토큰(컬러 팔레트·타이포그래피·반응형 브레이크포인트·애니메이션)은 [`docs/DESIGN.md`](../../DESIGN.md)에 통합되어 유지됩니다.

핵심:
- 메인 컬러: `#D94148` (primary)
- 별점 컬러: `#FBBF24` (star)
- 한국어 폰트: Pretendard (CDN)
- 영문 헤더: DM Serif Display (CDN)
- 반응형: **v2에서 변경** — 모바일 2열 / 태블릿 3열 / 데스크탑 4열 (v1은 1/2/3)

상세 토큰 값은 `docs/DESIGN.md`를 참조하세요.

---

## 환경변수 (현재도 유효)

```
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_GOOGLE_CLIENT_ID=발급받은_클라이언트_ID
```

---

## 레거시 단계 목록 (참조 전용)

- FE-1 ~ FE-3: 인프라 · 환경변수 · Axios · React Query · useAuth · Router · Google 로그인 → **완료**
- FE-4 ~ FE-5: HomePage / WeeklyPage / ReviewsPage / MenuDetailModal / ReviewItem / StarRating / 리뷰 작성/수정/삭제 → **대부분 완료**
- FE-5-4 (내 리뷰 페이지) → v2 **FE-B-4 ProfilePage**에 흡수
- FE-6-1 (백엔드 API 연동) → v2 **FE-B-1 + FE-C-3~C-7**에 흡수
- FE-6-2 (반응형 점검) → v2 **각 Phase 검증 단계**에 흡수
- FE-6-3 (에러/빈 상태 UI) → v2 **각 Phase 검증 단계**에 흡수

v1 상세 단계별 설계(FE-1-1~FE-22)는 git 이력에서 확인 가능:
```bash
git log -p -- docs/FRONTEND_PLAN.md
```
