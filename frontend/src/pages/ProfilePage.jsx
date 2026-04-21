import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getMyReviews } from '../api/reviews'
import useAuth from '../hooks/useAuth'
import BadgeProgressBar from '../components/hi/BadgeProgressBar'
import Card from '../components/hi/Card'
import EmptyState from '../components/hi/EmptyState'
import Icon from '../components/hi/Icon'
import MultiStarSummary from '../components/hi/MultiStarSummary'
import NicknameSetupModal from '../components/hi/NicknameSetupModal'
import StatsGrid from '../components/hi/StatsGrid'

const MY_REVIEWS_QUERY_KEY = ['reviews', 'me']
const BADGE_META = {
  NONE: { emoji: '🌱', label: '시작 전', tone: '#F4ECDC' },
  BRONZE: { emoji: '🥉', label: '브론즈', tone: '#FCE3C9' },
  SILVER: { emoji: '🥈', label: '실버', tone: '#F4ECDC' },
  GOLD: { emoji: '🥇', label: '골드', tone: '#FBE6A6' },
}

function formatAverageRating(avgRating) {
  return avgRating == null ? '-' : Number(avgRating).toFixed(1)
}

function formatReviewDate(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return `${date.getMonth() + 1}.${date.getDate()} 작성`
}

function getProgressCopy(user) {
  if (!user) {
    return ''
  }

  const remaining = Math.max(user.remaining ?? 0, 0)
  if (remaining === 0) {
    return '지금 뱃지를 유지하고 있어요'
  }

  if (user.badgeTier === 'GOLD') {
    return `다음 목표까지 ${remaining}개 남았어요`
  }

  return `다음 뱃지까지 ${remaining}개 남았어요`
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-4 px-4 py-5 animate-fadeInUp">
      <div className="h-8 w-24 rounded-full bg-paperDeep shimmer-bg" />
      <div className="h-40 rounded-[28px] bg-paperDeep shimmer-bg" />
      <div className="h-24 rounded-[28px] bg-paperDeep shimmer-bg" />
      <div className="h-28 rounded-[28px] bg-paperDeep shimmer-bg" />
      <div className="h-44 rounded-[28px] bg-paperDeep shimmer-bg" />
    </div>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isNicknameEditOpen, setIsNicknameEditOpen] = useState(false)
  const { data: myReviews = [], isLoading, isError } = useQuery({
    queryKey: MY_REVIEWS_QUERY_KEY,
    queryFn: getMyReviews,
    enabled: Boolean(user),
  })

  if (!user) {
    return <ProfileSkeleton />
  }

  const badgeMeta = BADGE_META[user.badgeTier] ?? BADGE_META.NONE
  const progressMax = Math.max(user.nextTarget ?? 1, 1)
  const progressCurrent = Math.max(progressMax - (user.remaining ?? progressMax), 0)
  const stats = [
    { value: user.reviewCount ?? 0, label: '리뷰', bg: '#FCE3C9' },
    { value: formatAverageRating(user.avgRating), label: '평점', bg: '#FBE6A6' },
    { value: user.badgeCount ?? 0, label: '메달', bg: '#CDE5C8' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-4 px-4 py-5 animate-fadeInUp">
        <div>
          <div className="font-hand text-sm text-mute">마이 페이지</div>
          <h1 className="mt-1 font-disp text-[2rem] leading-none text-ink">프로필</h1>
        </div>

        <Card bg="#FFFFFF" style={{ padding: '20px 20px 18px' }}>
          <div className="flex items-start gap-4">
            <div
              className="mt-1 h-16 w-16 shrink-0 rounded-full border-[1.5px] border-ink shadow-card"
              style={{ backgroundColor: user.avatarColor ?? '#EF8A3D' }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="truncate font-user text-[1.75rem] leading-none text-ink">
                  {user.nickname}
                </div>
                <button
                  type="button"
                  aria-label="닉네임 수정"
                  onClick={() => setIsNicknameEditOpen(true)}
                  className="rounded-full border border-rule bg-paper p-2 text-ink transition-transform active:scale-[0.97]"
                >
                  <Icon name="pencil" size={15} color="#574635" />
                </button>
              </div>

              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-rule px-3 py-1.5 font-hand text-sm text-inkSoft">
                <span aria-hidden>{badgeMeta.emoji}</span>
                <span className="font-disp text-base text-ink">{badgeMeta.label}</span>
              </div>

              <p className="mt-3 font-hand text-sm leading-5 text-mute">
                {getProgressCopy(user)}
              </p>
            </div>
          </div>
        </Card>

        <Card bg={badgeMeta.tone} style={{ padding: '16px 18px' }}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="font-hand text-sm text-inkSoft">다음 단계 진행도</div>
              <div className="mt-1 font-disp text-lg text-ink">
                {progressCurrent} / {progressMax}
              </div>
            </div>
            <div className="rounded-full border border-rule bg-white px-3 py-1 font-hand text-xs text-mute">
              목표 {progressMax}개
            </div>
          </div>
          <BadgeProgressBar
            current={progressCurrent}
            max={progressMax}
            color={user.avatarColor ?? '#EF8A3D'}
          />
        </Card>

        <section>
          <div className="mb-3 font-hand text-sm text-mute">한눈에 보는 기록</div>
          <StatsGrid stats={stats} />
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="font-hand text-sm text-mute">최근 활동</div>
              <h2 className="mt-1 font-disp text-[1.5rem] leading-none text-ink">
                내가 쓴 리뷰
              </h2>
            </div>
            <div className="rounded-full border border-rule px-3 py-1 font-hand text-xs text-inkSoft">
              총 {myReviews.length}개
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {isLoading ? (
              <>
                <div className="h-32 rounded-[24px] bg-paperDeep shimmer-bg" />
                <div className="h-32 rounded-[24px] bg-paperDeep shimmer-bg" />
              </>
            ) : isError ? (
              <Card bg="#FFFFFF" style={{ padding: '18px 18px 16px' }}>
                <p className="font-hand text-sm leading-6 text-red">
                  내 리뷰를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                </p>
              </Card>
            ) : myReviews.length === 0 ? (
              <Card bg="#FFFFFF" style={{ padding: '8px 0' }}>
                <EmptyState
                  title="아직 작성한 리뷰가 없어요"
                  description="첫 리뷰의 주인공이 되어보세요"
                  illKind="bowl"
                  illBg="#FBE6A6"
                />
              </Card>
            ) : (
              myReviews.map((review) => (
                <Card key={review.id} bg="#FFFFFF" style={{ padding: '16px 16px 14px' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-disp text-[1.1rem] leading-none text-ink">
                        {review.menuName}
                      </div>
                      <div className="mt-2 font-hand text-xs text-mute">
                        {formatReviewDate(review.createdAt)}
                      </div>
                    </div>
                    <div className="rounded-full border border-rule bg-paper px-2.5 py-1 font-hand text-xs text-inkSoft">
                      평균 {Number(review.overall).toFixed(1)}
                    </div>
                  </div>

                  <div className="mt-4">
                    <MultiStarSummary
                      taste={review.taste}
                      amount={review.amount}
                      value={review.value}
                    />
                  </div>

                  <p className="mt-3 whitespace-pre-line font-hand text-sm leading-6 text-inkSoft">
                    {review.comment?.trim() || '한 마디는 비워뒀어요'}
                  </p>

                  {review.photoUrls?.length > 0 && (
                    <div className="mt-3 inline-flex rounded-full border border-rule bg-greenSoft px-2.5 py-1 font-hand text-xs text-inkSoft">
                      사진 {review.photoUrls.length}장
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </section>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-2 w-full rounded-[14px] border-[1.8px] border-ink bg-paper px-5 py-3 font-disp text-base text-ink shadow-flat transition-transform active:scale-[0.99]"
        >
          로그아웃
        </button>
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
