import { useState } from 'react'
import WeekTab, { todayKey } from '../components/WeekTab'
import MenuCard from '../components/MenuCard'
import MenuDetailModal from '../components/MenuDetailModal'
import useAuth from '../hooks/useAuth'

const MOCK_WEEKLY = {
  MON: [
    { menuId: 101, name: '제육볶음', corner: 'A코너', averageRating: 4.2, reviewCount: 12 },
    { menuId: 102, name: '된장찌개', corner: 'B코너', averageRating: 3.8, reviewCount: 5 },
  ],
  TUE: [
    { menuId: 103, name: '돈까스', corner: 'A코너', averageRating: 4.5, reviewCount: 20 },
    { menuId: 104, name: '순두부찌개', corner: 'B코너', averageRating: 4.0, reviewCount: 8 },
    { menuId: 105, name: '비빔밥', corner: 'C코너', averageRating: null, reviewCount: 0 },
  ],
  WED: [
    { menuId: 106, name: '김치찌개', corner: 'A코너', averageRating: 3.5, reviewCount: 3 },
    { menuId: 107, name: '치킨까스', corner: 'B코너', averageRating: 4.3, reviewCount: 15 },
  ],
  THU: [
    { menuId: 108, name: '불고기', corner: 'A코너', averageRating: 4.7, reviewCount: 30 },
    { menuId: 109, name: '미역국', corner: 'B코너', averageRating: 3.2, reviewCount: 2 },
    { menuId: 110, name: '잡채', corner: 'C코너', averageRating: 4.1, reviewCount: 9 },
  ],
  FRI: [
    { menuId: 111, name: '삼겹살', corner: 'A코너', averageRating: 4.8, reviewCount: 42 },
    { menuId: 112, name: '냉면', corner: 'B코너', averageRating: 3.9, reviewCount: 7 },
  ],
}

export default function WeeklyPage() {
  const [selectedDay, setSelectedDay] = useState(todayKey())
  const [selectedMenu, setSelectedMenu] = useState(null)
  const { isLoggedIn } = useAuth()
  const menus = MOCK_WEEKLY[selectedDay] ?? []

  const allMenus = Object.values(MOCK_WEEKLY).flat()
  const handleCardClick = (menuId) => {
    setSelectedMenu(allMenus.find((m) => m.menuId === menuId) ?? null)
  }

  return (
    <div className="animate-fadeInUp">
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-lg font-bold text-gray-900">이번 주 학식</h2>
      </div>

      <WeekTab selected={selectedDay} onSelect={setSelectedDay} />

      <div className="p-4">
        {menus.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {menus.map((menu) => (
              <MenuCard key={menu.menuId} {...menu} onClick={handleCardClick} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 text-sm py-16">등록된 메뉴가 없습니다</p>
        )}
      </div>

      <MenuDetailModal
        menu={selectedMenu}
        isLoggedIn={isLoggedIn}
        onClose={() => setSelectedMenu(null)}
      />
    </div>
  )
}
