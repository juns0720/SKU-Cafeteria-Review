import { useDeferredValue, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getAllMenus, getCorners } from '../api/menus'
import CategoryFilter from '../components/coral/CategoryFilter'
import Empty from '../components/coral/Empty'
import Icon from '../components/coral/Icon'
import MedalDot from '../components/coral/MedalDot'
import Thumb from '../components/coral/Thumb'

const SORT_OPTIONS = [
  { key: 'rating',      label: '별점 높은순' },
  { key: 'reviewCount', label: '리뷰 많은순' },
  { key: 'date',        label: '최신순' },
]


function filterByQuery(menus, query) {
  const q = query.trim().toLowerCase()
  if (!q) return menus
  return menus.filter((m) =>
    (m.name?.toLowerCase() ?? '').includes(q) ||
    (m.corner?.toLowerCase() ?? '').includes(q)
  )
}

function SortDropdown({ value, onChange }) {
  const current = SORT_OPTIONS.find((o) => o.key === value) ?? SORT_OPTIONS[0]
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-transparent text-[13px] font-semibold text-g700 outline-none cursor-pointer pr-3.5"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>{o.label}</option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2">
        <Icon name="chevD" size={9} color="#4E5968" />
      </span>
    </div>
  )
}

function MenuSkeleton() {
  return (
    <div className="divide-y divide-g100">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3.5 py-[13px] animate-pulse">
          <div className="w-12 h-12 rounded-[12px] bg-g100 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-g100 rounded-full w-12" />
            <div className="h-4 bg-g100 rounded-full w-32" />
          </div>
          <div className="space-y-1.5 flex-shrink-0">
            <div className="h-3 bg-g100 rounded-full w-10" />
            <div className="h-2.5 bg-g100 rounded-full w-8 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  )
}

function MenuRow({ menu, onSelect }) {
  const rating = menu.avgOverall ?? menu.averageRating
  const reviewCount = menu.reviewCount ?? 0
  const hasRating = rating != null && reviewCount > 0

  return (
    <button
      type="button"
      onClick={() => onSelect(menu.id)}
      className="w-full flex items-center gap-3.5 py-[13px] text-left active:bg-g50 transition-colors"
    >
      <Thumb corner={menu.corner} size={48} radius={12} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[12.5px] font-medium text-g500">{menu.corner}</span>
          {menu.tier && <MedalDot tier={menu.tier} />}
          {menu.isNew && (
            <span className="text-[10px] font-bold text-coral bg-coralSoft px-1.5 py-px rounded-[4px]">
              NEW
            </span>
          )}
        </div>
        <div className="text-[15.5px] font-bold tracking-[-0.3px] text-g900 mt-px truncate">
          {menu.name}
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        {hasRating ? (
          <>
            <div className="flex items-center gap-1 justify-end">
              <Icon name="star" size={12} color="#FF6B5C" />
              <span className="text-[14px] font-bold text-g900">{rating.toFixed(1)}</span>
            </div>
            <div className="text-[11px] text-g500 mt-0.5">리뷰 {reviewCount}</div>
          </>
        ) : (
          <div className="text-[11px] text-g400">리뷰 없음</div>
        )}
      </div>
    </button>
  )
}

export default function AllMenusPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeCorner, setActiveCorner] = useState('전체')
  const [sort, setSort] = useState('rating')
  const deferredQuery = useDeferredValue(query)

  const selectedCorner = activeCorner === '전체' ? undefined : activeCorner

  const { data: menus = [], isLoading, isError } = useQuery({
    queryKey: ['menus', 'all', { corner: selectedCorner ?? 'ALL', sort, scope: 'all' }],
    queryFn: () => getAllMenus({ corner: selectedCorner, sort, scope: 'all' }),
  })
  const { data: cornersData = [] } = useQuery({
    queryKey: ['menus', 'corners'],
    queryFn: getCorners,
  })

  const cornerList = ['전체', ...cornersData]
  const filtered = filterByQuery(menus, deferredQuery)
  const isSearching = deferredQuery.trim().length > 0

  return (
    <div className="animate-fadeInUp">
      {/* 헤더 */}
      <div className="px-6 pt-2 pb-3.5 flex-shrink-0">
        <div className="text-[22px] font-extrabold tracking-[-0.6px] text-g900">전체 메뉴</div>
      </div>

      {/* 검색 */}
      <div className="px-6 pb-3.5 flex-shrink-0">
        <label className="flex items-center gap-2 h-11 px-3.5 bg-g50 rounded-[12px]">
          <Icon name="search" size={18} color="#8B95A1" weight={1.7} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="메뉴 검색"
            className="flex-1 bg-transparent text-[14px] font-medium text-g900 placeholder:text-g500 outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="flex-shrink-0"
            >
              <Icon name="x" size={14} color="#8B95A1" />
            </button>
          )}
        </label>
      </div>

      {/* 카테고리 칩 */}
      <div className="pb-3 flex-shrink-0">
        <CategoryFilter
          categories={cornerList}
          active={activeCorner}
          onSelect={setActiveCorner}
        />
      </div>

      {/* 정렬 row */}
      <div className="px-6 pb-2 flex items-center justify-between flex-shrink-0">
        <span className="text-[13px] font-semibold text-g600">
          {isSearching ? `${filtered.length}개 결과` : `총 ${menus.length}개`}
        </span>
        {!isSearching && <SortDropdown value={sort} onChange={setSort} />}
      </div>

      {/* 메뉴 리스트 */}
      <div className="px-6">
        {isLoading ? (
          <MenuSkeleton />
        ) : isError ? (
          <Empty
            icon="bowl"
            title="메뉴를 불러오지 못했습니다"
            description="잠시 후 다시 시도해주세요"
          />
        ) : filtered.length === 0 ? (
          <Empty
            icon="search"
            title="검색 결과가 없어요"
            description="다른 메뉴 이름이나 코너명으로 찾아보세요"
            cta={isSearching ? { label: '필터 초기화', onClick: () => { setQuery(''); setActiveCorner('전체') } } : undefined}
          />
        ) : (
          <div className="divide-y divide-g100">
            {filtered.map((menu) => (
              <MenuRow key={menu.id} menu={menu} onSelect={(id) => navigate(`/menus/${id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
