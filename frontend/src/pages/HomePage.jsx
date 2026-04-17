import { useState } from 'react'
import MenuCard from '../components/MenuCard'
import MenuDetailModal from '../components/MenuDetailModal'

const MOCK_TODAY = [
  { menuId: 1, name: '제육볶음', corner: 'A코너', averageRating: 4.2, reviewCount: 12 },
  { menuId: 2, name: '된장찌개', corner: 'B코너', averageRating: 3.8, reviewCount: 5 },
  { menuId: 3, name: '돈까스', corner: 'A코너', averageRating: 4.5, reviewCount: 20 },
  { menuId: 4, name: '비빔밥', corner: 'C코너', averageRating: null, reviewCount: 0 },
]

const DAY_KO = ['일', '월', '화', '수', '목', '금', '토']

function getTodayLabel() {
  const d = new Date()
  return `오늘 ${d.getMonth() + 1}월 ${d.getDate()}일 (${DAY_KO[d.getDay()]})`
}

export default function HomePage() {
  const [selectedMenu, setSelectedMenu] = useState(null)

  const handleCardClick = (menuId) => {
    setSelectedMenu(MOCK_TODAY.find((m) => m.menuId === menuId) ?? null)
  }

  return (
    <div className="p-4 animate-fadeInUp">
      <h2 className="text-lg font-bold text-gray-900 mb-4">{getTodayLabel()}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {MOCK_TODAY.map((menu) => (
          <MenuCard key={menu.menuId} {...menu} onClick={handleCardClick} />
        ))}
      </div>
      <MenuDetailModal
        menu={selectedMenu}
        isLoggedIn={false}
        onClose={() => setSelectedMenu(null)}
      />
    </div>
  )
}
