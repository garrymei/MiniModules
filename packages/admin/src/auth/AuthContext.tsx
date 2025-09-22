import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import http from '../lib/http'

const TOKEN_STORAGE_KEY = 'mm_admin_token'

interface AuthState {
  token: string | null
  user?: {
    id: string
    username: string
    role: string
  }
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const readStoredToken = () => {
  try {
    const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AuthState) : { token: null }
  } catch (error) {
    console.warn('Failed to parse stored auth token', error)
    return { token: null }
  }
}

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const navigate = useNavigate()
  const [state, setState] = useState<AuthState>(() => {
    if (typeof window === 'undefined') {
      return { token: null }
    }
    return readStoredToken()
  })

  useEffect(() => {
    if (state.token) {
      http.defaults.headers.common.Authorization = `Bearer ${state.token}`
    } else {
      delete http.defaults.headers.common.Authorization
    }
    window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await http.post('/auth/login', { username, password })
    setState({ token: data.token, user: data.user })
    navigate('/dashboard', { replace: true })
  }, [navigate])

  const logout = useCallback(() => {
    setState({ token: null, user: undefined })
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    navigate('/login', { replace: true })
  }, [navigate])

  const value = useMemo<AuthContextValue>(
    () => ({ token: state.token, user: state.user, login, logout }),
    [state.token, state.user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
