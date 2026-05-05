import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { createPortal } from 'react-dom'
import NicknameSetupModal from './components/coral/NicknameSetupModal'
import Tab from './components/coral/Tab'
import useAuth from './hooks/useAuth'
import useToast from './hooks/useToast.jsx'
import { USER_STALE_TIME } from './lib/queryTimes'

const AllMenusPage = lazy(() => import('./pages/AllMenusPage'))
const DevComponentsPage = lazy(() => import('./pages/DevComponentsPage'))
const HomePage = lazy(() => import('./pages/HomePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const MenuDetailPage = lazy(() => import('./pages/MenuDetailPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const ReviewWritePage = lazy(() => import('./pages/ReviewWritePage'))
const WeeklyPage = lazy(() => import('./pages/WeeklyPage'))



const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: USER_STALE_TIME,
      gcTime: 1000 * 60 * 5,
    },
    mutations: {
      retry: 0,
    },
  },
})

function getActiveTab(pathname) {
  if (pathname.startsWith('/weekly')) return 'week'
  if (pathname.startsWith('/menus') || pathname.startsWith('/reviews')) return 'all'
  if (pathname.startsWith('/profile') || pathname.startsWith('/my-reviews')) return 'me'
  return 'home'
}

function TabBarPortal({ current }) {
  if (typeof document === 'undefined') return null
  return createPortal(
    <nav
      className="fixed bottom-0 left-0 right-0 z-[60]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto max-w-[1100px]">
        <Tab current={current} />
      </div>
    </nav>,
    document.body
  )
}

function AppInner() {
  const { user, isLoggedIn, login } = useAuth()
  const { showToast, ToastComponent } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const isLoginRoute = location.pathname === '/login'
  const isDevRoute = location.pathname === '/dev/components'
  const isMenuSubRoute = /^\/menus\/[^/]+(?:\/.*)?$/.test(location.pathname)
  const showBottomNav = !isLoginRoute && !isDevRoute && !isMenuSubRoute && isLoggedIn
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

  return (
    <>
      {ToastComponent}
      <main className={`${showBottomNav ? 'pb-16' : 'pb-0'} max-w-[1100px] mx-auto w-full`}>
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
          <Routes>
            <Route
              path="/login"
              element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} />}
            />
            <Route path="/" element={isLoggedIn ? <HomePage /> : <Navigate to="/login" replace />} />
            <Route path="/weekly" element={isLoggedIn ? <WeeklyPage /> : <Navigate to="/login" replace />} />
            <Route path="/menus" element={isLoggedIn ? <AllMenusPage /> : <Navigate to="/login" replace />} />
            <Route path="/menus/:id" element={isLoggedIn ? <MenuDetailPage /> : <Navigate to="/login" replace />} />
            <Route path="/menus/:id/review" element={isLoggedIn ? <ReviewWritePage /> : <Navigate to="/login" replace />} />
            <Route path="/profile" element={isLoggedIn ? <ProfilePage /> : <Navigate to="/login" replace />} />
            <Route path="/reviews" element={<Navigate to={isLoggedIn ? '/menus' : '/login'} replace />} />
            <Route path="/my-reviews" element={<Navigate to="/profile" replace />} />
            <Route path="/dev/components" element={<DevComponentsPage />} />
            <Route path="*" element={<Navigate to={isLoggedIn ? '/' : '/login'} replace />} />
          </Routes>
        </Suspense>
      </main>
      {showBottomNav && <TabBarPortal current={activeTab} />}
      {isNicknameModalOpen && <NicknameSetupModal onClose={() => {}} />}
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
