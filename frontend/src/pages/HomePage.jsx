import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getBestMenus, getTodayMenus } from '../api/menus'
import BestCarousel from '../components/hi/BestCarousel'
import Card from '../components/hi/Card'
import MedalSticker from '../components/hi/MedalSticker'
import Pill from '../components/hi/Pill'
import SecLabel from '../components/hi/SecLabel'
import Stars from '../components/hi/Stars'
import useAuth from '../hooks/useAuth'

const DAY_KO = ['일', '월', '화', '수', '목', '금', '토']
const TODAY_SLOT = 'LUNCH'
const SORT_OPTIONS = [
  { key: 'rating', label: '별점↓' },
  { key: 'name', label: '가나다' },
  { key: 'reviewCount', label: '리뷰수↓' },
]

function toDate(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

function getTodayLabel(value) {
  const date = toDate(value) ?? new Date()
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${DAY_KO[date.getDay()]})`
}

function sortMenus(menus, sort) {
  return [...menus].sort((left, right) => {
    if (sort === 'name') {
      return left.name.localeCompare(right.name, 'ko')
    }

    if (sort === 'reviewCount') {
      if ((right.reviewCount ?? 0) !== (left.reviewCount ?? 0)) {
        return (right.reviewCount ?? 0) - (left.reviewCount ?? 0)
      }
      return left.name.localeCompare(right.name, 'ko')
    }

    if ((right.avgOverall ?? -1) !== (left.avgOverall ?? -1)) {
      return (right.avgOverall ?? -1) - (left.avgOverall ?? -1)
    }

    return left.name.localeCompare(right.name, 'ko')
  })
}

function groupMenusByCorner(menus) {
  const groups = new Map()

  menus.forEach((menu) => {
    const corner = menu.corner || '기타'
    const items = groups.get(corner) ?? []
    items.push(menu)
    groups.set(corner, items)
  })

  return Array.from(groups.entries()).map(([corner, items]) => ({
    corner,
    items,
  }))
}

function SortDropdown({ value, onChange }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="appearance-none rounded-full border-[1.5px] border-ink bg-white px-3 py-1.5 pr-8 font-hand text-xs font-bold text-ink shadow-card outline-none"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-hand text-[10px] text-inkSoft">
        ▾
      </span>
    </div>
  )
}

function HomeHeader({ user, dateLabel }) {
  return (
    <div className="rounded-b-[30px] border-b-[1.5px] border-ink bg-orangeSoft px-4 pb-5 pt-5 shadow-card">
      <div className="mx-auto flex max-w-[760px] items-start justify-between gap-4">
        <div>
          <div className="font-hand text-sm text-inkSoft">학식 today</div>
          <h1 className="mt-1 font-disp text-[2.1rem] leading-none text-ink">
            오늘 점심 뭐 먹지?
          </h1>
          <p className="mt-3 font-hand text-sm text-inkSoft">{dateLabel}</p>
        </div>

        <div className="flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-white/90 px-2.5 py-2 shadow-card">
          <span
            className="inline-block h-8 w-8 shrink-0 rounded-full border border-ink"
            style={{ backgroundColor: user?.avatarColor ?? '#EF8A3D' }}
          />
          <span className="max-w-[96px] truncate font-user text-sm font-medium text-ink">
            {user?.nickname ?? user?.name ?? '사용자'}
          </span>
        </div>
      </div>
    </div>
  )
}

function HomeSectionSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="h-28 rounded-[24px] bg-paperDeep shimmer-bg" />
      <div className="h-28 rounded-[24px] bg-paperDeep shimmer-bg" />
      <div className="h-28 rounded-[24px] bg-paperDeep shimmer-bg" />
    </div>
  )
}

function CornerGroupCard({ corner, items }) {
  return (
    <Card bg="#FFFFFF" style={{ padding: '16px 16px 14px', borderRadius: 24 }}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-disp text-[1.2rem] leading-none text-ink">{corner}</h3>
        <span className="rounded-full border border-rule bg-paper px-2.5 py-1 font-hand text-xs text-inkSoft">
          {items.length}개
        </span>
      </div>

      <div className="mt-3 flex flex-col">
        {items.map((menu, index) => (
          <div
            key={menu.id}
            className={`flex items-start justify-between gap-3 py-3 ${
              index > 0 ? 'border-t border-dashed border-rule' : ''
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <MedalSticker tier={menu.tier} size={20} />
                <div className="truncate font-disp text-[1.05rem] leading-none text-ink">
                  {menu.name}
                </div>
                {menu.isNew && (
                  <Pill
                    bg="#FBE6A6"
                    border="#C89A2A"
                    color="#2B2218"
                    style={{ fontSize: 11, padding: '1px 8px' }}
                  >
                    NEW
                  </Pill>
                )}
              </div>

              <div className="mt-2 font-hand text-xs text-mute">
                {menu.reviewCount > 0
                  ? `리뷰 ${menu.reviewCount}개`
                  : '첫 리뷰의 주인공이 되어보세요'}
              </div>
            </div>

            <div className="shrink-0 text-right">
              {menu.avgOverall != null ? (
                <>
                  <div className="flex items-center justify-end gap-2">
                    <Stars value={menu.avgOverall} size={12} />
                    <span className="font-disp text-sm leading-none text-ink">
                      {menu.avgOverall.toFixed(1)}
                    </span>
                  </div>
                  <div className="mt-1 font-hand text-[11px] text-mute">
                    {menu.reviewCount}명 평가
                  </div>
                </>
              ) : (
                <div className="rounded-full border border-rule bg-paper px-2.5 py-1 font-hand text-xs text-mute">
                  리뷰 없음
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function HomePage() {
  const { user } = useAuth()
  const [sort, setSort] = useState('rating')
  const {
    data: todayData,
    isLoading: isTodayLoading,
    isError: isTodayError,
  } = useQuery({
    queryKey: ['menus', 'today', TODAY_SLOT],
    queryFn: () => getTodayMenus(TODAY_SLOT),
  })
  const { data: bestMenus = [], isLoading: isBestLoading } = useQuery({
    queryKey: ['menus', 'best'],
    queryFn: getBestMenus,
  })

  const sortedMenus = sortMenus(todayData?.menus ?? [], sort)
  const groupedMenus = groupMenusByCorner(sortedMenus)
  const dateLabel = getTodayLabel(todayData?.date)
  const shouldShowBest = !isBestLoading && bestMenus.length > 0

  return (
    <div className="animate-fadeInUp">
      <HomeHeader user={user} dateLabel={dateLabel} />

      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-7 px-4 py-5">
        <section>
          <SecLabel
            right={<SortDropdown value={sort} onChange={setSort} />}
          >
            ✨ 오늘의 메뉴 ({TODAY_SLOT})
          </SecLabel>

          {isTodayLoading ? (
            <HomeSectionSkeleton />
          ) : isTodayError ? (
            <Card bg="#FFFFFF" style={{ padding: '18px 16px', borderRadius: 24 }}>
              <p className="font-hand text-sm leading-6 text-red">
                오늘 메뉴를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
              </p>
            </Card>
          ) : groupedMenus.length === 0 ? (
            <Card bg="#FFFFFF" style={{ padding: '18px 16px', borderRadius: 24 }}>
              <p className="font-hand text-sm leading-6 text-mute">
                오늘 등록된 메뉴가 아직 없습니다.
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {groupedMenus.map((group) => (
                <CornerGroupCard
                  key={group.corner}
                  corner={group.corner}
                  items={group.items}
                />
              ))}
            </div>
          )}
        </section>

        {shouldShowBest && (
          <section>
            <SecLabel
              right={
                <span className="font-hand text-xs text-mute">
                  리뷰 3개 이상 기준
                </span>
              }
            >
              🏆 이번 주 BEST
            </SecLabel>
            <BestCarousel items={bestMenus.slice(0, 5)} />
          </section>
        )}
      </div>
    </div>
  )
}
