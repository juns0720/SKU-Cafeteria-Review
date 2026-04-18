import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import StarDisplay from './StarDisplay'
import StarRating from './StarRating'
import ReviewItem from './ReviewItem'
import useToast from '../hooks/useToast.jsx'
import { createReview } from '../api/reviews'

const CORNER_COLORS = {
  'A코너': 'bg-red-400',
  'B코너': 'bg-orange-400',
  'C코너': 'bg-yellow-400',
  '특식':  'bg-purple-400',
}

const MOCK_REVIEWS = [
  { reviewId: 1, authorName: '김성결', rating: 5, comment: '오늘 제육볶음 진짜 맛있었어요!', createdAt: '2025-04-17', isMine: true },
  { reviewId: 2, authorName: '이학식', rating: 4, comment: '괜찮았어요. 양이 조금 적었지만.', createdAt: '2025-04-16', isMine: false },
  { reviewId: 3, authorName: '박리뷰', rating: 3, comment: null, createdAt: '2025-04-15', isMine: false },
]

function ReviewForm({ menuId, onSuccess }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const { showToast, ToastComponent } = useToast()
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', menuId] })
      setRating(0)
      setComment('')
      showToast('리뷰가 등록되었습니다', 'success')
      onSuccess?.()
    },
    onError: (err) => {
      const status = err.response?.status
      const msg = status === 409
        ? '이미 리뷰를 작성했습니다'
        : (err.response?.data?.message ?? '오류가 발생했습니다')
      showToast(msg, 'error')
    },
  })

  const handleSubmit = () => {
    mutate({ menuId, rating, comment: comment.trim() || null })
  }

  return (
    <>
      {ToastComponent}
      <div className="py-3">
        <p className="text-sm font-bold text-gray-700 mb-3">리뷰 작성</p>
        <StarRating value={rating} onChange={setRating} />
        <textarea
          className="mt-3 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          rows={3}
          maxLength={500}
          placeholder="맛 어때요?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-400">{comment.length}/500</span>
          <button
            className="bg-primary text-white text-sm font-semibold px-4 py-1.5 rounded-lg disabled:opacity-40 transition-opacity"
            disabled={rating === 0 || isPending}
            onClick={handleSubmit}
          >
            {isPending ? '등록 중...' : '등록'}
          </button>
        </div>
      </div>
    </>
  )
}

export default function MenuDetailModal({ menu, isLoggedIn, onClose }) {
  if (!menu) return null

  const fallbackBg = CORNER_COLORS[menu.corner] ?? 'bg-gray-300'

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40 animate-fadeIn"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[90vh] flex flex-col animate-slideUp">
        {/* 닫기 버튼 */}
        <div className="flex justify-end px-4 pt-4 pb-2 flex-shrink-0">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={22} />
          </button>
        </div>

        {/* 스크롤 영역 */}
        <div className="overflow-y-auto flex-1 px-4 pb-8">
          {/* 음식 사진 */}
          <div className={`w-full aspect-video rounded-xl overflow-hidden mb-4 ${!menu.imageUrl ? fallbackBg : ''}`}>
            {menu.imageUrl ? (
              <img src={menu.imageUrl} alt={menu.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white text-4xl font-bold opacity-60">{menu.name[0]}</span>
              </div>
            )}
          </div>

          {/* 메뉴명 + 별점 + 리뷰수 */}
          <h3 className="text-xl font-bold text-gray-900 mb-1">{menu.name}</h3>
          <div className="flex items-center gap-2 mb-2">
            <StarDisplay rating={menu.averageRating ?? 0} size="md" />
            {menu.averageRating != null ? (
              <span className="text-sm text-gray-500">
                {menu.averageRating.toFixed(1)}
                <span className="ml-1 text-gray-400">({menu.reviewCount})</span>
              </span>
            ) : (
              <span className="text-sm text-gray-400">리뷰 없음</span>
            )}
          </div>

          {/* 코너 뱃지 */}
          <span className="inline-block bg-primary text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {menu.corner}
          </span>

          <hr className="my-4 border-gray-100" />

          {/* 리뷰 작성 영역 */}
          {isLoggedIn ? (
            <ReviewForm menuId={menu.menuId} />
          ) : (
            <p className="text-sm text-gray-400 text-center py-3">로그인 후 리뷰를 작성할 수 있습니다</p>
          )}

          <hr className="my-4 border-gray-100" />

          {/* 리뷰 목록 */}
          <h4 className="text-sm font-bold text-gray-700 mb-1">리뷰 {MOCK_REVIEWS.length}개</h4>
          <div>
            {MOCK_REVIEWS.map((review) => (
              <ReviewItem key={review.reviewId} {...review} menuId={menu.menuId} />
            ))}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
