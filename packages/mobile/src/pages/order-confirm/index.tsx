import React, { useState, useEffect } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface OrderInfo {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  orderType: string
  tableNumber?: string
  customerName: string
  customerPhone: string
  createdAt: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
}

interface PaymentInfo {
  paymentId: string
  status: string
  amount: number
  prepayId?: string
  nonceStr?: string
  timeStamp?: string
  paySign?: string
}

export default function OrderConfirmPage() {
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null)
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const { orderId, paymentId } = Taro.getCurrentInstance().router?.params || {}
    if (orderId && paymentId) {
      loadOrderInfo(orderId, paymentId)
    }
  }, [])

  const loadOrderInfo = async (orderId: string, paymentId: string) => {
    try {
      setLoading(true)

      // 加载订单信息
      const orderResponse = await Taro.request({
        url: `/api/orders/${orderId}`,
        method: 'GET'
      })

      if (orderResponse.statusCode === 200) {
        setOrderInfo(orderResponse.data)
      }

      // 加载支付信息
      const paymentResponse = await Taro.request({
        url: `/api/pay/${paymentId}`,
        method: 'GET'
      })

      if (paymentResponse.statusCode === 200) {
        setPaymentInfo(paymentResponse.data)
      }

    } catch (error) {
      console.error('加载订单信息失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handlePay = async () => {
    if (!paymentInfo) return

    try {
      setLoading(true)

      // 调用微信支付
      if (paymentInfo.prepayId && paymentInfo.nonceStr && paymentInfo.timeStamp && paymentInfo.paySign) {
        const payResult = await Taro.requestPayment({
          timeStamp: paymentInfo.timeStamp,
          nonceStr: paymentInfo.nonceStr,
          package: `prepay_id=${paymentInfo.prepayId}`,
          signType: 'MD5',
          paySign: paymentInfo.paySign
        })

        if (payResult.errMsg === 'requestPayment:ok') {
          Taro.showToast({ title: '支付成功', icon: 'success' })
          // 跳转到订单详情页
          setTimeout(() => {
            Taro.redirectTo({
              url: `/pages/order-detail/index?orderId=${orderInfo?.id}`
            })
          }, 1500)
        }
      } else {
        // Mock支付成功
        Taro.showToast({ title: '支付成功', icon: 'success' })
        setTimeout(() => {
          Taro.redirectTo({
            url: `/pages/order-detail/index?orderId=${orderInfo?.id}`
          })
        }, 1500)
      }

    } catch (error) {
      console.error('支付失败:', error)
      Taro.showToast({ title: '支付失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!orderInfo) return

    try {
      const result = await Taro.showModal({
        title: '确认取消',
        content: '确定要取消这个订单吗？'
      })

      if (result.confirm) {
        setLoading(true)

        await Taro.request({
          url: `/api/orders/${orderInfo.id}/cancel`,
          method: 'PUT'
        })

        Taro.showToast({ title: '订单已取消', icon: 'success' })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      }
    } catch (error) {
      console.error('取消订单失败:', error)
      Taro.showToast({ title: '取消失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  if (loading && !orderInfo) {
    return (
      <View className="order-confirm-page">
        <View className="loading-container">
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  if (!orderInfo) {
    return (
      <View className="order-confirm-page">
        <View className="error-container">
          <Text>订单信息加载失败</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="order-confirm-page">
      <View className="order-header">
        <Text className="order-title">订单确认</Text>
        <Text className="order-number">订单号: {orderInfo.orderNumber}</Text>
      </View>

      {/* 订单状态 */}
      <View className="order-status">
        <View className="status-icon">
          <Text>📋</Text>
        </View>
        <View className="status-info">
          <Text className="status-text">订单已创建</Text>
          <Text className="status-desc">请完成支付</Text>
        </View>
      </View>

      {/* 订单信息 */}
      <View className="order-section">
        <Text className="section-title">订单信息</Text>
        <View className="info-row">
          <Text className="info-label">订单类型</Text>
          <Text className="info-value">{orderInfo.orderType === 'dine_in' ? '堂食' : '外卖'}</Text>
        </View>
        {orderInfo.tableNumber && (
          <View className="info-row">
            <Text className="info-label">桌号</Text>
            <Text className="info-value">{orderInfo.tableNumber}</Text>
          </View>
        )}
        <View className="info-row">
          <Text className="info-label">联系人</Text>
          <Text className="info-value">{orderInfo.customerName}</Text>
        </View>
        <View className="info-row">
          <Text className="info-label">手机号</Text>
          <Text className="info-value">{orderInfo.customerPhone}</Text>
        </View>
        <View className="info-row">
          <Text className="info-label">下单时间</Text>
          <Text className="info-value">{new Date(orderInfo.createdAt).toLocaleString()}</Text>
        </View>
      </View>

      {/* 商品清单 */}
      <View className="order-section">
        <Text className="section-title">商品清单</Text>
        {orderInfo.items.map((item, index) => (
          <View key={index} className="order-item">
            <View className="item-info">
              <Text className="item-name">{item.name}</Text>
            </View>
            <View className="item-quantity">
              <Text>×{item.quantity}</Text>
            </View>
            <View className="item-price">
              <Text>¥{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* 支付信息 */}
      <View className="order-section">
        <Text className="section-title">支付信息</Text>
        <View className="payment-summary">
          <View className="total-row">
            <Text>商品总价</Text>
            <Text>¥{orderInfo.totalAmount.toFixed(2)}</Text>
          </View>
          <View className="total-row total-final">
            <Text>应付金额</Text>
            <Text className="total-amount">¥{orderInfo.totalAmount.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* 操作按钮 */}
      <View className="order-actions">
        <Button 
          className="action-button cancel-button"
          onClick={handleCancelOrder}
          loading={loading}
        >
          取消订单
        </Button>
        <Button 
          className="action-button pay-button"
          onClick={handlePay}
          loading={loading}
        >
          立即支付
        </Button>
      </View>
    </View>
  )
}
