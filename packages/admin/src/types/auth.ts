export interface AuthUser {
  id: string
  name: string
  email: string
  roles: string[]
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user?: AuthUser
}
