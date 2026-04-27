import { GoogleLogin } from '@react-oauth/google'
import Icon from '../components/coral/Icon'

const ILLUSTRATIONS = [
  { icon: 'soup', bg: '#FFF1ED', color: '#E5766C' },
  { icon: 'bowl', bg: '#FFF5E0', color: '#E29A38' },
  { icon: 'chop', bg: '#EAF6EE', color: '#5A9C6E' },
]

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ display: 'block', flexShrink: 0 }}>
      <path d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.91-2.26c-.81.54-1.83.86-3.05.86-2.35 0-4.34-1.58-5.05-3.71H.96v2.33A9 9 0 009 18z" fill="#34A853" />
      <path d="M3.95 10.71A5.41 5.41 0 013.66 9c0-.59.1-1.17.29-1.71V4.96H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.04l2.99-2.33z" fill="#FBBC05" />
      <path d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.96 4.96L3.95 7.3C4.66 5.16 6.65 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}

export default function LoginPage({ onLoginSuccess }) {
  return (
    <div className="w-full min-h-[100dvh] bg-white flex flex-col">
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-6 pt-16">
        {/* Hero icon box */}
        <div className="w-24 h-24 rounded-[28px] bg-coralSoft flex items-center justify-center">
          <Icon name="bowl" size={56} color="#FF6B5C" weight={2} />
        </div>

        {/* Title */}
        <div
          className="text-g900 text-center mt-7 leading-[1.3]"
          style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.9px' }}
        >
          내일도 가고 싶은 학식<br />오늘 평가하기
        </div>

        {/* Sub copy */}
        <div
          className="text-g600 text-center mt-3"
          style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}
        >
          친구들 평점으로 3초 안에 결정해요
        </div>

        {/* Category illustration row — 로그인 전용 컬러 (예외) */}
        <div className="flex gap-3.5 mt-10">
          {ILLUSTRATIONS.map(({ icon, bg, color }) => (
            <div
              key={icon}
              className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center"
              style={{ backgroundColor: bg }}
            >
              <Icon name={icon} size={26} color={color} weight={1.7} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      {/* CTA */}
      <div className="px-6 pb-[18px] pt-3">
        <div className="relative h-[54px] w-full">
          {/* Custom button visual */}
          <div className="absolute inset-0 bg-g900 rounded-[14px] flex items-center justify-center gap-2 pointer-events-none select-none">
            <GoogleGlyph />
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px', color: '#fff' }}>
              Google로 계속하기
            </span>
          </div>
          {/* Invisible GoogleLogin overlay — triggers actual OAuth */}
          <GoogleLogin
            onSuccess={(res) => onLoginSuccess(res.credential)}
            onError={() => onLoginSuccess(null)}
            size="large"
            shape="rectangular"
            text="continue_with"
            locale="ko"
            width={500}
            containerProps={{
              style: {
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                borderRadius: 14,
                opacity: 0.01,
                height: 54,
              },
            }}
          />
        </div>
        <p
          className="text-g500 text-center mt-3.5"
          style={{ fontSize: 11, lineHeight: 1.4 }}
        >
          시작하면 이용약관·개인정보 처리방침에 동의합니다
        </p>
      </div>
    </div>
  )
}
