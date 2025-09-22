export interface TenantConfig {
  tenantId: string
  industry: string
  enabledModules: string[]
  theme?: {
    primaryColor?: string
    logo?: string
    buttonRadius?: number
  }
  moduleConfigs?: Record<string, unknown>
}
