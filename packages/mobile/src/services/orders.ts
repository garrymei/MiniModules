import { request } from "./request"
import { getStoredTenantId } from "./config"

export interface OrderItemInput {
  productId: string
  skuId?: string
  quantity: number
  price: number
}

export interface CreateOrderPayload {
  tenantId?: string
  userId?: string
  orderType?: "dine_in" | "takeout"
  items: OrderItemInput[]
  totalAmount: number
  metadata?: Record<string, any>
}

export interface OrderSummary {
  id: string
  orderNumber: string
  totalAmount: number
  status: string
  orderType: string
  createdAt: string
  itemCount: number
  tableNumber?: string
  metadata?: Record<string, any>
}

export const createOrder = async (payload: CreateOrderPayload) => {
  const tenantId = payload.tenantId || getStoredTenantId()
  const body = {
    tenantId,
    orderType: payload.orderType ?? "dine_in",
    totalAmount: payload.totalAmount,
    items: payload.items,
    metadata: payload.metadata,
    userId: payload.userId,
  }

  return request<OrderSummary>({
    path: "ordering/orders",
    method: "POST",
    data: body,
  })
}

export const fetchUserOrders = async (tenantId: string, userId: string) => {
  return request<OrderSummary[]>({
    path: `ordering/orders/user/${userId}?tenantId=${encodeURIComponent(tenantId)}`,
    method: "GET",
  })
}

export const fetchTenantOrders = async (tenantId: string, limit = 20) => {
  return request<OrderSummary[]>({
    path: `ordering/orders?tenantId=${encodeURIComponent(tenantId)}&limit=${limit}`,
    method: "GET",
  })
}

export const fetchOrderDetail = async (orderId: string) => {
  return request<OrderSummary>({
    path: `ordering/orders/${orderId}`,
    method: "GET",
  })
}
