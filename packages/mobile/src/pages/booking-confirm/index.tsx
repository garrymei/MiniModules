import React, { useState, useEffect } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface BookingInfo {
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

export default function BookingConfirmPage() {
  const [bookingInfo, setBookingInfo] = useState<BookingInfo | null>(null)
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const { bookingId, paymentId } = Taro.getCurrentInstance().router?.params || {}
    if (bookingId && paymentId) {
      loadBookingInfo(bookingId, paymentId)
    }
  }, [])

  const loadBookingInfo = async (bookingId: string, paymentId: string) => {
    try {
      setLoading(true)

      // 加载预约信息
      const bookingResponse = await Taro.request({
        url: `/api/booking/${bookingId}`,
        method: 'GET'
      })

      if (bookingResponse.statusCode === 200) {
        setBookingInfo(bookingResponse.data)
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
      console.error('加载预约信息失败:', error)
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
          // 跳转到预约详情页
          setTimeout(() => {
            Taro.redirectTo({
              url: `/pages/booking-detail/index?bookingId=${bookingInfo?.id}`
            })
          }, 1500)
        }
      } else {
        // Mock支付成功
        Taro.showToast({ title: '支付成功', icon: 'success' })
        setTimeout(() => {
          Taro.redirectTo({
            url: `/pages/booking-detail/index?bookingId=${bookingInfo?.id}`
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

  const handleCancelBooking = async () => {
    if (!bookingInfo) return

    try {
      const result = await Taro.showModal({
        title: '确认取消',
        content: '确定要取消这个预约吗？'
      })

      if (result.confirm) {
        setLoading(true)

        await Taro.request({
          url: `/api/booking/${bookingInfo.id}/cancel`,
          method: 'PUT'
        })

        Taro.showToast({ title: '预约已取消', icon: 'success' })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      }
    } catch (error) {
      console.error('取消预约失败:', error)
      Taro.showToast({ title: '取消失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  if (loading && !bookingInfo) {
    return (
      <View className="booking-confirm-page">
        <View className="loading-container">
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  if (!bookingInfo) {
    return (
      <View className="booking-confirm-page">
        <View className="error-container">
          <Text>预约信息加载失败</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="booking-confirm-page">
      <View className="booking-header">
        <Text className="booking-title">预约确认</Text>
        <Text className="booking-number">预约号: {bookingInfo.bookingNumber}</Text>
      </View>

      {/* 预约状态 */}
      <View className="booking-status">
        <View className="status-icon">
          <Text>📅</Text>
        </View>
        <View className="status-info">
          <Text className="status-text">预约已创建</Text>
          <Text className="status-desc">请完成支付</Text>
        </View>
      </View>

      {/* 预约信息 */}
      <View className="booking-section">
        <Text className="section-title">预约信息</Text>
        <View className="info-row">
          <Text className="info-label">资源名称</Text>
          <Text className="info-value">{bookingInfo.resourceName}</Text>
        </View>
        <View className="info-row">
          <Text className="info-label">预约日期</Text>
          <Text className="info-value">{new Date(bookingInfo.date).toLocaleDateString('zh-CN')}</Text>
        </View>
        <View className="info-row">
          <Text className="info-label">预约时段</Text>
          <Text className="info-value">{bookingInfo.timeSlot}</Text>
        </View>
        <View className="info-row">
          <Text className="info-label">联系人</Text>
          <Text className="info-value">{bookingInfo.customerName}</Text>
        </View>
        <View className="info-row">
          <Text className="info-label">手机号</Text>
          <Text className="info-value">{bookingInfo.customerPhone}</Text>
        </View>
        <View className="info-row">
          <Text className="info-label">预约时间</Text>
          <Text className="info-value">{new Date(bookingInfo.createdAt).toLocaleString()}</Text>
        </View>
      </View>

      {/* 支付信息 */}
      <View className="booking-section">
        <Text className="section-title">支付信息</Text>
        <View className="payment-summary">
          <View className="total-row">
            <Text>预约费用</Text>
            <Text>¥{bookingInfo.totalAmount.toFixed(2)}</Text>
          </View>
          <View className="total-row total-final">
            <Text>应付金额</Text>
            <Text className="total-amount">¥{bookingInfo.totalAmount.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* 操作按钮 */}
      <View className="booking-actions">
        <Button 
          className="action-button cancel-button"
          onClick={handleCancelBooking}
          loading={loading}
        >
          取消预约
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
