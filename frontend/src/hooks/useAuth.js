import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { loginWithGoogle, getMe } from '../api/auth'

const AUTH_ME_QUERY_KEY = ['auth', 'me']

export default function useAuth() {
  const queryClient = useQueryClient()
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken'))

  useEffect(() => {
    const handleStorage = () => {
      setAccessToken(localStorage.getItem('accessToken'))
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const { data: user, isError } = useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: () => getMe().then((res) => res.data),
    enabled: Boolean(accessToken),
    retry: false,
  })

  // getMe() 실패 시 (만료 토큰 / 네트워크 오류) → 토큰 제거, 로그아웃 처리
  useEffect(() => {
    if (isError && accessToken) {
      localStorage.removeItem('accessToken')
      setAccessToken(null)
      queryClient.clear()
    }
  }, [isError, accessToken, queryClient])

  const login = async (idToken) => {
    const res = await loginWithGoogle(idToken)
    const nextAccessToken = res.data.accessToken

    localStorage.setItem('accessToken', nextAccessToken)
    setAccessToken(nextAccessToken)

    await queryClient.fetchQuery({
      queryKey: AUTH_ME_QUERY_KEY,
      queryFn: () => getMe().then((response) => response.data),
      retry: false,
    })
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    setAccessToken(null)
    queryClient.clear()
  }

  return {
    user,
    isLoggedIn: !!accessToken,
    login,
    logout,
  }
}
