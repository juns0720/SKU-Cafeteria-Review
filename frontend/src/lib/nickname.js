const FORMAT_PATTERN = /\p{Cf}/gu
const FILTER_STRIP_PATTERN = /[^\p{L}\p{N}]+/gu

const RESERVED_TERMS = new Set([
  'admin',
  'administrator',
  'official',
  'operator',
  'system',
  '공식',
  '관리자',
  '시스템',
  '운영자',
])

const BLOCKED_TERMS = [
  'fuck',
  'shit',
  'bitch',
  'dick',
  '개새끼',
  '걸레',
  '느금',
  '병신',
  '보지',
  '븅신',
  '섹스',
  '시발',
  '씨발',
  '애미',
  '자지',
  '존나',
  '좆',
  '지랄',
  '창녀',
  'ㅅㅂ',
]

export const NICKNAME_AVAILABILITY_DELAY_MS = 450

function replaceControlCharacters(value = '') {
  return Array.from(value, (character) => {
    const codePoint = character.codePointAt(0) ?? 0
    if (codePoint <= 0x1f || (codePoint >= 0x7f && codePoint <= 0x9f)) {
      return ' '
    }
    return character
  }).join('')
}

export function normalizeNickname(value = '') {
  const normalizedValue = `${value ?? ''}`.normalize('NFC')

  return replaceControlCharacters(normalizedValue)
    .replace(FORMAT_PATTERN, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function getNicknameLength(value = '') {
  return Array.from(value).length
}

export function createNicknameLookupKey(value = '') {
  return normalizeNickname(value).toLowerCase()
}

function createNicknameFilterKey(value = '') {
  return normalizeNickname(value)
    .toLowerCase()
    .replace(FILTER_STRIP_PATTERN, '')
}

export function validateNickname(value = '') {
  const normalizedNickname = normalizeNickname(value)
  const lookupKey = createNicknameLookupKey(normalizedNickname)
  const filterKey = createNicknameFilterKey(normalizedNickname)
  const length = getNicknameLength(normalizedNickname)

  if (!normalizedNickname) {
    return {
      isValid: false,
      normalizedNickname,
      lookupKey,
      length: 0,
      reason: 'INVALID_FORMAT',
      message: '닉네임을 입력해주세요',
    }
  }

  if (length < 2) {
    return {
      isValid: false,
      normalizedNickname,
      lookupKey,
      length,
      reason: 'TOO_SHORT',
      message: '닉네임은 2자 이상이어야 해요',
    }
  }

  if (length > 12) {
    return {
      isValid: false,
      normalizedNickname,
      lookupKey,
      length,
      reason: 'TOO_LONG',
      message: '닉네임은 12자 이하로 입력해주세요',
    }
  }

  if (!filterKey) {
    return {
      isValid: false,
      normalizedNickname,
      lookupKey,
      length,
      reason: 'INVALID_FORMAT',
      message: '보이지 않는 문자만으로는 닉네임을 만들 수 없어요',
    }
  }

  if (RESERVED_TERMS.has(filterKey)) {
    return {
      isValid: false,
      normalizedNickname,
      lookupKey,
      length,
      reason: 'RESERVED',
      message: '사용할 수 없는 닉네임입니다',
    }
  }

  const hasBlockedTerm = BLOCKED_TERMS.some((term) => filterKey.includes(term))
  if (hasBlockedTerm) {
    return {
      isValid: false,
      normalizedNickname,
      lookupKey,
      length,
      reason: 'PROFANITY',
      message: '부적절한 표현은 사용할 수 없어요',
    }
  }

  return {
    isValid: true,
    normalizedNickname,
    lookupKey,
    length,
    reason: 'OK',
    message: '사용 가능한 형식이에요',
  }
}
