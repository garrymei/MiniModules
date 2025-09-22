import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  withCredentials: false,
})

http.interceptors.request.use(config => {
  if (!config.headers.Authorization) {
    const stored = window.localStorage.getItem('mm_admin_token')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`
        }
      } catch (error) {
        console.warn('Failed to parse stored token', error)
      }
    }
  }
  return config
})

export default http
