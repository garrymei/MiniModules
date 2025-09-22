export interface CreateResourceDto {
  tenantId: string
  name: string
  type: string
  meta?: Record<string, unknown> | null
}
