import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { getMenuById } from '../api/menus'
import { createReview, getMyReviews, updateReview } from '../api/reviews'
import Icon from '../components/coral/Icon'
import MultiStarInput from '../components/coral/MultiStarInput'
import Thumb from '../components/coral/Thumb'
import useToast from '../hooks/useToast.jsx'

const EMPTY_FORM = { taste: 0, amount: 0, value: 0, comment: '' }

function formatLastSeen(value) {
  if (!value) return ''
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${+m[2]}월 ${+m[3]}일 제공`
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}월 ${d.getDate()}일 제공`
}

function WriteSkeleton() {
  return (
    <div className="animate-fadeInUp px-6 pt-2">
      <div className="flex items-center justify-between mb-4">
        <div className="w-9 h-9 rounded-full bg-g100 animate-pulse" />
        <div className="h-5 w-20 bg-g100 rounded-full animate-pulse" />
        <div className="w-9" />
      </div>
      <div className="h-[74px] rounded-2xl bg-g100 animate-pulse mb-[22px]" />
      <div className="space-y-[22px]">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2.5">
            <div className="flex justify-between">
              <div className="h-5 w-16 bg-g100 rounded-full animate-pulse" />
              <div className="h-4 w-8 bg-g100 rounded-full animate-pulse" />
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="w-8 h-8 bg-g100 rounded-full animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CtaPortal({ label, onClick, disabled }) {
  if (typeof document === 'undefined') return null
  return createPortal(
    <div
      className="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-g100 px-6"
      style={{ paddingBottom: 'max(18px, env(safe-area-inset-bottom))', paddingTop: 12 }}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="w-full py-4 bg-g900 text-white rounded-[14px] text-[16px] font-bold tracking-[-0.3px] flex items-center justify-center gap-2 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {label}
      </button>
    </div>,
    document.body
  )
}

export default function ReviewWritePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { showToast, ToastComponent } = useToast()
  const menuId = Number(id)
  const isValidId = Number.isInteger(menuId) && menuId > 0
  const [form, setForm] = useState(EMPTY_FORM)

  const { data: menu, isLoading: isMenuLoading, isError: isMenuError } = useQuery({
    queryKey: ['menus', menuId],
    queryFn: () => getMenuById(menuId),
    enabled: isValidId,
  })

  const { data: myReviews = [], isLoading: isMyReviewsLoading } = useQuery({
    queryKey: ['reviews', 'me'],
    queryFn: getMyReviews,
    enabled: isValidId,
  })

  const existingReview = myReviews.find((r) => r.menuId === menuId)
  const isEditMode = Boolean(existingReview)

  useEffect(() => {
    if (!existingReview) return
    setForm({
      taste: existingReview.tasteRating ?? 0,
      amount: existingReview.amountRating ?? 0,
      value: existingReview.valueRating ?? 0,
      comment: existingReview.comment ?? '',
    })
  }, [existingReview?.id])

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      isEditMode
        ? updateReview(existingReview.id, payload)
        : createReview(menuId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['menus'] }),
        queryClient.invalidateQueries({ queryKey: ['reviews', menuId] }),
        queryClient.invalidateQueries({ queryKey: ['reviews', 'me'] }),
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }),
      ])
      navigate(`/menus/${menuId}`, { replace: true })
    },
    onError: (err) => {
      showToast(err.response?.data?.message ?? '리뷰 저장에 실패했습니다', 'error')
    },
  })

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate(`/menus/${menuId}`, { replace: true })
  }

  const handleStarChange = (field, rating) => {
    setForm((prev) => ({ ...prev, [field]: rating }))
  }

  const handleSubmit = () => {
    if (saveMutation.isPending) return
    if (form.taste === 0 || form.amount === 0 || form.value === 0) {
      showToast('3축 별점을 모두 선택해 주세요', 'error')
      return
    }
    saveMutation.mutate({
      tasteRating: form.taste,
      amountRating: form.amount,
      valueRating: form.value,
      comment: form.comment.trim() || null,
      photoUrls: [],
    })
  }

  if (!isValidId) {
    return (
      <div className="animate-fadeInUp px-6 py-4">
        <BackButton onClick={() => navigate('/menus')} />
        <div className="mt-4 p-5 rounded-2xl bg-g50 text-[15px] text-g700">잘못된 메뉴 경로예요.</div>
      </div>
    )
  }

  if (isMenuLoading || isMyReviewsLoading) return <WriteSkeleton />

  if (isMenuError || !menu) {
    return (
      <>
        {ToastComponent}
        <div className="animate-fadeInUp px-6 py-4">
          <BackButton onClick={handleBack} />
          <div className="mt-4 p-5 rounded-2xl bg-g50 text-[15px] text-g700">메뉴를 불러오지 못했어요.</div>
        </div>
      </>
    )
  }

  const isFormComplete = form.taste > 0 && form.amount > 0 && form.value > 0
  const pageTitle = isEditMode ? '리뷰 수정' : '리뷰 쓰기'
  const submitLabel = saveMutation.isPending
    ? (isEditMode ? '저장 중...' : '등록 중...')
    : (isEditMode ? '리뷰 저장' : '리뷰 등록')

  return (
    <>
      {ToastComponent}

      <div className="animate-fadeInUp pb-[88px]">
        {/* Header */}
        <div className="px-4 py-2 flex items-center justify-between flex-shrink-0">
          <BackButton onClick={handleBack} />
          <span className="text-[16px] font-bold tracking-[-0.3px] text-g900">{pageTitle}</span>
          <div className="w-9" />
        </div>

        <div className="px-6">
          {/* 메뉴 카드 */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-g50 mb-[22px]">
            <Thumb corner={menu.corner} size={52} radius={12} />
            <div className="min-w-0">
              <div className="text-[12px] font-medium text-g500">
                {[menu.corner, formatLastSeen(menu.lastSeenAt)].filter(Boolean).join(' · ')}
              </div>
              <div className="text-[16px] font-bold tracking-[-0.3px] text-g900 mt-0.5 truncate">
                {menu.name}
              </div>
            </div>
          </div>

          {/* 3축 별점 */}
          <MultiStarInput value={form} onChange={handleStarChange} />

          {/* 코멘트 */}
          <div className="mt-[22px]">
            <div className="flex items-baseline">
              <span className="text-[16px] font-extrabold tracking-[-0.3px] text-g900">한 마디</span>
              <span className="text-[12px] text-g500 ml-2">(선택)</span>
              <span className="ml-auto text-[12px] text-g500">{form.comment.length} / 500</span>
            </div>
            <textarea
              value={form.comment}
              onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value.slice(0, 500) }))}
              placeholder="바삭함이 좋았는지, 양이 넉넉했는지 한 마디로 남겨보세요."
              rows={4}
              className="mt-2.5 w-full resize-none bg-g50 rounded-[14px] px-3.5 py-3.5 text-[14px] text-g800 placeholder:text-g400 outline-none leading-relaxed"
            />
          </div>

          {/* 사진 첨부 (Phase D) */}
          <div className="flex items-center gap-2 mt-3">
            <Icon name="cam" size={16} color="#6B7684" weight={1.7} />
            <span className="text-[12px] font-semibold text-g600">사진 첨부 (선택)</span>
            <span className="text-[11px] text-g400">Phase D 예정</span>
          </div>
        </div>
      </div>

      <CtaPortal
        label={submitLabel}
        onClick={handleSubmit}
        disabled={!isFormComplete || saveMutation.isPending}
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
      <Icon name="x" size={18} color="#191F28" weight={2} />
    </button>
  )
}
