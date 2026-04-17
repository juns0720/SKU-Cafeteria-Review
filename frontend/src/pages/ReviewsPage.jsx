import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import MenuCard from '../components/MenuCard'
import MenuDetailModal from '../components/MenuDetailModal'

const MOCK_ALL = [
  { menuId: 1,  name: '제육볶음',   corner: 'A코너', averageRating: 4.2, reviewCount: 12, servedDate: '2025-04-14' },
  { menuId: 2,  name: '된장찌개',   corner: 'B코너', averageRating: 3.8, reviewCount: 5,  servedDate: '2025-04-14' },
  { menuId: 3,  name: '돈까스',     corner: 'A코너', averageRating: 4.5, reviewCount: 20, servedDate: '2025-04-15' },
  { menuId: 4,  name: '비빔밥',     corner: 'C코너', averageRating: null, reviewCount: 0, servedDate: '2025-04-15' },
  { menuId: 5,  name: '불고기',     corner: 'A코너', averageRating: 4.7, reviewCount: 30, servedDate: '2025-04-16' },
  { menuId: 6,  name: '김치찌개',   corner: 'B코너', averageRating: 3.5, reviewCount: 3,  servedDate: '2025-04-16' },
  { menuId: 7,  name: '삼겹살',     corner: 'A코너', averageRating: 4.8, reviewCount: 42, servedDate: '2025-04-17' },
  { menuId: 8,  name: '냉면',       corner: 'B코너', averageRating: 3.9, reviewCount: 7,  servedDate: '2025-04-17' },
  { menuId: 9,  name: '치킨까스',   corner: 'B코너', averageRating: 4.3, reviewCount: 15, servedDate: '2025-04-17' },
  { menuId: 10, name: '순두부찌개', corner: 'C코너', averageRating: 4.0, reviewCount: 8,  servedDate: '2025-04-18' },
]

const SORT_OPTIONS = [
  { key: 'rating',      label: '별점↓' },
  { key: 'reviewCount', label: '리뷰수↓' },
  { key: 'date',        label: '날짜↓' },
]

function sortMenus(menus, sort) {
  return [...menus].sort((a, b) => {
    if (sort === 'rating') return (b.averageRating ?? -1) - (a.averageRating ?? -1)
    if (sort === 'reviewCount') return b.reviewCount - a.reviewCount
    return b.servedDate.localeCompare(a.servedDate)
  })
}

export default function ReviewsPage() {
  const [sort, setSort] = useState('date')
  const [query, setQuery] = useState('')
  const [selectedMenu, setSelectedMenu] = useState(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? MOCK_ALL.filter((m) => m.name.toLowerCase().includes(q) || m.corner.includes(q))
      : MOCK_ALL
    return sortMenus(list, sort)
  }, [sort, query])

  return (
    <div className="p-4 animate-fadeInUp">
      <h2 className="text-lg font-bold text-gray-900 mb-3">전체 메뉴</h2>

      {/* 검색창 */}
      <div className="flex items-center gap-2 bg-surface rounded-xl px-3 py-2 mb-3">
        <Search size={16} className="text-gray-400 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="메뉴 이름 검색"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
        />
      </div>

      {/* 정렬 버튼 */}
      <div className="flex gap-2 mb-4">
        {SORT_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSort(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
              ${sort === key
                ? 'bg-primary text-white'
                : 'bg-surface text-gray-500 hover:bg-gray-200'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 카드 그리드 */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((menu) => (
            <MenuCard
              key={menu.menuId}
              {...menu}
              onClick={(id) => setSelectedMenu(MOCK_ALL.find((m) => m.menuId === id) ?? null)}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400 text-sm py-16">검색 결과가 없습니다</p>
      )}

      <MenuDetailModal
        menu={selectedMenu}
        isLoggedIn={false}
        onClose={() => setSelectedMenu(null)}
      />
    </div>
  )
}
