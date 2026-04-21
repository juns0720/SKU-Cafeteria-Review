import { useDeferredValue, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAllMenus, getCorners } from '../api/menus'
import Card from '../components/hi/Card'
import CornerFilterChips from '../components/hi/CornerFilterChips'
import Icon from '../components/hi/Icon'
import MedalSticker from '../components/hi/MedalSticker'
import Pill from '../components/hi/Pill'
import SecLabel from '../components/hi/SecLabel'
import Stars from '../components/hi/Stars'

const SORT_OPTIONS = [
  { key: 'rating', label: '별점↓', hint: '별점 높은 순' },
  { key: 'reviewCount', label: '리뷰수↓', hint: '리뷰 많은 순' },
  { key: 'date', label: '최신순', hint: '최근 제공 순' },
]

function buildCornerOptions(cornerData, menus) {
  const seen = new Set()
  const options = ['전체']
  const source = [...(cornerData ?? []), ...(menus ?? []).map((menu) => menu.corner).filter(Boolean)]

  source.forEach((corner) => {
    if (!corner || seen.has(corner)) {
      return
    }

    seen.add(corner)
    options.push(corner)
  })

  return options
}

function filterMenus(menus, query) {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return menus
  }

  return menus.filter((menu) => {
    const name = menu.name?.toLowerCase?.() ?? ''
    const corner = menu.corner?.toLowerCase?.() ?? ''

    return name.includes(normalizedQuery) || corner.includes(normalizedQuery)
  })
}

function SearchField({ value, onChange }) {
  return (
    <Card bg="#FFFFFF" shadow={false} style={{ padding: '10px 14px', borderRadius: 24 }}>
      <label className="flex items-center gap-2">
        <Icon name="search" size={18} color="#8E7A66" stroke={1.8} />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="메뉴·코너 검색"
          className="w-full bg-transparent font-hand text-sm text-ink outline-none placeholder:text-mute"
        />
      </label>
    </Card>
  )
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

function AllMenusSkeleton() {
  return (
    <div className="animate-fadeInUp">
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-4 px-4 py-5">
        <div className="h-5 w-28 rounded-full bg-paperDeep shimmer-bg" />
        <div className="h-10 w-36 rounded-full bg-paperDeep shimmer-bg" />
        <div className="h-12 rounded-[24px] bg-paperDeep shimmer-bg" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-8 w-16 rounded-full bg-paperDeep shimmer-bg" />
          ))}
        </div>
        <div className="h-6 w-28 rounded-full bg-paperDeep shimmer-bg" />
        <div className="h-24 rounded-[28px] bg-paperDeep shimmer-bg" />
        <div className="h-24 rounded-[28px] bg-paperDeep shimmer-bg" />
        <div className="h-24 rounded-[28px] bg-paperDeep shimmer-bg" />
      </div>
    </div>
  )
}

function MenuRow({ menu, isLast }) {
  const rating = menu.avgOverall ?? menu.averageRating
  const reviewCount = menu.reviewCount ?? 0
  const hasRating = rating != null && reviewCount > 0

  return (
    <div className={`flex items-center gap-3 py-3 ${isLast ? '' : 'border-b border-dashed border-rule'}`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <MedalSticker tier={menu.tier} size={20} />
          <div className="truncate font-disp text-[1.05rem] leading-none text-ink">
            {menu.name}
          </div>
          {menu.isNew && (
            <Pill
              bg="#EF8A3D"
              color="#FFFFFF"
              border="#EF8A3D"
              style={{ fontSize: 10, padding: '1px 7px' }}
            >
              NEW
            </Pill>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="font-hand text-[11px] text-mute">{menu.corner || '기타'}</span>
          <span className="h-1 w-1 rounded-full bg-rule" />

          {hasRating ? (
            <>
              <Stars value={rating} size={11} />
              <span className="font-disp text-sm leading-none text-ink">
                {rating.toFixed(1)}
              </span>
              <span className="font-hand text-[11px] text-mute">리뷰 {reviewCount}개</span>
            </>
          ) : (
            <>
              <span className="font-disp text-sm leading-none text-ink">-</span>
              <span className="font-hand text-[11px] text-mute">리뷰 0개</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AllMenusPage() {
  const [query, setQuery] = useState('')
  const [activeCorner, setActiveCorner] = useState('전체')
  const [sort, setSort] = useState('rating')
  const deferredQuery = useDeferredValue(query)
  const selectedCorner = activeCorner === '전체' ? undefined : activeCorner
  const currentSort = SORT_OPTIONS.find((option) => option.key === sort) ?? SORT_OPTIONS[0]
  const {
    data: menus = [],
    isLoading: isMenusLoading,
    isError: isMenusError,
  } = useQuery({
    queryKey: ['menus', 'all', { corner: selectedCorner ?? 'ALL', sort, scope: 'all' }],
    queryFn: () => getAllMenus({ corner: selectedCorner, sort, scope: 'all' }),
  })
  const { data: cornerData = [] } = useQuery({
    queryKey: ['menus', 'corners'],
    queryFn: getCorners,
  })

  const cornerOptions = buildCornerOptions(cornerData, menus)
  const filteredMenus = filterMenus(menus, deferredQuery)
  const resultLabel = deferredQuery.trim()
    ? `${filteredMenus.length}개 결과`
    : `${menus.length}개 메뉴`

  if (isMenusLoading) {
    return <AllMenusSkeleton />
  }

  return (
    <div className="animate-fadeInUp">
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-4 px-4 py-5">
        <div>
          <div className="font-hand text-sm text-green">menu archive</div>
          <h1 className="mt-1 font-disp text-[2rem] leading-none text-ink">전체 메뉴</h1>
          <p className="mt-3 font-hand text-sm text-inkSoft">{resultLabel}</p>
        </div>

        <SearchField value={query} onChange={setQuery} />

        <CornerFilterChips
          corners={cornerOptions}
          active={activeCorner}
          onChange={setActiveCorner}
        />

        <section>
          <SecLabel right={<SortDropdown value={sort} onChange={setSort} />}>
            {currentSort.hint}
          </SecLabel>

          {isMenusError ? (
            <Card bg="#FFFFFF" style={{ padding: '18px 16px', borderRadius: 28 }}>
              <p className="font-hand text-sm leading-6 text-red">
                전체 메뉴를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
              </p>
            </Card>
          ) : filteredMenus.length === 0 ? (
            <Card bg="#FFFFFF" style={{ padding: '24px 18px', borderRadius: 28 }}>
              <p className="font-disp text-lg leading-none text-ink">검색 결과가 없어요</p>
              <p className="mt-3 font-hand text-sm leading-6 text-mute">
                다른 메뉴 이름이나 코너명으로 다시 찾아보세요.
              </p>
            </Card>
          ) : (
            <Card bg="#FFFFFF" style={{ padding: '0 16px', borderRadius: 28 }}>
              {filteredMenus.map((menu, index) => (
                <MenuRow
                  key={menu.id}
                  menu={menu}
                  isLast={index === filteredMenus.length - 1}
                />
              ))}
            </Card>
          )}
        </section>
      </div>
    </div>
  )
}
