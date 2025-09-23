import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import type { AuthUser, LoginPayload } from "../types/auth"
import { getAuthToken, setAuthToken } from "../services/apiClient"
import { getProfile, login as loginRequest, logout as logoutRequest } from "../services/auth"

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const initialToken = getAuthToken()
  const [token, setToken] = useState<string | null>(initialToken)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(initialToken))

  useEffect(() => {
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    getProfile()
      .then((profile) => {
        if (!cancelled) {
          setUser(profile)
        }
      })
      .catch((error) => {
        console.error("Failed to fetch profile", error)
        if (!cancelled) {
          setToken(null)
          setAuthToken(null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const login = useCallback(async (payload: LoginPayload) => {
    setIsLoading(true)
    try {
      const response = await loginRequest(payload)
      if (!response.token) {
        throw new Error("Token missing in login response")
      }
      setToken(response.token)
      setAuthToken(response.token)
      if (response.user) {
        setUser(response.user)
      } else {
        const profile = await getProfile()
        setUser(profile)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    logoutRequest()
    setToken(null)
    setAuthToken(null)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isLoading,
      login,
      logout,
    }),
    [user, token, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuthContext = (): AuthContextValue => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider")
  }
  return context
}
