import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getWeeklyMenus } from '../api/menus'
import Empty from '../components/coral/Empty'
import Icon from '../components/coral/Icon'
import Thumb from '../components/coral/Thumb'
import WeekPicker from '../components/coral/WeekPicker'

const DAY_KEYS = ['MON', 'TUE', 'WED', 'THU', 'FRI']
const DAY_LABELS = ['월', '화', '수', '목', '금']
const ORDINAL_LABELS = ['첫째', '둘째', '셋째', '넷째', '다섯째']

// 주의 시작(월요일) Date 계산
function getWeekStart(base = new Date()) {
  const d = new Date(base)
  d.setHours(12, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

// "yyyy-mm-dd" 문자열 → Date (로컬 시간 기준)
function parseLocalDate(str) {
  if (!str) return null
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  return new Date(+m[1], +m[2] - 1, +m[3], 12)
}

function formatDate(d) {
  if (!d) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// WeekPicker용 days 배열 구성
function buildPickerDays(weekStartDate) {
  return DAY_LABELS.map((label, i) => {
    const d = new Date(weekStartDate)
    d.setDate(weekStartDate.getDate() + i)
    return { label, date: d.getDate() }
  })
}

// "N월 N주차" 레이블
function getWeekTitle(weekStartDate) {
  const d = new Date(weekStartDate)
  const firstDay = new Date(d.getFullYear(), d.getMonth(), 1)
  const weekIndex = Math.floor((d.getDate() + firstDay.getDay() - 1) / 7)
  const ordinal = ORDINAL_LABELS[weekIndex] ?? `${weekIndex + 1}째`
  return `${d.getMonth() + 1}월 ${ordinal} 주`
}

// 코너별 그룹핑
function groupByCorner(menus) {
  const map = new Map()
  menus.forEach((menu) => {
    const c = menu.corner || '기타'
    if (!map.has(c)) map.set(c, [])
    map.get(c).push(menu)
  })
  return Array.from(map.entries()).map(([corner, items]) => ({ corner, items }))
}

// 오늘이 평일이면 해당 index(0=월), 아니면 0
function getInitialDayIndex() {
  const day = new Date().getDay()
  return day >= 1 && day <= 5 ? day - 1 : 0
}

function WeekSkeleton() {
  return (
    <div className="animate-fadeInUp px-6 pt-2">
      <div className="h-6 w-32 bg-g100 rounded-full animate-pulse mb-1" />
      <div className="h-5 w-20 bg-g100 rounded-full animate-pulse mb-4" />
      <div className="flex gap-1.5 px-[0px] mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex-1 h-[62px] bg-g100 rounded-2xl animate-pulse" />
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 py-[10px] animate-pulse">
          <div className="w-12 h-12 bg-g100 rounded-[12px] flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-g100 rounded-full w-28" />
            <div className="h-3 bg-g100 rounded-full w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

function MenuRow({ menu, onSelect }) {
  const hasRating = menu.avgOverall != null && (menu.reviewCount ?? 0) > 0

  return (
    <button
      type="button"
      onClick={() => onSelect(menu.id)}
      className="w-full flex items-center gap-3 py-[10px] text-left active:bg-g50 transition-colors"
    >
      <Thumb corner={menu.corner} size={48} radius={12} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[15px] font-bold tracking-[-0.3px] text-g900 truncate">
            {menu.name}
          </span>
          {menu.isNew && (
            <span className="flex-shrink-0 text-[10px] font-bold text-coral bg-coralSoft px-1.5 py-px rounded-[4px]">
              NEW
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-[3px]">
          {hasRating ? (
            <>
              <Icon name="star" size={11} color="#FF6B5C" />
              <span className="text-[12.5px] font-bold text-g900">{menu.avgOverall.toFixed(1)}</span>
              <span className="text-[11px] text-g500">· 리뷰 {menu.reviewCount}</span>
            </>
          ) : (
            <span className="text-[11px] font-medium text-g500">리뷰를 남겨주세요</span>
          )}
        </div>
      </div>

      <Icon name="chevR" size={12} color="#B0B8C1" weight={1.8} />
    </button>
  )
}

export default function WeeklyPage() {
  const navigate = useNavigate()
  const [activeIndex, setActiveIndex] = useState(getInitialDayIndex)

  const weekStart = getWeekStart()
  const dateKey = formatDate(weekStart)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['menus', 'weekly', dateKey],
    queryFn: () => getWeeklyMenus(dateKey),
  })

  // 서버가 weekStart를 반환하면 우선 사용, 없으면 클라이언트 계산값
  const resolvedWeekStart = parseLocalDate(data?.weekStart) ?? weekStart
  const pickerDays = buildPickerDays(resolvedWeekStart)
  const weekTitle = getWeekTitle(resolvedWeekStart)

  const selectedDayKey = DAY_KEYS[activeIndex]
  const dayMenus = data?.days?.[selectedDayKey] ?? []
  const isHolidayDay = data?.holidayDays?.includes(selectedDayKey) ?? false
  const cornerGroups = groupByCorner(dayMenus)

  const handleMenuSelect = (id) => navigate(`/menus/${id}`)

  if (isLoading) return <WeekSkeleton />

  return (
    <div className="animate-fadeInUp">
      {/* 헤더 */}
      <div className="px-6 pt-2 pb-4 flex items-center justify-between">
        <div>
          <div className="text-[22px] font-extrabold tracking-[-0.6px] text-g900">주간 식단</div>
          <div className="text-[13px] font-semibold text-g600 mt-0.5">{weekTitle}</div>
        </div>
      </div>

      {/* 요일 Picker */}
      <WeekPicker
        days={pickerDays}
        activeIndex={activeIndex}
        onSelect={setActiveIndex}
      />

      {/* 메뉴 리스트 */}
      <div className="px-6 mt-4">
        {isError ? (
          <Empty
            icon="bowl"
            title="메뉴를 불러오지 못했습니다"
            description="잠시 후 다시 시도해주세요"
          />
        ) : isHolidayDay ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <span className="text-[32px]">🎌</span>
            <div className="text-[16px] font-bold text-g900">이 날은 휴일이에요</div>
            <div className="text-[13px] text-g500">학식이 운영되지 않습니다</div>
          </div>
        ) : dayMenus.length === 0 ? (
          <Empty
            icon="bowl"
            title="이 날 식단이 등록되지 않았어요"
            description="매주 월요일 아침에 업데이트됩니다"
          />
        ) : (
          <div>
            {cornerGroups.map(({ corner, items }) => (
              <div key={corner} className="mb-[18px]">
                {/* 코너 헤더 */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[14px] font-extrabold tracking-[-0.3px] text-g900">{corner}</span>
                  <span className="text-[12px] text-g500">{items.length}</span>
                </div>
                {/* 메뉴 rows — hairline 구분 */}
                <div className="divide-y divide-g100">
                  {items.map((menu) => (
                    <MenuRow
                      key={menu.id}
                      menu={menu}
                      onSelect={handleMenuSelect}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
