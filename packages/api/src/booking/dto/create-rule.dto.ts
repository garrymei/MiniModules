export interface CreateTimeSlotRuleDto {
  resourceId: string
  slotMinutes: number
  openHours: Record<string, [string, string][]>
  maxBookDays: number
}
