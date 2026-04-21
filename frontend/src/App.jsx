import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { createPortal } from 'react-dom'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import WeeklyPage from './pages/WeeklyPage'
import ReviewsPage from './pages/ReviewsPage'
import DevComponentsPage from './pages/DevComponentsPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import NicknameSetupModal from './components/hi/NicknameSetupModal'
import TabBarHi from './components/hi/TabBarHi'
import useAuth from './hooks/useAuth'
import useToast from './hooks/useToast.jsx'



const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 } },
})

const TAB_ROUTE_MAP = {
  home: '/',
  week: '/weekly',
  all: '/menus',
  me: '/profile',
}

function getActiveTab(pathname) {
  if (pathname.startsWith('/weekly')) {
    return 'week'
  }

  if (pathname.startsWith('/menus') || pathname.startsWith('/reviews')) {
    return 'all'
  }

  if (pathname.startsWith('/profile') || pathname.startsWith('/my-reviews')) {
    return 'me'
  }

  return 'home'
}

function TabBarPortal({ activeTab, onTabChange }) {
  if (typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <nav
      className="fixed bottom-0 left-0 right-0 z-[60]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto max-w-[1100px]">
        <TabBarHi active={activeTab} onTabChange={onTabChange} />
      </div>
    </nav>,
    document.body
  )
}

function AppInner() {
  const { user, isLoggedIn, login, logout } = useAuth()
  const { showToast, ToastComponent } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const isHomeRoute = location.pathname === '/'
  const isLoginRoute = location.pathname === '/login'
  const isDevRoute = location.pathname === '/dev/components'
  const showHeader = !isLoginRoute && !isHomeRoute && (isLoggedIn || isDevRoute)
  const showBottomNav = !isLoginRoute && !isDevRoute && isLoggedIn
  const isNicknameModalOpen = isLoggedIn && !isLoginRoute && user?.isNicknameSet === false
  const activeTab = getActiveTab(location.pathname)

  const handleLoginSuccess = async (credential) => {
    if (!credential) {
      showToast('Google 로그인 정보를 가져오지 못했습니다', 'error')
      return
    }

    try {
      await login(credential)
      showToast('로그인 되었습니다', 'success')

      if (location.pathname === '/login') {
        navigate('/', { replace: true })
      }
    } catch {
      showToast('로그인에 실패했습니다', 'error')
    }
  }

  const handleLogout = () => {
    logout()
    showToast('로그아웃 되었습니다', 'success')
    navigate('/login', { replace: true })
  }

  const handleTabChange = (nextTab) => {
    const nextPath = TAB_ROUTE_MAP[nextTab]
    if (!nextPath || nextPath === location.pathname) {
      return
    }

    navigate(nextPath)
  }

  const routes = (
    <Routes>
      <Route
        path="/login"
        element={
          isLoggedIn ? (
            <Navigate to="/" replace />
          ) : (
            <LoginPage onLoginSuccess={handleLoginSuccess} />
          )
        }
      />
      <Route path="/" element={isLoggedIn ? <HomePage /> : <Navigate to="/login" replace />} />
      <Route path="/weekly" element={isLoggedIn ? <WeeklyPage /> : <Navigate to="/login" replace />} />
      <Route path="/menus" element={isLoggedIn ? <ReviewsPage /> : <Navigate to="/login" replace />} />
      <Route path="/reviews" element={<Navigate to={isLoggedIn ? '/menus' : '/login'} replace />} />
      <Route path="/profile" element={isLoggedIn ? <ProfilePage /> : <Navigate to="/login" replace />} />
      <Route path="/my-reviews" element={<Navigate to="/profile" replace />} />
      <Route path="/dev/components" element={<DevComponentsPage />} />
      <Route path="*" element={<Navigate to={isLoggedIn ? '/' : '/login'} replace />} />
    </Routes>
  )

  return (
    <>
      {ToastComponent}
      {showHeader && (
        <Header
          user={user}
          isLoggedIn={isLoggedIn}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
        />
      )}
      {isLoginRoute ? (
        routes
      ) : (
        <main
          className={`${showHeader ? 'pt-14' : 'pt-0'} pb-24 max-w-[1100px] mx-auto w-full`}
        >
          {routes}
        </main>
      )}
      {showBottomNav && (
        <TabBarPortal activeTab={activeTab} onTabChange={handleTabChange} />
      )}
      {isNicknameModalOpen && (
        <NicknameSetupModal onClose={() => {}} />
      )}
    </>
  )
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppInner />
        </BrowserRouter>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  )
}
