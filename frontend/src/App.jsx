import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import WeeklyPage from './pages/WeeklyPage'
import ReviewsPage from './pages/ReviewsPage'
import MyReviewsPage from './pages/MyReviewsPage'
import DevComponentsPage from './pages/DevComponentsPage'
import LoginPage from './pages/LoginPage'
import useAuth from './hooks/useAuth'
import useToast from './hooks/useToast.jsx'



const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 } },
})

function AppInner() {
  const { user, isLoggedIn, login, logout } = useAuth()
  const { showToast, ToastComponent } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const isLoginRoute = location.pathname === '/login'
  const isDevRoute = location.pathname === '/dev/components'
  const showHeader = !isLoginRoute && (isLoggedIn || isDevRoute)
  const showBottomNav = !isLoginRoute && isLoggedIn

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
      <Route path="/reviews" element={isLoggedIn ? <ReviewsPage /> : <Navigate to="/login" replace />} />
      <Route path="/my-reviews" element={isLoggedIn ? <MyReviewsPage /> : <Navigate to="/login" replace />} />
      <Route path="/dev/components" element={<DevComponentsPage />} />
      <Route path="*" element={<Navigate to={isLoggedIn ? '/' : '/login'} replace />} />
    </Routes>
  )

  return (
    <>
      {ToastComponent}
      {showHeader && (
        <Header user={user} onLoginSuccess={handleLoginSuccess} onLogout={handleLogout} />
      )}
      {isLoginRoute ? (
        routes
      ) : (
        <main className="pt-14 pb-16 max-w-[1100px] mx-auto w-full">
          {routes}
        </main>
      )}
      {showBottomNav && <BottomNav />}
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
