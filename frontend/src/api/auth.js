import client from './client'

export const loginWithGoogle = (idToken) =>
  client.post('/auth/google', { idToken })

export const getMe = () => client.get('/auth/me')
