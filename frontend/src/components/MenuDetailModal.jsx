import { X } from 'lucide-react'
import StarDisplay from './StarDisplay'
import ReviewItem from './ReviewItem'

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

export default function MenuDetailModal({ menu, isLoggedIn, onClose }) {
  if (!menu) return null

  const fallbackBg = CORNER_COLORS[menu.corner] ?? 'bg-gray-300'

  return (
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
            <p className="text-sm text-gray-400 text-center py-3">리뷰 작성 기능은 FE-5-2에서 구현됩니다</p>
          ) : (
            <p className="text-sm text-gray-400 text-center py-3">로그인 후 리뷰를 작성할 수 있습니다</p>
          )}

          <hr className="my-4 border-gray-100" />

          {/* 리뷰 목록 */}
          <h4 className="text-sm font-bold text-gray-700 mb-1">리뷰 {MOCK_REVIEWS.length}개</h4>
          <div>
            {MOCK_REVIEWS.map((review) => (
              <ReviewItem key={review.reviewId} {...review} />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
