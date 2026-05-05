# API 성능 최적화 플랜
> Vercel + Supabase 무료 티어 기준 / 진단 결과 기반

---

## 진단 요약

| 항목 | 결과 | 판정 |
|------|------|------|
| `weekly` API | 873ms | 🔴 심각 |
| `me` API | 777~815ms | 🔴 심각 |
| `menus` API | 559ms | 🟠 나쁨 |
| `corners` API | 519ms | 🟠 나쁨 |
| Supabase 앱 쿼리 | Query Performance에 미등장 | ✅ DB 자체는 빠름 |
| 느린 쿼리 상위권 | 전부 Supabase 내부 시스템 쿼리 | ℹ️ 앱과 무관 |

**결론: DB가 아닌 Vercel Serverless 콜드스타트 + 매 요청마다 새 커넥션이 주 원인**

```
요청 → Vercel Function 웜업 (200~400ms) ← 주범
     → Supabase 클라이언트 초기화 (50~100ms)
     → DB 커넥션 (50~100ms)
     → 실제 쿼리 (빠름)
     → 응답
```

---

## Task 1. Supabase 클라이언트 싱글톤 적용

**우선순위:** 🔴 즉시  
**예상 효과:** 요청당 50~100ms 절감  
**난이도:** 낮음

### 작업 내용

`lib/supabase/client.ts` (또는 기존 supabase 초기화 파일) 수정

```typescript
import { createClient } from '@supabase/supabase-js'

let supabaseInstance: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false },
        db: { schema: 'public' }
      }
    )
  }
  return supabaseInstance
}
```

### 체크리스트
- [ ] 기존 `createClient` 직접 호출 코드 파악
- [ ] 싱글톤 함수로 전부 교체
- [ ] 서버사이드 / 클라이언트사이드 분리 여부 확인

---

## Task 2. Supabase Pooler URL 교체

**우선순위:** 🔴 즉시  
**예상 효과:** 커넥션 수립 시간 50~150ms 절감  
**난이도:** 낮음 (설정만 변경)

### 작업 내용

```
Supabase 대시보드
└── Settings → Database → Connection string
    └── Transaction mode (포트 6543) URL 복사
```

```bash
# .env 또는 .env.local 수정
# Before (Direct, 포트 5432)
DATABASE_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres

# After (Transaction Pooler, 포트 6543)
DATABASE_URL=postgresql://postgres:[password]@aws-0-region.pooler.supabase.com:6543/postgres
```

### 체크리스트
- [ ] Supabase 대시보드에서 Pooler URL 확인
- [ ] `.env` / `.env.local` 교체
- [ ] Vercel 환경변수도 동일하게 업데이트
- [ ] 배포 후 응답시간 재측정

---

## Task 3. 병렬 API 호출 전환

**우선순위:** 🔴 즉시  
**예상 효과:** 페이지 로드 시간 최대 50% 절감  
**난이도:** 낮음~중간

### 작업 내용

`weekly`, `menus`, `corners`가 순차 호출되고 있을 경우 병렬로 전환

```typescript
// Before: 순차 실행 (873 + 559 + 519 = ~1951ms)
const weekly  = await fetchWeekly()
const menus   = await fetchMenus()
const corners = await fetchCorners()

// After: 병렬 실행 (~873ms, 가장 느린 것 기준)
const [weekly, menus, corners] = await Promise.all([
  fetchWeekly(),
  fetchMenus(),
  fetchCorners()
])
```

### 체크리스트
- [ ] 페이지 진입 시 호출 순서 파악
- [ ] 의존관계 없는 API 묶어서 `Promise.all` 적용
- [ ] `me` API도 다른 초기 데이터와 병렬 처리 가능한지 확인

---

## Task 4. `me` API 캐싱 적용

**우선순위:** 🟠 단기  
**예상 효과:** 반복 호출 시 응답 ~10ms 수준으로 감소  
**난이도:** 낮음

### 작업 내용

유저 정보는 자주 바뀌지 않으므로 캐싱 적용

```typescript
// app/api/me/route.ts
import { unstable_cache } from 'next/cache'
import { getSupabase } from '@/lib/supabase/client'

const getCachedUser = unstable_cache(
  async (userId: string) => {
    const { data } = await getSupabase()
      .from('users')
      .select('id, nickname, email, avatar_url')
      .eq('id', userId)
      .single()
    return data
  },
  ['user-me'],
  { revalidate: 300 } // 5분 캐시
)

export async function GET(req: Request) {
  const userId = // 토큰에서 추출
  const user = await getCachedUser(userId)
  return Response.json(user)
}
```

