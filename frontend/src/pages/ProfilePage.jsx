import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getMyReviews } from '../api/reviews'
import Empty from '../components/coral/Empty'
import Icon from '../components/coral/Icon'
import NicknameSetupModal from '../components/coral/NicknameSetupModal'
import ProgressBar from '../components/coral/ProgressBar'
import Stars from '../components/coral/Stars'
import StatsGrid from '../components/coral/StatsGrid'
import Thumb from '../components/coral/Thumb'
import useAuth from '../hooks/useAuth'
import { USER_STALE_TIME } from '../lib/queryTimes'

const BADGE_EMOJI = { NONE: '', BRONZE: '🥉', SILVER: '🥈', GOLD: '🥇' }
const BADGE_NEXT_LABEL = { NONE: '🥉 브론즈', BRONZE: '🥈 실버', SILVER: '🥇 골드', GOLD: '🥇 골드' }

function formatReviewDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function ProfileSkeleton() {
  return (
    <div className="animate-fadeInUp px-6 pt-2">
      <div className="h-7 w-16 bg-g100 rounded-full animate-pulse mb-4" />
      <div className="h-[88px] rounded-[18px] bg-g100 animate-pulse mb-3" />
      <div className="h-[76px] rounded-[14px] bg-g100 animate-pulse mb-3" />
      <div className="h-[76px] rounded-[14px] bg-g100 animate-pulse mb-5" />
      <div className="h-4 w-20 bg-g100 rounded-full animate-pulse mb-3" />
      {[1, 2].map((i) => (
        <div key={i} className="flex gap-3 py-[11px] animate-pulse">
          <div className="w-11 h-11 rounded-[11px] bg-g100 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-28 bg-g100 rounded-full" />
            <div className="h-3 w-20 bg-g100 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isNicknameEditOpen, setIsNicknameEditOpen] = useState(false)
  const [now] = useState(() => Date.now())

  const { data: myReviews = [], isLoading: isReviewsLoading, isError: isReviewsError } = useQuery({
    queryKey: ['reviews', 'me'],
    queryFn: getMyReviews,
    enabled: Boolean(user),
    staleTime: USER_STALE_TIME,
  })

  if (!user) return <ProfileSkeleton />

  const remainingDays = (() => {
    if (!user?.nicknameChangedAt) return 0
    const changedAt = new Date(user.nicknameChangedAt)
    const unlockAt  = new Date(changedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
    const diff      = Math.ceil((unlockAt - now) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  })()
  const canChangeNickname = remainingDays === 0

  const badgeEmoji = BADGE_EMOJI[user.badgeTier] ?? ''
  const nextTierLabel = BADGE_NEXT_LABEL[user.badgeTier] ?? '🥇 골드'
  const isGold = user.badgeTier === 'GOLD'
  const progressTarget = Math.max(user.nextTarget ?? 1, 1)
  const progressCurrent = Math.max(progressTarget - (user.remaining ?? progressTarget), 0)

  const statsItems = [
    { value: user.reviewCount ?? 0, label: '리뷰' },
    { value: user.avgRating != null ? Number(user.avgRating).toFixed(1) : '-', label: '평균 별점' },
    { value: user.badgeCount ?? 0, label: '뱃지' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <div className="animate-fadeInUp pb-6">
        {/* 헤더 */}
        <div className="px-6 pt-2 pb-4 flex items-center justify-between flex-shrink-0">
          <div className="text-[22px] font-extrabold tracking-[-0.6px] text-g900">프로필</div>
          <Icon name="gear" size={22} color="#4E5968" weight={1.7} />
        </div>

        <div className="px-6">
          {/* 프로필 카드 */}
          <button
            type="button"
            onClick={() => canChangeNickname && setIsNicknameEditOpen(true)}
            className={`w-full flex items-center gap-3.5 p-4 rounded-[18px] bg-g50 transition-colors text-left ${
              canChangeNickname ? 'active:bg-g100 cursor-pointer' : 'cursor-default'
            }`}
          >
            <div
              className="w-[60px] h-[60px] rounded-full flex-shrink-0 flex items-center justify-center text-[24px] font-extrabold text-white tracking-[-1px]"
              style={{ backgroundColor: user.avatarColor ?? '#B0B8C1' }}
            >
              {user.nickname?.[0] ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[18px] font-extrabold tracking-[-0.3px] text-g900 truncate">
                  {user.nickname}
                </span>
                {badgeEmoji && <span className="text-[14px] flex-shrink-0">{badgeEmoji}</span>}
              </div>
              <div className="text-[12px] font-medium text-g600 mt-0.5">
                작성 리뷰 {user.reviewCount ?? 0}개
              </div>
              {!canChangeNickname && (
                <div className="text-[11px] font-medium text-g400 mt-0.5">
                  {remainingDays}일 후 변경 가능
                </div>
              )}
            </div>
            {canChangeNickname && <Icon name="chevR" size={14} color="#B0B8C1" weight={1.8} />}
          </button>

          {/* 진행도 */}
          <div className="mt-3">
            {isGold ? (
              <div className="p-3.5 rounded-[14px] bg-g50 text-[13px] font-semibold text-g700 text-center">
                🥇 최고 등급 골드입니다!
              </div>
            ) : (
              <ProgressBar
                current={progressCurrent}
                target={progressTarget}
                nextTierLabel={nextTierLabel}
                remaining={user.remaining ?? 0}
              />
            )}
          </div>

          {/* 통계 */}
          <div className="mt-3">
            <StatsGrid items={statsItems} />
          </div>

          {/* 내 리뷰 */}
          <div className="mt-[22px]">
            <div className="flex items-baseline justify-between mb-2.5">
              <span className="text-[16px] font-extrabold tracking-[-0.4px] text-g900">내가 쓴 리뷰</span>
              <span className="text-[13px] font-semibold text-g600">전체 {myReviews.length}</span>
            </div>

            {isReviewsLoading ? (
              <div>
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-3 py-[11px] animate-pulse">
                    <div className="w-11 h-11 rounded-[11px] bg-g100 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-28 bg-g100 rounded-full" />
                      <div className="h-3 w-20 bg-g100 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isReviewsError ? (
              <div className="p-5 rounded-2xl bg-g50 text-[13px] text-g500 text-center">
                리뷰를 불러오지 못했습니다
              </div>
            ) : myReviews.length === 0 ? (
              <Empty
                icon="bowl"
                title="아직 작성한 리뷰가 없어요"
                description="첫 리뷰의 주인공이 되어보세요"
                cta={{ label: '리뷰 쓸 메뉴 찾기', onClick: () => navigate('/menus') }}
              />
            ) : (
              <div className="divide-y divide-g100">
                {myReviews.map((review) => (
                  <button
                    key={review.id}
                    type="button"
                    onClick={() => navigate(`/menus/${review.menuId}/review`)}
                    className="w-full flex items-center gap-3 py-[11px] text-left active:bg-g50 transition-colors"
                  >
                    <Thumb corner={review.menuCorner ?? review.corner} size={44} radius={11} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[14.5px] font-bold tracking-[-0.3px] text-g900 truncate">
                          {review.menuName ?? `메뉴 #${review.menuId}`}
                        </span>
                        <span className="text-[11px] text-g500 flex-shrink-0">
                          {formatReviewDate(review.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-[3px]">
                        <Stars value={review.overall ?? 0} size={11} />
                        {(review.menuCorner ?? review.corner) && (
                          <span className="text-[11px] text-g500 ml-1">
                            {review.menuCorner ?? review.corner}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 로그아웃 */}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 w-full py-3.5 rounded-[14px] bg-g50 text-[15px] font-semibold text-g700 active:bg-g100 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>

      {isNicknameEditOpen && (
        <NicknameSetupModal
          mode="edit"
          initialNickname={user.nickname ?? ''}
          onClose={() => setIsNicknameEditOpen(false)}
        />
      )}
    </>
  )
}
