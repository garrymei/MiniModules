export interface AuthUser {
  id: string
  name: string
  email: string
  roles: string[]
  tenants?: string[]
  tenantId?: string | null
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user?: AuthUser
}

export interface PermissionProfile {
  tenantId: string
  enabledModules: string[]
  permissions: string[]
}
