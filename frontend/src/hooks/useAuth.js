import { useQuery, useQueryClient } from '@tanstack/react-query'
import { loginWithGoogle, getMe } from '../api/auth'

export default function useAuth() {
  const queryClient = useQueryClient()
  const accessToken = localStorage.getItem('accessToken')

  const { data: user } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => getMe().then((res) => res.data),
    enabled: !!accessToken,
    retry: false,
  })

  const login = async (idToken) => {
    const res = await loginWithGoogle(idToken)
    localStorage.setItem('accessToken', res.data.accessToken)
    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    queryClient.clear()
  }

  return {
    user,
    isLoggedIn: !!accessToken,
    login,
    logout,
  }
}
