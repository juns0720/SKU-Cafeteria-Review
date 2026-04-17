import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import WeeklyPage from './pages/WeeklyPage'
import ReviewsPage from './pages/ReviewsPage'
import MyReviewsPage from './pages/MyReviewsPage'
import useAuth from './hooks/useAuth'
import useToast from './hooks/useToast.jsx'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 } },
})

function AppInner() {
  const { user, isLoggedIn, login, logout } = useAuth()
  const { showToast, ToastComponent } = useToast()

  const handleLoginSuccess = async (credential) => {
    try {
      await login(credential)
      showToast('로그인 되었습니다', 'success')
    } catch {
      showToast('로그인에 실패했습니다', 'error')
    }
  }

  const handleLogout = () => {
    logout()
    showToast('로그아웃 되었습니다', 'success')
  }

  return (
    <>
      {ToastComponent}
      <Header user={user} onLoginSuccess={handleLoginSuccess} onLogout={handleLogout} />
      <main className="pt-14 pb-16 max-w-[1100px] mx-auto w-full">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/weekly" element={<WeeklyPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/my-reviews" element={<MyReviewsPage />} />
        </Routes>
      </main>
      <BottomNav />
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
