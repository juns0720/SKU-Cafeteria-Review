export default function Header({ user, onLogin, onLogout }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 h-14">
      <div className="max-w-[1100px] mx-auto h-full flex items-center justify-between px-4">
        <span
          className="text-xl text-primary leading-none"
          style={{ fontFamily: '"DM Serif Display", serif' }}
        >
          성결 학식
        </span>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700">{user.name}</span>
            <button
              onClick={onLogout}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
          >
            로그인
          </button>
        )}
      </div>
    </header>
  )
}
