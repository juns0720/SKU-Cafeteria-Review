import { GoogleLogin } from '@react-oauth/google'

export default function Header({ user, isLoggedIn, onLoginSuccess, onLogout }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-gray-100 bg-white">
      <div className="mx-auto flex h-full max-w-[1100px] items-center justify-between px-4">
        <span
          className="text-xl leading-none text-primary"
          style={{ fontFamily: '"DM Serif Display", serif' }}
        >
          Cafeteria
        </span>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="font-user text-sm text-gray-700">
              {user.nickname ?? user.name}
            </span>
            <button
              onClick={onLogout}
              className="text-sm text-gray-400 transition-colors hover:text-gray-600"
            >
              로그아웃
            </button>
          </div>
        ) : isLoggedIn ? (
          <div className="flex items-center gap-3">
            <div className="h-5 w-24 animate-pulse rounded-full bg-gray-100" />
            <div className="h-4 w-12 animate-pulse rounded-full bg-gray-100" />
          </div>
        ) : (
          <GoogleLogin
            onSuccess={(credentialResponse) =>
              onLoginSuccess(credentialResponse.credential)
            }
            onError={() => {}}
            size="medium"
            shape="pill"
            text="signin_with"
            locale="ko"
          />
        )}
      </div>
    </header>
  )
}
