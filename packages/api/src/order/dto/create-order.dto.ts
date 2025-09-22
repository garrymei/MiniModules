export interface OrderItemInput {
  skuId: string
  quantity: number
}

export interface CreateOrderDto {
  tenantId: string
  userId: string
  items: OrderItemInput[]
  metadata?: Record<string, unknown>
}
