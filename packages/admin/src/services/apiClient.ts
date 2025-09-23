import axios from "axios"

import { API_BASE_URL, TOKEN_STORAGE_KEY } from "../config"

let authToken: string | null = typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : null

export const setAuthToken = (token: string | null) => {
  authToken = token
  if (typeof window === "undefined") {
    return
  }

  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
}

export const getAuthToken = () => authToken

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setAuthToken(null)
    }
    return Promise.reject(error)
  },
)
