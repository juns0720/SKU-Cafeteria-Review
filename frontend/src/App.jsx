import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import WeeklyPage from './pages/WeeklyPage'
import ReviewsPage from './pages/ReviewsPage'
import MyReviewsPage from './pages/MyReviewsPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Header />
        <main className="pt-14 pb-16 max-w-[1100px] mx-auto w-full">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/weekly" element={<WeeklyPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/my-reviews" element={<MyReviewsPage />} />
          </Routes>
        </main>
        <BottomNav />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
