import { request } from "./request"
import { getStoredTenantId } from "./config"

export interface ResourceItem {
  id: string
  tenantId: string
  name: string
  description?: string
  capacity: number
  price?: number
  images?: string[]
}

export interface TimeSlotItem {
  time: string
  available: boolean
  price?: number
}

export interface CreateBookingPayload {
  tenantId?: string
  userId?: string
  resourceId: string
  bookingDate: string
  startTime: string
  endTime: string
  peopleCount?: number
  metadata?: Record<string, any>
}

const mockResources: ResourceItem[] = [
  {
    id: "resource-room-a",
    tenantId: "tenant_001",
    name: "多功能会议室 A",
    description: "适合 8-10 人的小型会议，含投影及白板。",
    capacity: 10,
    price: 188,
    images: ["https://cdn.minimodules.dev/demo/meeting-room.jpg"],
  },
  {
    id: "resource-court-b",
    tenantId: "tenant_001",
    name: "羽毛球场 B",
    description: "专业木地板、夜间照明。",
    capacity: 4,
    price: 96,
    images: ["https://cdn.minimodules.dev/demo/badminton.jpg"],
  },
]

const mockTimeSlots = (date: string): TimeSlotItem[] => {
  const hours = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00", "19:00"]
  return hours.map((time, index) => ({
    time,
    available: index % 3 !== 2,
    price: 96 + index * 12,
  }))
}

export const fetchResources = async (tenantId?: string): Promise<ResourceItem[]> => {
  const resolvedTenant = tenantId || getStoredTenantId()
  try {
    const result = await request<ResourceItem[]>({
      path: `booking/resources?tenantId=${encodeURIComponent(resolvedTenant)}`,
      method: "GET",
    })
    if (Array.isArray(result) && result.length > 0) {
      return result
    }
  } catch (error) {
    console.warn("Falling back to mock resources", error)
  }

  return mockResources.filter((resource) => resource.tenantId === resolvedTenant)
}

export const fetchResourceSlots = async (resourceId: string, date: string, tenantId?: string): Promise<TimeSlotItem[]> => {
  const resolvedTenant = tenantId || getStoredTenantId()
  try {
    const result = await request<TimeSlotItem[]>({
      path: `booking/resources/${resourceId}/slots?tenantId=${encodeURIComponent(resolvedTenant)}&date=${encodeURIComponent(date)}`,
      method: "GET",
    })
    if (Array.isArray(result) && result.length > 0) {
      return result
    }
  } catch (error) {
    console.warn("Falling back to mock slots", error)
  }

  return mockTimeSlots(date)
}

export const createBooking = async (payload: CreateBookingPayload) => {
  const tenantId = payload.tenantId || getStoredTenantId()
  const body = {
    tenantId,
    resourceId: payload.resourceId,
    bookingDate: payload.bookingDate,
    startTime: payload.startTime,
    endTime: payload.endTime,
    peopleCount: payload.peopleCount ?? 1,
    metadata: payload.metadata,
    userId: payload.userId,
  }

  return request<{ id: string; status: string }>({
    path: "booking/bookings",
    method: "POST",
    data: body,
  })
}

export interface BookingSummary {
  id: string
  bookingNumber: string
  status: string
  resourceName: string
  date: string
  timeSlot: string
  customerName: string
  customerPhone: string
  totalAmount: number
  createdAt: string
  verificationCode?: string
}

export const fetchUserBookings = async (tenantId: string, userId: string) => {
  return request<BookingSummary[]>({
    path: `booking/bookings/user/${userId}?tenantId=${encodeURIComponent(tenantId)}`,
    method: "GET",
  })
}

export const fetchBookingDetail = async (bookingId: string) => {
  return request<any>({
    path: `booking/bookings/${bookingId}`,
    method: "GET",
  })
}
