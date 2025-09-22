export interface CreateBookingDto {
  resourceId: string
  tenantId: string
  userId: string
  start: string
  end: string
  metadata?: Record<string, unknown>
}
