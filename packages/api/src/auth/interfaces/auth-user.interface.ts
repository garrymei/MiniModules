import { Role } from '../roles.enum'

export interface AuthUser {
  id: string
  username: string
  role: Role
}
