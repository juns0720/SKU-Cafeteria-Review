import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import StarDisplay from './StarDisplay'
import StarRating from './StarRating'
import useToast from '../hooks/useToast.jsx'
import { updateReview, deleteReview } from '../api/reviews'

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default function ReviewItem({
  reviewId, authorName, avatarUrl, rating, comment, createdAt, isMine, menuId,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editRating, setEditRating] = useState(rating)
  const [editComment, setEditComment] = useState(comment ?? '')

  const { showToast, ToastComponent } = useToast()
  const queryClient = useQueryClient()

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['reviews', menuId] })

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: () => updateReview(reviewId, { rating: editRating, comment: editComment.trim() || null }),
    onSuccess: () => {
      invalidate()
      setIsEditing(false)
      showToast('리뷰가 수정되었습니다', 'success')
    },
    onError: (err) => showToast(err.response?.data?.message ?? '수정에 실패했습니다', 'error'),
  })

  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteReview(reviewId),
    onSuccess: () => {
      invalidate()
      showToast('리뷰가 삭제되었습니다', 'success')
    },
    onError: (err) => showToast(err.response?.data?.message ?? '삭제에 실패했습니다', 'error'),
  })

  const handleDelete = () => {
    if (window.confirm('리뷰를 삭제할까요?')) remove()
  }

  const handleCancel = () => {
    setEditRating(rating)
    setEditComment(comment ?? '')
    setIsEditing(false)
  }

  return (
    <>
      {ToastComponent}
      <div className="flex gap-3 py-4 border-b border-gray-100 last:border-0">
        {/* 아바타 */}
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary-light flex items-center justify-center overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt={authorName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-primary text-sm font-bold">{authorName?.[0] ?? '?'}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* 닉네임 + 날짜 */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-800 truncate">{authorName}</span>
            <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(createdAt)}</span>
          </div>

          {isEditing ? (
            /* 편집 모드 */
            <>
              <StarRating value={editRating} onChange={setEditRating} />
              <textarea
                className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                rows={3}
                maxLength={500}
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => save()}
                  disabled={editRating === 0 || isSaving}
                  className="text-xs font-semibold bg-primary text-white px-3 py-1 rounded-md disabled:opacity-40"
                >
                  {isSaving ? '저장 중...' : '저장'}
                </button>
                <button
                  onClick={handleCancel}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  취소
                </button>
              </div>
            </>
          ) : (
            /* 보기 모드 */
            <>
              <StarDisplay rating={rating} size="sm" />
              {comment && (
                <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{comment}</p>
              )}
              {isMine && (
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    수정
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
                  >
                    {isDeleting ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
