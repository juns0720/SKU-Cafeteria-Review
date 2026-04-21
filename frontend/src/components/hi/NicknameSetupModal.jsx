import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createPortal } from 'react-dom'
import { checkNicknameAvailability, updateNickname } from '../../api/users'
import {
  NICKNAME_AVAILABILITY_DELAY_MS,
  normalizeNickname,
  validateNickname,
} from '../../lib/nickname'
import Card from './Card'
import Icon from './Icon'
import UL from './UL'

const AUTH_ME_QUERY_KEY = ['auth', 'me']
const MY_REVIEWS_QUERY_KEY = ['reviews', 'me']
const NICKNAME_SUGGESTIONS = [
  '학식탐험가',
  '오늘도한끼',
  '바삭한한입',
  '급식메이트',
  '국밥수호대',
]
const DEFAULT_HELPER_MESSAGE = '2~12자로 입력해주세요'
const INITIAL_AVAILABILITY = {
  status: 'idle',
  message: '',
  normalizedNickname: '',
}

function toAvailabilityState(response) {
  if (response.available) {
    return {
      status: 'available',
      message: response.message,
      normalizedNickname: response.normalizedNickname,
    }
  }

  return {
    status: response.reason === 'TAKEN' ? 'taken' : 'unavailable',
    message: response.message,
    normalizedNickname: response.normalizedNickname,
  }
}

