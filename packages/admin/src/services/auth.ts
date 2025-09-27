import type { LoginPayload, LoginResponse, AuthUser, PermissionProfile } from "../types/auth"
import { apiClient, setAuthToken } from "./apiClient"

const mockUser: AuthUser = {
  id: "dev-user",
  name: "Developer",
  email: "dev@example.com",
  roles: ["admin"],
  tenants: ["tenant_001"],
  tenantId: "tenant_001",
}

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<LoginResponse>("/auth/login", payload)
    if (response.data.token) {
      setAuthToken(response.data.token)
    }
    return response.data
  } catch (error) {
    if (import.meta.env.DEV) {
      const mockResponse: LoginResponse = { token: "dev-token", user: mockUser }
      setAuthToken(mockResponse.token)
      console.warn("Login API not reachable, using mock credentials in dev mode", error)
      return mockResponse
    }
    throw error
  }
}

export const logout = (): void => {
  setAuthToken(null)
}

export const getProfile = async (): Promise<AuthUser> => {
  try {
    const response = await apiClient.get<AuthUser>("/auth/me")
    return response.data
  } catch (error) {
    if (import.meta.env.DEV) {
      return mockUser
    }
    throw error
  }
}

export const getPermissions = async (tenantId?: string): Promise<PermissionProfile> => {
  try {
    const response = await apiClient.get<PermissionProfile>("/auth/me/permissions", {
      params: tenantId ? { tenantId } : undefined,
    })
    return response.data
  } catch (error) {
    if (import.meta.env.DEV) {
      return {
        tenantId: tenantId || mockUser.tenantId || mockUser.tenants?.[0] || "tenant_001",
        enabledModules: ["ordering", "booking", "cms", "notify", "search", "usage"],
        permissions: ["*"],
      }
    }
    throw error
  }
}
