import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import type { AuthUser, LoginPayload } from "../types/auth"
import { getAuthToken, setAuthToken } from "../services/apiClient"
import { getPermissions, getProfile, login as loginRequest, logout as logoutRequest } from "../services/auth"

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  enabledModules: string[]
  permissions: string[]
  activeTenantId: string | null
  login: (payload: LoginPayload) => Promise<void>
  logout: () => void
  switchTenant: (tenantId: string) => Promise<void>
  hasModule: (moduleKey: string) => boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const initialToken = getAuthToken()
  const [token, setToken] = useState<string | null>(initialToken)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(Boolean(initialToken))
  const [isLoadingPermissions, setIsLoadingPermissions] = useState<boolean>(false)
  const [enabledModules, setEnabledModules] = useState<string[]>([])
  const [permissions, setPermissions] = useState<string[]>([])
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null)

  const hydratePermissions = useCallback(
    async (tenantId?: string) => {
      if (!token) {
        setEnabledModules([])
        setPermissions([])
        setActiveTenantId(null)
        return
      }
      const effectiveTenantId = tenantId || activeTenantId || user?.tenantId || user?.tenants?.[0] || null
      if (!effectiveTenantId) {
        return
      }
      setIsLoadingPermissions(true)
      try {
        const profile = await getPermissions(effectiveTenantId)
        setEnabledModules(profile.enabledModules)
        setPermissions(profile.permissions)
        setActiveTenantId(profile.tenantId)
      } catch (error) {
        console.error("Failed to load permissions", error)
        setEnabledModules([])
        setPermissions([])
      } finally {
        setIsLoadingPermissions(false)
      }
    },
    [token, activeTenantId, user?.tenantId, user?.tenants],
  )

  useEffect(() => {
    if (!token) {
      setUser(null)
      setEnabledModules([])
      setPermissions([])
      setActiveTenantId(null)
      setIsLoadingProfile(false)
      return
    }

    let cancelled = false
    setIsLoadingProfile(true)
    getProfile()
      .then((profile) => {
        if (cancelled) return
        setUser(profile)
        hydratePermissions(profile.tenantId || profile.tenants?.[0]).catch((error) => {
          console.error("Permissions hydration failed", error)
        })
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
          setIsLoadingProfile(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [token, hydratePermissions])

  const login = useCallback(async (payload: LoginPayload) => {
    setIsLoadingProfile(true)
    try {
      const response = await loginRequest(payload)
      if (!response.token) {
        throw new Error("Token missing in login response")
      }
      setToken(response.token)
      setAuthToken(response.token)
      if (response.user) {
        setUser(response.user)
        await hydratePermissions(response.user.tenantId || response.user.tenants?.[0])
      } else {
        const profile = await getProfile()
        setUser(profile)
        await hydratePermissions(profile.tenantId || profile.tenants?.[0])
      }
    } finally {
      setIsLoadingProfile(false)
    }
  }, [hydratePermissions])

  const logout = useCallback(() => {
    logoutRequest()
    setToken(null)
    setAuthToken(null)
    setUser(null)
    setEnabledModules([])
    setPermissions([])
    setActiveTenantId(null)
  }, [])

  const switchTenant = useCallback(async (tenantId: string) => {
    await hydratePermissions(tenantId)
  }, [hydratePermissions])

  const hasModule = useCallback(
    (moduleKey: string) => {
      if (!moduleKey) return true
      return enabledModules.includes(moduleKey)
    },
    [enabledModules],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isLoading: isLoadingProfile || isLoadingPermissions,
      enabledModules,
      permissions,
      activeTenantId,
      login,
      logout,
      switchTenant,
      hasModule,
    }),
    [
      user,
      token,
      isLoadingProfile,
      isLoadingPermissions,
      enabledModules,
      permissions,
      activeTenantId,
      login,
      logout,
      switchTenant,
      hasModule,
    ],
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
