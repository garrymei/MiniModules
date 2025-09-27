import { request } from "./request"

interface CreatePaymentPayload {
  orderId?: string
  bookingId?: string
  amount: number
  paymentMethod?: "wechat" | "alipay"
  description?: string
}

export interface PaymentSession {
  prepayId: string
  nonceStr: string
  timeStamp: string
  paySign: string
  orderId: string
  amount: number
}

export const createPayment = async (payload: CreatePaymentPayload) => {
  return request<PaymentSession>({
    path: "pay/create",
    method: "POST",
    data: {
      paymentMethod: payload.paymentMethod ?? "wechat",
      description: payload.description,
      ...payload,
    },
  })
}

export const fetchPaymentStatus = async (orderId: string) => {
  return request<{ status: string; amount?: number }>({
    path: `pay/status/${orderId}`,
    method: "GET",
  })
}
