import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { getMenuById } from '../api/menus'
import { deleteReview, getReviews } from '../api/reviews'
import AxisProgress from '../components/coral/AxisProgress'
import Empty from '../components/coral/Empty'
import Icon from '../components/coral/Icon'
import MultiStarSummary from '../components/coral/MultiStarSummary'
import Stars from '../components/coral/Stars'
import Thumb from '../components/coral/Thumb'
import useToast from '../hooks/useToast.jsx'

const BADGE_EMOJI = { GOLD: '🥇', SILVER: '🥈', BRONZE: '🥉', NONE: '' }

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

function formatLastSeen(value) {
  if (!value) return ''
  // "yyyy-mm-dd" 또는 ISO string 처리
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${+m[2]}월 ${+m[3]}일 제공`
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}월 ${d.getDate()}일 제공`
}

function DetailSkeleton() {
  return (
    <div className="animate-fadeInUp px-6 pt-2">
      <div className="w-9 h-9 rounded-full bg-g100 animate-pulse mb-4" />
      <div className="flex flex-col items-center gap-3 mb-6">
        <div className="w-[140px] h-[140px] rounded-[24px] bg-g100 animate-pulse" />
        <div className="h-4 w-24 bg-g100 rounded-full animate-pulse" />
        <div className="h-7 w-36 bg-g100 rounded-full animate-pulse" />
        <div className="h-4 w-28 bg-g100 rounded-full animate-pulse" />
      </div>
      <div className="h-24 rounded-2xl bg-g100 animate-pulse mb-5" />
      <div className="h-4 w-20 bg-g100 rounded-full animate-pulse mb-3" />
      {[1, 2].map((i) => (
        <div key={i} className="py-3.5 space-y-2">
          <div className="h-4 w-32 bg-g100 rounded-full animate-pulse" />
          <div className="h-3 w-24 bg-g100 rounded-full animate-pulse" />
          <div className="h-12 bg-g100 rounded-xl animate-pulse" />
        </div>
      ))}
    </div>
  )
}