export default function NicknameSetupModal({
  onClose,
  mode = 'setup',
  initialNickname = '',
}) {
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
  const isUnchanged =
    isEditMode &&
    normalizedNickname.length > 0 &&
    normalizedNickname === initialNormalizedNickname
  const cachedAvailability = localValidation.isValid
    ? availabilityCache.get(normalizedNickname)
    : null
  const hasCachedAvailability = Boolean(cachedAvailability)
  const currentAvailability = hasCachedAvailability
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

  let helperMessage = DEFAULT_HELPER_MESSAGE
  let helperColor = 'text-mute'

  if (submitError) {
    helperMessage = submitError
    helperColor = 'text-red'
  } else if (isUnchanged) {
    helperMessage = '현재 사용 중인 닉네임이에요'
  } else if (nickname && !localValidation.isValid) {
    helperMessage = localValidation.message
    helperColor = 'text-red'
  } else if (isComposing) {
    helperMessage = '입력이 끝나면 사용 가능 여부를 확인할게요'
  } else if (isCheckingAvailability) {
    helperMessage = '사용 가능 여부 확인 중...'
  } else if (currentAvailability.status === 'available') {
    helperMessage = currentAvailability.message
    helperColor = 'text-green'
  } else if (
    currentAvailability.status === 'taken' ||
    currentAvailability.status === 'unavailable'
  ) {
    helperMessage = currentAvailability.message
    helperColor = 'text-red'
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus()
    }, 60)

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (canClose) {
          onClose()
        } else {
          event.stopPropagation()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)

    return () => {
      document.body.style.overflow = previousOverflow
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [canClose, onClose])

  useEffect(() => {
    setNickname(initialNickname)
    setSubmitError('')
    setAvailability(INITIAL_AVAILABILITY)
    setAvailabilityCache(new Map())
  }, [initialNickname, mode])

  useEffect(() => {
    if (
      !nickname ||
      !localValidation.isValid ||
      isComposing ||
      hasCachedAvailability ||
      isUnchanged
    ) {
      return undefined
    }

    let isCancelled = false
    const timer = window.setTimeout(async () => {
      try {
        const response = await checkNicknameAvailability(normalizedNickname)
        if (isCancelled) {
          return
        }

        const nextAvailability = toAvailabilityState(response)
        setAvailabilityCache((previousCache) => {
          const nextCache = new Map(previousCache)
          nextCache.set(normalizedNickname, nextAvailability)
          return nextCache
        })
        setAvailability(nextAvailability)
      } catch (error) {
        if (isCancelled) {
          return
        }

        setAvailability({
          status: 'unavailable',
          message: error.response?.data?.message ?? '닉네임 확인에 실패했습니다',
          normalizedNickname,
        })
      }
    }, NICKNAME_AVAILABILITY_DELAY_MS)

    return () => {
      isCancelled = true
      window.clearTimeout(timer)
    }
  }, [
    nickname,
    localValidation.isValid,
    normalizedNickname,
    isComposing,
    hasCachedAvailability,
    isUnchanged,
  ])

  const handleSuggestionClick = (suggestion) => {
    setNickname(suggestion)
    setSubmitError('')
    inputRef.current?.focus()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (isSubmitDisabled) {
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    const confirmedNickname =
      currentAvailability.normalizedNickname || localValidation.normalizedNickname

    try {
      await updateNickname(confirmedNickname)
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, (previousUser) => {
        if (!previousUser) {
          return previousUser
        }

        return {
          ...previousUser,
          nickname: confirmedNickname,
          isNicknameSet: true,
        }
      })
      queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: MY_REVIEWS_QUERY_KEY })
      onClose()
    } catch (error) {
      const status = error.response?.status
      const message = error.response?.data?.message

      if (status === 409 && message?.includes('이미 사용 중')) {
        setAvailability({
          status: 'taken',
          message: '이미 사용 중인 닉네임입니다',
          normalizedNickname: confirmedNickname,
        })
        setSubmitError('이미 사용 중인 닉네임입니다')
      } else {
        setSubmitError(message ?? '닉네임 저장에 실패했습니다')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(43,34,24,0.34)] px-4 py-6 animate-fadeIn"
      onMouseDown={(event) => {
        if (canClose && event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nickname-setup-title"
        className="w-full max-w-[420px] rounded-[28px] border-[1.5px] border-ink bg-paper shadow-pop animate-slideUp"
      >
        <div className="relative border-b border-dashed border-rule px-5 py-4">
          {isEditMode && (
            <button
              type="button"
              aria-label="닉네임 편집 닫기"
              disabled={!canClose}
              onClick={() => {
                if (canClose) {
                  onClose()
                }
              }}
              className="absolute right-4 top-4 rounded-full border border-rule bg-white p-2 text-ink transition-transform active:scale-[0.97]"
            >
              <Icon name="x" size={14} />
            </button>
          )}
          <div className="font-hand text-sm text-mute">
            {isEditMode ? '프로필 설정' : '2 / 2 · 마지막 단계'}
          </div>
          <h2
            id="nickname-setup-title"
            className="mt-2 font-disp text-[1.9rem] leading-[1.15] text-ink"
          >
            {isEditMode ? '프로필에서' : '리뷰에서'}
            <br />
            <UL>닉네임</UL>을 {isEditMode ? '바꿔볼까요?' : '정해주세요'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5">
          <Card bg="#FFFFFF" style={{ padding: '16px 16px 14px' }}>
            <label htmlFor="nickname-input" className="sr-only">
              닉네임
            </label>
            <div className="flex items-end gap-2">
              <input
                ref={inputRef}
                id="nickname-input"
                value={nickname}
                maxLength={24}
                disabled={isSubmitting}
                onChange={(event) => {
                  setNickname(event.target.value)
                  setSubmitError('')
                }}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={(event) => {
                  setIsComposing(false)
                  setNickname(event.target.value)
                }}
                placeholder={isEditMode ? '새 닉네임을 입력하세요' : '닉네임을 입력하세요'}
                className="min-w-0 flex-1 border-none bg-transparent font-user text-[1.55rem] leading-none text-ink outline-none placeholder:font-hand placeholder:text-lg placeholder:text-mute"
              />
              <span className="mb-[2px] inline-block h-7 w-[2px] animate-pulse rounded-full bg-orange" />
            </div>
          </Card>

          <div className="mt-2 flex items-center justify-between px-1">
            <p className={`font-hand text-xs ${helperColor}`}>
              {helperMessage}
            </p>
            <span className="font-hand text-xs text-inkSoft">
              {localValidation.length} / 12
            </span>
          </div>

          <div className="mt-4 rounded-2xl border border-rule bg-orangeSoft/65 px-4 py-3">
            <div className="flex items-start gap-2">
              <span className="mt-0.5">
                <Icon name="pencil" size={16} color="#EF8A3D" />
              </span>
              <p className="font-hand text-sm leading-5 text-inkSoft">
                {isEditMode
                  ? '닉네임 변경은 30일에 한 번만 가능해요'
                  : '한 번 정하면 30일 동안 변경하기 어려워요'}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-3 font-hand text-sm text-mute">✨ 추천 닉네임</div>
            <div className="flex flex-wrap gap-2">
              {NICKNAME_SUGGESTIONS.map((suggestion) => {
                const isSelected = normalizedNickname === suggestion

                return (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`rounded-full border-[1.5px] px-3 py-2 font-user text-sm shadow-card transition-transform active:scale-[0.98] ${
                      isSelected
                        ? 'border-ink bg-yellowSoft text-ink'
                        : 'border-ink bg-white text-ink'
                    }`}
                  >
                    {suggestion}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`mt-8 flex w-full items-center justify-center gap-2 rounded-[14px] border-[1.8px] border-ink px-5 py-3 font-disp text-base shadow-flat transition-transform ${
              isSubmitDisabled
                ? 'cursor-not-allowed bg-paperDeep text-mute'
                : 'bg-ink text-paper active:scale-[0.99]'
            }`}
          >
            <span>
              {isSubmitting
                ? '저장 중...'
                : isEditMode
                  ? '저장하기'
                  : '시작하기'}
            </span>
            <Icon
              name="chevR"
              size={16}
              color={isSubmitDisabled ? '#8E7A66' : '#FBF6EC'}
            />
          </button>
        </form>
      </div>
    </div>,
    document.body
  )
}
