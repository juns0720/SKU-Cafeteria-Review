import axios from 'axios'

const API_PREFIX = '/api/v1'
const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim()
const sanitizedBaseUrl = rawBaseUrl.replace(/\/+$/, '')
const normalizedBaseUrl = sanitizedBaseUrl
  ? (sanitizedBaseUrl.endsWith(API_PREFIX) ? sanitizedBaseUrl : `${sanitizedBaseUrl}${API_PREFIX}`)
  : API_PREFIX

const client = axios.create({
  baseURL: normalizedBaseUrl,
  timeout: 8000,
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken')
      if (window.location.pathname !== '/login') {
        window.location.replace('/login')
      }
    }
    return Promise.reject(error)
  }
)

export default client
