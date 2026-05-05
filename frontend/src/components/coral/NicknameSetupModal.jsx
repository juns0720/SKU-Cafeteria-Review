import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQueryClient } from '@tanstack/react-query'
import { checkNicknameAvailability, updateNickname } from '../../api/users'
import {
  NICKNAME_AVAILABILITY_DELAY_MS,
  normalizeNickname,
  validateNickname,
  getNicknameLength,
} from '../../lib/nickname'
import Icon from './Icon'
import Button from './Button'

const AUTH_ME_QUERY_KEY = ['auth', 'me']
const MY_REVIEWS_QUERY_KEY = ['reviews', 'me']

const NICKNAME_SUGGESTIONS = ['냠냠이', '점심탐정', '학식러버', '오늘은한식', '돈까스킬러']

const INITIAL_AVAILABILITY = { status: 'idle', message: '', normalizedNickname: '' }

function toAvailabilityState(response) {
  if (response.available) {
    return { status: 'available', message: response.message, normalizedNickname: response.normalizedNickname }
  }
  return {
    status: response.reason === 'TAKEN' ? 'taken' : 'unavailable',
    message: response.message,
    normalizedNickname: response.normalizedNickname,
  }
}

export default function NicknameSetupModal({ onClose, mode = 'setup', initialNickname = '' }) {
  const queryClient = useQueryClient()
  const inputRef = useRef(null)
  const isEditMode = mode === 'edit'
  const initialNormalizedNickname = normalizeNickname(initialNickname)

  const [nickname, setNickname] = useState(initialNickname)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [availability, setAvailability] = useState(INITIAL_AVAILABILITY)
  const [availabilityCache, setAvailabilityCache] = useState(() => new Map())

  const canClose = isEditMode && !isSubmitting
  const localValidation = validateNickname(nickname)
  const normalizedNickname = localValidation.normalizedNickname
  const charCount = getNicknameLength(normalizedNickname)

  const isUnchanged =
    isEditMode &&
    normalizedNickname.length > 0 &&
    normalizedNickname === initialNormalizedNickname

  const cachedAvailability = localValidation.isValid ? availabilityCache.get(normalizedNickname) : null
  const hasCachedAvailability = Boolean(cachedAvailability)
  const currentAvailability =
    hasCachedAvailability
      ? cachedAvailability
      : availability.normalizedNickname === normalizedNickname
        ? availability
        : INITIAL_AVAILABILITY

  const isCheckingAvailability =
    Boolean(nickname) &&
    localValidation.isValid &&
    !isUnchanged &&
    !isComposing &&
    !hasCachedAvailability &&
    currentAvailability.normalizedNickname !== normalizedNickname

  const isSubmitDisabled =
    !localValidation.isValid ||
    isUnchanged ||
    currentAvailability.status !== 'available' ||
    isSubmitting ||
    isComposing

  // 가용성 상태 표시 결정
  let availabilityText = null
  let availabilityColor = ''
  if (submitError) {
    availabilityText = submitError
    availabilityColor = 'text-red-500'
  } else if (isUnchanged) {
    availabilityText = '현재 사용 중인 닉네임이에요'
    availabilityColor = 'text-g500'
  } else if (nickname && !localValidation.isValid) {
    availabilityText = localValidation.message
    availabilityColor = 'text-red-500'
  } else if (isComposing) {
    availabilityText = null
  } else if (isCheckingAvailability) {
    availabilityText = '확인 중...'
    availabilityColor = 'text-g500'
  } else if (currentAvailability.status === 'available') {
    availabilityText = '사용 가능'
    availabilityColor = 'text-[#22A06B]'
  } else if (currentAvailability.status === 'taken' || currentAvailability.status === 'unavailable') {
    availabilityText = currentAvailability.message || '사용할 수 없는 닉네임이에요'
    availabilityColor = 'text-red-500'
  }

  // body scroll lock + focus
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = window.setTimeout(() => inputRef.current?.focus(), 60)

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (canClose) onClose()
        else e.stopPropagation()
      }
    }
    window.addEventListener('keydown', onKeyDown, true)

    return () => {
      document.body.style.overflow = prev
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKeyDown, true)
    }
  }, [canClose, onClose])

  // mode/initialNickname 변경 시 리셋
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setNickname(initialNickname)
      setSubmitError('')
      setAvailability(INITIAL_AVAILABILITY)
      setAvailabilityCache(new Map())
    }, 0)

    return () => window.clearTimeout(timer)
  }, [initialNickname, mode])

  // 디바운스 가용성 체크
  useEffect(() => {
    if (!nickname || !localValidation.isValid || isComposing || hasCachedAvailability || isUnchanged) {
      return undefined
    }

    let cancelled = false
    const timer = window.setTimeout(async () => {
      try {
        const res = await checkNicknameAvailability(normalizedNickname)
        if (cancelled) return
        const next = toAvailabilityState(res)
        setAvailabilityCache((prev) => { const m = new Map(prev); m.set(normalizedNickname, next); return m })
        setAvailability(next)
      } catch (err) {
        if (cancelled) return
        setAvailability({
          status: 'unavailable',
          message: err.response?.data?.message ?? '닉네임 확인에 실패했습니다',
          normalizedNickname,
        })
      }
    }, NICKNAME_AVAILABILITY_DELAY_MS)

    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [nickname, localValidation.isValid, normalizedNickname, isComposing, hasCachedAvailability, isUnchanged])

  const handleSuggestionClick = (s) => {
    setNickname(s)
    setSubmitError('')
    inputRef.current?.focus()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitDisabled) return

    setIsSubmitting(true)
    setSubmitError('')
    const confirmed = currentAvailability.normalizedNickname || localValidation.normalizedNickname

    try {
      await updateNickname(confirmed)
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, (prev) =>
        prev ? { ...prev, nickname: confirmed, isNicknameSet: true } : prev
      )
      queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: MY_REVIEWS_QUERY_KEY })
      onClose()
    } catch (err) {
      const status = err.response?.status
      const msg = err.response?.data?.message
      if (status === 409 && msg?.includes('이미 사용 중')) {
        setAvailability({ status: 'taken', message: '이미 사용 중인 닉네임입니다', normalizedNickname: confirmed })
        setSubmitError('이미 사용 중인 닉네임입니다')
      } else if (status === 409) {
        const nextChangeAt = err.response?.data?.nextChangeAt
        if (nextChangeAt) {
          const days = Math.ceil((new Date(nextChangeAt) - Date.now()) / (1000 * 60 * 60 * 24))
          setSubmitError(`${Math.max(days, 1)}일 후에 변경할 수 있어요`)
        } else {
          setSubmitError('닉네임은 30일에 한 번만 변경할 수 있어요')
        }
      } else {
        setSubmitError(msg ?? '닉네임 저장에 실패했습니다')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onMouseDown={(e) => {
        if (canClose && e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nickname-modal-title"
        className="w-full max-w-[480px] rounded-t-[28px] bg-white flex flex-col"
        style={{ maxHeight: '92dvh' }}
      >
        {/* 상단 핸들 */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-9 h-1 rounded-full bg-g200" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pt-2 pb-1 flex-shrink-0">
          <span className="text-[12px] font-semibold text-g500">
            {isEditMode ? '프로필 설정' : '2 / 2 · 마지막 단계'}
          </span>
          {isEditMode && (
            <button
              type="button"
              aria-label="닫기"
              disabled={!canClose}
              onClick={() => { if (canClose) onClose() }}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-g100 active:bg-g200 transition-colors"
            >
              <Icon name="x" size={14} color="#4E5968" />
            </button>
          )}
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 overflow-y-auto px-6 pb-2">
          {/* 타이틀 */}
          <h2
            id="nickname-modal-title"
            className="text-[26px] font-extrabold leading-[1.3] tracking-[-0.7px] text-g900 mt-1"
          >
            {isEditMode ? (
              <>닉네임을 <span className="text-coral">바꿔볼까요?</span></>
            ) : (
              <>리뷰에 쓸<br /><span className="text-coral">닉네임</span>을 정해주세요</>
            )}
          </h2>

          {/* 입력 박스 */}
          <div
            className="mt-7 px-3.5 py-4 rounded-[14px] bg-g50"
            style={{ border: '2px solid #FF6B5C' }}
          >
            <div className="flex items-center gap-1">
              <label htmlFor="nickname-input" className="sr-only">닉네임</label>
              <input
                ref={inputRef}
                id="nickname-input"
                value={nickname}
                maxLength={24}
                disabled={isSubmitting}
                onChange={(e) => { setNickname(e.target.value); setSubmitError('') }}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={(e) => { setIsComposing(false); setNickname(e.target.value) }}
                placeholder={isEditMode ? '새 닉네임을 입력하세요' : '닉네임을 입력하세요'}
                className="min-w-0 flex-1 bg-transparent border-none outline-none text-[18px] font-bold tracking-[-0.3px] text-g900 placeholder:text-g400 placeholder:font-normal placeholder:text-[15px]"
              />
              {/* 코랄 캐럿 */}
              <span className="inline-block w-[2px] h-[22px] rounded-full bg-coral animate-pulse flex-shrink-0" />
              {/* 가용성 표시 */}
              {availabilityText && currentAvailability.status === 'available' && (
                <span className="flex items-center gap-1 ml-2 text-[12px] font-bold text-[#22A06B] flex-shrink-0">
                  <Icon name="check" size={12} color="#22A06B" />
                  사용 가능
                </span>
              )}
            </div>
          </div>

          {/* 힌트 + 카운터 */}
          <div className="flex items-center justify-between mt-2 px-1">
            {availabilityText && currentAvailability.status !== 'available' ? (
              <span className={`text-[11px] font-medium ${availabilityColor}`}>{availabilityText}</span>
            ) : (
              <span className="text-[11px] text-g500">2~12자 · 한 번 정하면 변경이 어려워요</span>
            )}
            <span className="text-[11px] font-semibold text-g700">{charCount} / 12</span>
          </div>

          {/* 30일 쿨다운 안내 */}
          <div className="mt-5 px-3.5 py-3 rounded-[12px] bg-g50 border border-g100">
            <div className="flex items-start gap-2">
              <Icon name="pencil" size={14} color="#8B95A1" />
              <p className="text-[12px] font-medium text-g600 leading-[1.5]">
                {isEditMode
                  ? '닉네임 변경은 30일에 한 번만 가능해요'
                  : '한 번 정하면 30일 동안 변경하기 어려워요'}
              </p>
            </div>
          </div>

          {/* 추천 닉네임 */}
          <div className="mt-6">
            <div className="text-[12px] font-bold text-g600 mb-2.5">추천 닉네임</div>
            <div className="flex flex-wrap gap-1.5">
              {NICKNAME_SUGGESTIONS.map((s) => {
                const isSelected = normalizedNickname === s
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSuggestionClick(s)}
                    className={`px-3.5 py-2 rounded-full text-[13px] font-semibold tracking-[-0.2px] transition-colors ${
                      isSelected
                        ? 'bg-g900 text-white'
                        : 'bg-g50 text-g700 hover:bg-g100'
                    }`}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pt-3 pb-safe flex-shrink-0" style={{ paddingBottom: 'max(18px, env(safe-area-inset-bottom))' }}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={`w-full py-4 rounded-[14px] text-[16px] font-bold tracking-[-0.3px] transition-all flex items-center justify-center gap-2 ${
              isSubmitDisabled
                ? 'bg-g100 text-g400 cursor-not-allowed'
                : 'bg-g900 text-white active:scale-[0.99]'
            }`}
          >
            {isSubmitting ? '저장 중...' : isEditMode ? '저장하기' : '시작하기'}
            {!isSubmitting && (
              <Icon name="arrow" size={16} color={isSubmitDisabled ? '#B0B8C1' : '#ffffff'} />
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