### 체크리스트
- [ ] `me` API의 현재 캐싱 여부 확인
- [ ] `unstable_cache` 또는 `revalidate` 적용
- [ ] 유저 정보 변경 시 캐시 무효화 로직 추가 (`revalidateTag`)

---

## Task 5. Edge Runtime 전환

**우선순위:** 🟠 단기  
**예상 효과:** 콜드스타트 200~400ms 제거  
**난이도:** 중간

### 작업 내용

각 API Route 상단에 한 줄 추가

```typescript
// app/api/me/route.ts
// app/api/corners/route.ts
// app/api/menus/route.ts
// app/api/weekly/route.ts
export const runtime = 'edge'
```

### ⚠️ 주의사항

Edge Runtime은 Node.js API 일부를 지원하지 않음

```
Edge에서 사용 불가:
- SUPABASE_SERVICE_ROLE_KEY (→ anon key + RLS로 대체)
- fs, path 등 Node.js 내장 모듈
- 일부 npm 패키지

적용 전 확인:
- 각 Route에서 사용 중인 패키지 Edge 호환 여부 체크
- https://edge-runtime.vercel.app/features/available-apis
```

### 체크리스트
- [ ] 각 API Route의 의존 패키지 Edge 호환 확인
- [ ] `SERVICE_ROLE_KEY` 사용 여부 확인 → RLS로 대체 가능한지 검토
- [ ] 스테이징 환경에서 먼저 테스트
- [ ] 적용 후 응답시간 재측정

---

## Task 6. Suspense + 스켈레톤으로 체감 속도 개선

**우선순위:** 🟡 중기  
**예상 효과:** 실제 속도보다 체감 속도 극적 개선  
**난이도:** 중간

### 작업 내용

```typescript
// app/dashboard/page.tsx
export default function Page() {
  return (
    <div>
      {/* 즉시 렌더링 */}
      <Header />

      {/* 데이터 로딩 중 스켈레톤 표시 */}
      <Suspense fallback={<WeeklySkeleton />}>
        <WeeklySection />
      </Suspense>

      <Suspense fallback={<MenusSkeleton />}>
        <MenusSection />
      </Suspense>

      <Suspense fallback={<CornersSkeleton />}>
        <CornersSection />
      </Suspense>
    </div>
  )
}
```

### 체크리스트
- [ ] 각 섹션별 Skeleton 컴포넌트 제작
- [ ] 데이터 fetch를 Server Component로 이동
- [ ] `Suspense` 경계 설정
- [ ] 로딩 순서 UX 검토 (어떤 게 먼저 보이는 게 자연스러운지)

---

## Task 7. revalidate 캐싱 적용 (정적성 높은 데이터)

**우선순위:** 🟡 중기  
**예상 효과:** 반복 방문 시 응답 거의 즉시  
**난이도:** 낮음

### 작업 내용

```typescript
// menus, corners 같이 자주 안 바뀌는 데이터
export const revalidate = 300 // 5분

// weekly는 날짜 기반이므로
export const revalidate = 3600 // 1시간

// me처럼 실시간성 필요한 건
export const revalidate = 0 // 캐시 안 함
```

### 체크리스트
- [ ] 각 API/페이지의 데이터 변경 주기 파악
- [ ] `revalidate` 값 설정
- [ ] 데이터 변경 시 수동 무효화 필요 여부 확인 (`revalidatePath`, `revalidateTag`)

---

## 실행 순서 요약

```
Phase 1 (오늘, 1~2시간)
  ├── Task 1. Supabase 싱글톤 적용
  ├── Task 2. Pooler URL 교체
  └── Task 3. Promise.all 병렬 호출

Phase 2 (이번 주, 2~4시간)
  ├── Task 4. me API 캐싱
  ├── Task 5. Edge Runtime 전환 (호환성 확인 후)
  └── Task 7. revalidate 캐싱

Phase 3 (다음 주, 4~8시간)
  └── Task 6. Suspense + 스켈레톤 UI
```

---

## 성능 측정 방법

### 적용 전후 비교

각 Task 적용 후 아래 수치를 기록하세요.

```
[ 측정 템플릿 ]
적용 Task:
측정 일시:

weekly  TTFB: ___ms
me      TTFB: ___ms
menus   TTFB: ___ms
corners TTFB: ___ms
```

### 측정 위치
- **브라우저:** F12 → Network → 요청 클릭 → Timing 탭 → Waiting (TTFB)
- **Vercel:** 대시보드 → Functions → Logs (console.log 타이머)
- **Supabase:** 대시보드 → Database → Query Performance