function ReviewRow({ review, onDelete, onEdit, isDeleting }) {
  const badge = BADGE_EMOJI[review.authorBadgeTier] ?? ''
  const photoUrls = (review.photoUrls ?? []).filter(Boolean)

  return (
    <div className="py-3.5">
      {/* 작성자 row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] font-bold text-white"
            style={{ background: review.avatarColor ?? '#B0B8C1' }}
          >
            {review.nickname?.[0] ?? '?'}
          </div>
          <span className="text-[13px] font-bold text-g900 truncate">{review.nickname}</span>
          {badge && <span className="text-[13px] flex-shrink-0">{badge}</span>}
          <span className="text-[11px] text-g500 flex-shrink-0">· {formatDate(review.createdAt)}</span>
        </div>
        {/* 우측: 종합 별점 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Stars value={review.overallRating ?? 0} size={12} />
          <span className="text-[13px] font-bold text-g900">{(review.overallRating ?? 0).toFixed(1)}</span>
        </div>
      </div>

      {/* 3축 요약 */}
      <div className="mt-1.5">
        <MultiStarSummary
          taste={review.tasteRating}
          amount={review.amountRating}
          value={review.valueRating}
        />
      </div>

      {/* 코멘트 */}
      {review.comment && (
        <p className="text-[14px] text-g800 mt-2 leading-relaxed whitespace-pre-line">
          {review.comment}
        </p>
      )}

      {/* 사진 */}
      {photoUrls.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {photoUrls.map((url, i) => (
            <div key={i} className="aspect-square rounded-[12px] overflow-hidden bg-g100">
              <img src={url} alt={`리뷰 사진 ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* 내 리뷰 액션 */}
      {review.isMine && (
        <div className="flex items-center gap-2 mt-3">
          <button
            type="button"
            onClick={onEdit}
            disabled={isDeleting}
            className="text-[12px] font-semibold text-g700 px-3 py-1.5 rounded-full bg-g50 disabled:opacity-50"
          >
            수정
          </button>
          <button
            type="button"
            onClick={() => onDelete(review.id)}
            disabled={isDeleting}
            className="text-[12px] font-semibold text-red-500 px-3 py-1.5 rounded-full bg-g50 disabled:opacity-50"
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      )}
    </div>
  )
}

function CtaPortal({ label, onClick }) {
  if (typeof document === 'undefined') return null
  return createPortal(
    <div
      className="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-g100 px-6"
      style={{ paddingBottom: 'max(18px, env(safe-area-inset-bottom))', paddingTop: 12 }}
    >
      <button
        type="button"
        onClick={onClick}
        className="w-full py-4 bg-g900 text-white rounded-[14px] text-[16px] font-bold tracking-[-0.3px] flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
      >
        <Icon name="pencil" size={16} color="#fff" weight={2} />
        {label}
      </button>
    </div>,
    document.body
  )
}

export default function MenuDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { showToast, ToastComponent } = useToast()

  const menuId = Number(id)
  const isValidId = Number.isInteger(menuId) && menuId > 0

  const { data: menu, isLoading: isMenuLoading, isError: isMenuError } = useQuery({
    queryKey: ['menus', menuId],
    queryFn: () => getMenuById(menuId),
    enabled: isValidId,
  })

  const { data: reviewPage, isLoading: isReviewsLoading, isError: isReviewsError } = useQuery({
    queryKey: ['reviews', menuId],
    queryFn: () => getReviews(menuId),
    enabled: isValidId,
  })

  const reviews = reviewPage?.content ?? []
  const totalReviews = reviewPage?.totalElements ?? reviews.length
  const myReview = reviews.find((r) => r.isMine)

  const deleteMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['menus'] }),
        queryClient.invalidateQueries({ queryKey: ['reviews', menuId] }),
        queryClient.invalidateQueries({ queryKey: ['reviews', 'me'] }),
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }),
      ])
      showToast('리뷰가 삭제되었습니다', 'success')
    },
    onError: (err) => {
      showToast(err.response?.data?.message ?? '리뷰 삭제에 실패했습니다', 'error')
    },
  })

  const handleDelete = (reviewId) => {
    if (!window.confirm('리뷰를 삭제할까요?')) return
    deleteMutation.mutate(reviewId)
  }

  const handleOpenReview = () => navigate(`/menus/${menuId}/review`)

  // 잘못된 ID
  if (!isValidId) {
    return (
      <div className="animate-fadeInUp px-6 py-4">
        <BackButton onClick={() => navigate(-1)} />
        <div className="mt-4 p-5 rounded-2xl bg-g50 text-[15px] text-g700">잘못된 메뉴 경로예요.</div>
      </div>
    )
  }

  if (isMenuLoading) return <DetailSkeleton />

  if (isMenuError || !menu) {
    return (
      <>
        {ToastComponent}
        <div className="animate-fadeInUp px-6 py-4">
          <BackButton onClick={() => navigate(-1)} />
          <div className="mt-4">
            <Empty icon="bowl" title="메뉴를 불러오지 못했어요" description="잠시 후 다시 시도해주세요" />
          </div>
        </div>
      </>
    )
  }

  const hasAggregate = menu.avgTaste != null && menu.avgAmount != null && menu.avgValue != null

  return (
    <>
      {ToastComponent}

      <div className="animate-fadeInUp pb-[88px]">
        {/* 상단 바 */}
        <div className="px-4 py-2 flex items-center justify-between flex-shrink-0">
          <BackButton onClick={() => navigate(-1)} />
        </div>

        {/* Hero */}
        <div className="flex flex-col items-center px-6 pb-[18px] flex-shrink-0">
          <div className="relative">
            <Thumb corner={menu.corner} size={140} radius={24} />
            {menu.tier === 'GOLD' && (
              <div className="absolute top-2.5 left-2.5 bg-coral text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                BEST
              </div>
            )}
            {menu.isNew && (
              <div className="absolute top-2.5 right-2.5 bg-coralSoft text-coral text-[10px] font-bold px-1.5 py-px rounded-[3px]">
                NEW
              </div>
            )}
          </div>

          <div className="text-[13px] font-medium text-g500 mt-3.5">
            {[menu.corner, formatLastSeen(menu.lastSeenAt)].filter(Boolean).join(' · ')}
          </div>
          <h1 className="text-[26px] font-extrabold tracking-[-0.7px] text-g900 mt-0.5 text-center">
            {menu.name}
          </h1>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Stars value={menu.avgOverall ?? 0} size={16} />
            <span className="text-[17px] font-extrabold text-g900">
              {menu.avgOverall != null ? menu.avgOverall.toFixed(1) : '-'}
            </span>
            <span className="text-[13px] text-g500">· 리뷰 {menu.reviewCount ?? 0}개</span>
          </div>
        </div>

        {/* 3축 평균 */}
        <div className="mx-6 mb-[22px]">
          {hasAggregate ? (
            <AxisProgress taste={menu.avgTaste} amount={menu.avgAmount} value={menu.avgValue} />
          ) : (
            <div className="p-4 rounded-2xl bg-g50 text-[13px] text-g500 text-center">
              아직 집계된 리뷰가 없어요
            </div>
          )}
        </div>

        {/* 리뷰 섹션 */}
        <div className="px-6">
          <div className="flex items-baseline justify-between mb-2.5">
            <span className="text-[16px] font-extrabold tracking-[-0.4px] text-g900">
              리뷰 {totalReviews}
            </span>
            <span className="text-[13px] font-semibold text-g600">최신순</span>
          </div>

          {isReviewsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="py-3.5 space-y-2 animate-pulse">
                  <div className="flex gap-2 items-center">
                    <div className="w-8 h-8 rounded-full bg-g100" />
                    <div className="h-4 w-24 bg-g100 rounded-full" />
                  </div>
                  <div className="h-3 w-20 bg-g100 rounded-full" />
                  <div className="h-10 bg-g100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : isReviewsError ? (
            <Empty icon="soup" title="리뷰를 불러오지 못했습니다" description="잠시 후 다시 시도해주세요" />
          ) : reviews.length === 0 ? (
            <Empty
              icon="soup"
              title="아직 리뷰가 없어요"
              description="첫 리뷰의 주인공이 되어보세요"
              cta={{ label: '리뷰 쓰기', onClick: handleOpenReview }}
            />
          ) : (
            <div className="divide-y divide-g100">
              {reviews.map((review) => (
                <ReviewRow
                  key={review.id}
                  review={review}
                  onDelete={handleDelete}
                  onEdit={handleOpenReview}
                  isDeleting={deleteMutation.isPending && deleteMutation.variables === review.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 고정 CTA */}
      <CtaPortal
        label={myReview ? '리뷰 수정' : '리뷰 작성하기'}
        onClick={handleOpenReview}
      />
    </>
  )
}

function BackButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-9 h-9 rounded-full bg-g50 flex items-center justify-center active:bg-g100 transition-colors"
    >
      <Icon name="chevL" size={18} color="#191F28" weight={2} />
    </button>
  )
}
