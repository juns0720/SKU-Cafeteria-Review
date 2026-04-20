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

  const { data: user } = useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: () => getMe().then((res) => res.data),
    enabled: Boolean(accessToken),
    retry: false,
  })

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
