import { GoogleLogin } from '@react-oauth/google'
import FoodIllust from '../components/hi/FoodIllust'
import UL from '../components/hi/UL'

function GoogleGlyph({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 18 18"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.91-2.26c-.81.54-1.83.86-3.05.86-2.35 0-4.34-1.58-5.05-3.71H.96v2.33A9 9 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.95 10.71A5.41 5.41 0 0 1 3.66 9c0-.59.1-1.17.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l2.99-2.33Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96L3.95 7.3C4.66 5.16 6.65 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  )
}

export default function LoginPage({ onLoginSuccess }) {
  return (
    <div className="min-h-screen bg-orangeSoft px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[420px] items-center justify-center">
        <section className="w-full rounded-screen border-[1.5px] border-ink bg-orangeSoft px-7 py-10 text-ink shadow-pop animate-fadeInUp md:px-8 md:py-12">
          <div className="mx-auto flex h-28 w-28 -rotate-3 items-center justify-center rounded-[26px] border-[2px] border-ink bg-white shadow-pop">
            <GoogleGlyph className="h-14 w-14" />
          </div>

          <h1 className="mt-8 text-center font-disp text-[2.125rem] leading-none text-ink">
            SKU <UL>학식</UL>
          </h1>

          <p className="mt-4 text-center text-lg leading-7 text-inkSoft">
            오늘 뭐 먹을지,
            <br />
            친구들 평점으로 3초 안에 결정해요
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <FoodIllust kind="soup" size={48} bg="#FBE6A6" />
            <FoodIllust kind="bowl" size={48} bg="#FFFFFF" />
            <FoodIllust kind="chop" size={48} bg="#CDE5C8" />
          </div>

          <div className="mt-6 flex justify-center">
            <div className="relative h-12 w-full max-w-[296px]">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-3 rounded-full border-[1.8px] border-ink bg-white px-5 shadow-flat">
                <GoogleGlyph className="h-5 w-5 shrink-0" />
                <span className="font-disp text-base text-ink">
                  Google 계정으로 바로 시작
                </span>
              </div>
              <GoogleLogin
                onSuccess={(credentialResponse) => onLoginSuccess(credentialResponse.credential)}
                onError={() => onLoginSuccess(null)}
                size="large"
                shape="pill"
                text="continue_with"
                locale="ko"
                width="296"
                containerProps={{
                  className: 'absolute inset-0 overflow-hidden rounded-full',
                  style: {
                    height: 48,
                    opacity: 0.01,
                  },
                }}
              />
            </div>
          </div>

          <p className="mt-4 text-center text-xs leading-5 text-mute">
            시작하면 이용약관 및 개인정보 처리방침에 동의한 것으로 간주합니다.
          </p>
        </section>
      </div>
    </div>
  )
}
