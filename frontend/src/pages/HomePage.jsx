import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getHome } from '../api/home'
import BestRow from '../components/coral/BestRow'
import Empty from '../components/coral/Empty'
import Icon from '../components/coral/Icon'
import Thumb from '../components/coral/Thumb'
import { MENU_STALE_TIME } from '../lib/queryTimes'

const DAY_KO = ['일', '월', '화', '수', '목', '금', '토']
const TODAY_SLOT = 'LUNCH'
const SORT_LABELS = { rating: '별점순', name: '가나다순', reviewCount: '리뷰 많은 순' }

function getTodayLabel() {
  const d = new Date()
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${DAY_KO[d.getDay()]}요일`
}

function sortMenus(menus, sort) {
  return [...menus].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name, 'ko')
    if (sort === 'reviewCount') {
      if ((b.reviewCount ?? 0) !== (a.reviewCount ?? 0)) return (b.reviewCount ?? 0) - (a.reviewCount ?? 0)
      return a.name.localeCompare(b.name, 'ko')
    }
    if ((b.avgOverall ?? -1) !== (a.avgOverall ?? -1)) return (b.avgOverall ?? -1) - (a.avgOverall ?? -1)
    return a.name.localeCompare(b.name, 'ko')
  })
}

function SortDropdown({ value, onChange }) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-transparent text-[13px] font-semibold text-g700 outline-none cursor-pointer pr-3.5"
      >
        {Object.entries(SORT_LABELS).map(([k, label]) => (
          <option key={k} value={k}>{label}</option>
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
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3.5 py-[13px] animate-pulse">
          <div className="w-[50px] h-[50px] rounded-[12px] bg-g100 flex-shrink-0" />
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

function BestSkeleton() {
  return (
    <div className="flex gap-3 px-6 pb-[22px] overflow-hidden">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex-shrink-0 w-[124px] animate-pulse">
          <div className="w-[124px] h-[124px] rounded-[14px] bg-g100" />
          <div className="h-4 bg-g100 rounded-full mt-2 w-20" />
          <div className="h-3 bg-g100 rounded-full mt-1.5 w-12" />
        </div>
      ))}
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const [sort, setSort] = useState('rating')

  const { data: homeData, isLoading: isHomeLoading, isError: isHomeError } = useQuery({
    queryKey: ['home', TODAY_SLOT],
    queryFn: () => getHome({ slot: TODAY_SLOT }),
    staleTime: MENU_STALE_TIME,
    refetchOnWindowFocus: false,
  })

  const todayData = homeData?.today
  const bestMenus = homeData?.bestMenus ?? []
  const todayMenus = sortMenus(todayData?.menus ?? [], sort)
  const hasBest = !isHomeLoading && bestMenus.length > 0

  return (
    <div className="animate-fadeInUp">
      {/* 페이지 헤더 */}
      <div className="px-6 pt-2 pb-[22px] flex-shrink-0">
        <div className="text-[13px] font-semibold text-g600">{getTodayLabel()}</div>
        <div className="text-[24px] font-extrabold tracking-[-0.7px] text-g900 mt-1">SKU 학식</div>
      </div>

      {/* 이번 주 BEST */}
      <section className="mb-2">
        <div className="px-6 pb-3 flex items-baseline justify-between">
          <div className="text-[18px] font-extrabold tracking-[-0.4px] text-g900">
            이번 주 베스트{' '}
            {!isHomeLoading && bestMenus.length > 0 && (
              <span className="text-coral">{Math.min(bestMenus.length, 5)}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate('/menus?sort=rating')}
            className="text-[13px] font-semibold text-g600"
          >
            전체
          </button>
        </div>

        {isHomeLoading ? (
          <BestSkeleton />
        ) : isHomeError ? (
          <div className="px-6 pb-[22px] text-[13px] text-g500">
            베스트 메뉴를 불러오지 못했어요
          </div>
        ) : hasBest ? (
          <BestRow items={bestMenus.slice(0, 5)} onItemClick={(id) => navigate(`/menus/${id}`)} />
        ) : (
          <div className="px-6 pb-[22px] text-[13px] text-g500">
            아직 베스트 메뉴가 없어요
          </div>
        )}
      </section>

      {/* 오늘의 메뉴 */}
      <section className="px-6">
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[17px] font-extrabold tracking-[-0.4px] text-g900">오늘의 메뉴</div>
          <SortDropdown value={sort} onChange={setSort} />
        </div>

        {isHomeLoading ? (
          <MenuSkeleton />
        ) : isHomeError ? (
          <Empty
            icon="soup"
            title="메뉴를 불러오지 못했습니다"
            description="잠시 후 다시 시도해주세요"
          />
        ) : todayData?.isHoliday ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <span className="text-[32px]">🎌</span>
            <div className="text-[16px] font-bold text-g900">오늘은 휴일이에요</div>
            <div className="text-[13px] text-g500">학식이 운영되지 않습니다</div>
          </div>
        ) : todayMenus.length === 0 ? (
          <Empty
            icon="soup"
            title="아직 오늘 식단이 등록되지 않았어요"
            description={"매주 월요일 아침에 업데이트됩니다.\n조금만 기다려주세요!"}
            cta={{ label: '지난 주 BEST 보기', onClick: () => navigate('/menus?sort=rating') }}
          />
        ) : (
          <div className="divide-y divide-g100">
            {todayMenus.map((menu) => (
              <button
                key={menu.id}
                type="button"
                onClick={() => navigate(`/menus/${menu.id}`)}
                className="w-full flex items-center gap-3.5 py-[13px] text-left active:bg-g50 transition-colors"
              >
                <Thumb corner={menu.corner} size={50} radius={12} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-medium text-g500">{menu.corner}</span>
                    {menu.isNew && (
                      <span className="text-[10px] font-bold text-coral bg-coralSoft px-1.5 py-px rounded-[3px]">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="text-[15.5px] font-bold tracking-[-0.3px] text-g900 mt-px truncate">
                    {menu.name}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  {menu.avgOverall != null ? (
                    <>
                      <div className="flex items-center gap-1 justify-end">
                        <Icon name="star" size={12} color="#FF6B5C" />
                        <span className="text-[14px] font-bold text-g900">{menu.avgOverall.toFixed(1)}</span>
                      </div>
                      <div className="text-[11px] text-g500 mt-0.5">리뷰 {menu.reviewCount}</div>
                    </>
                  ) : (
                    <div className="text-[11px] text-g400">리뷰 없음</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
