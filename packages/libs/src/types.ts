// Shared types
export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

export interface TenantConfig {
  tenantId: string
  industry: string
  enabledModules: string[]
  theme: Record<string, any>
  version?: number
  updatedAt?: string
  status?: string
}
