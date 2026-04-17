import StarDisplay from './StarDisplay'

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default function ReviewItem({ reviewId, authorName, avatarUrl, rating, comment, createdAt, isMine, onEdit, onDelete }) {
  return (
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

        <StarDisplay rating={rating} size="sm" />

        {comment && (
          <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{comment}</p>
        )}

        {isMine && (
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => onEdit?.(reviewId)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              수정
            </button>
            <button
              onClick={() => onDelete?.(reviewId)}
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              삭제
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
