import React, { useState, useEffect } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getStoredTenantId } from '../../services/config'
import './select.scss'

interface Resource {
  id: string
  name: string
  description?: string
  capacity: number
  image?: string
  price?: number
}

interface TimeSlot {
  time: string
  available: boolean
  price?: number
}

interface BookingData {
  resourceId: string
  date: string
  timeSlot: string
  customerName: string
  customerPhone: string
  remark?: string
  totalAmount: number
}

export default function BookingSelectPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('')
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [tenantId, setTenantId] = useState('')

  useEffect(() => {
    const tenantId = getStoredTenantId()
    setTenantId(tenantId)
    loadResources()
    
    // 设置默认日期为今天
    const today = new Date().toISOString().split('T')[0]
    setSelectedDate(today)
  }, [])

  useEffect(() => {
    if (selectedResource && selectedDate) {
      loadTimeSlots(selectedResource.id, selectedDate)
    }
  }, [selectedResource, selectedDate])

  const loadResources = async () => {
    try {
      const response = await Taro.request({
        url: `/api/booking/resources?tenantId=${tenantId}`,
        method: 'GET'
      })

      if (response.statusCode === 200 && response.data) {
        setResources(response.data)
      }
    } catch (error) {
      console.error('加载资源失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
  }

  const loadTimeSlots = async (resourceId: string, date: string) => {
    try {
      setLoading(true)
      const response = await Taro.request({
        url: `/api/booking/slots?resourceId=${resourceId}&date=${date}`,
        method: 'GET'
      })

      if (response.statusCode === 200 && response.data) {
        setTimeSlots(response.data)
      }
    } catch (error) {
      console.error('加载时段失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleResourceSelect = (resource: Resource) => {
    setSelectedResource(resource)
    setSelectedTimeSlot('')
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setSelectedTimeSlot('')
  }

  const handleTimeSlotSelect = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot)
  }

  const handleInputChange = (field: keyof BookingData, value: string) => {
    if (bookingData) {
      setBookingData({
        ...bookingData,
        [field]: value
      })
    }
  }

  const handleSubmitBooking = async () => {
    if (!selectedResource || !selectedDate || !selectedTimeSlot) {
      Taro.showToast({ title: '请选择完整的预约信息', icon: 'none' })
      return
    }

    if (!bookingData?.customerName) {
      Taro.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }

    if (!bookingData?.customerPhone) {
      Taro.showToast({ title: '请输入手机号', icon: 'none' })
      return
    }

    try {
      setLoading(true)

      const bookingPayload = {
        tenantId,
        resourceId: selectedResource.id,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        customerName: bookingData.customerName,
        customerPhone: bookingData.customerPhone,
        remark: bookingData.remark,
        totalAmount: selectedResource.price || 0
      }

      // 创建预约
      const bookingResponse = await Taro.request({
        url: '/api/booking',
        method: 'POST',
        data: bookingPayload
      })

      if (bookingResponse.statusCode !== 201) {
        throw new Error('创建预约失败')
      }

      const booking = bookingResponse.data

      // 创建支付订单
      const paymentResponse = await Taro.request({
        url: '/api/pay/create',
        method: 'POST',
        data: {
          orderId: booking.id,
          amount: bookingPayload.totalAmount
        }
      })

      if (paymentResponse.statusCode !== 200) {
        throw new Error('创建支付订单失败')
      }

      const paymentData = paymentResponse.data

      // 跳转到预约确认页
      Taro.redirectTo({
        url: `/pages/booking-confirm/index?bookingId=${booking.id}&paymentId=${paymentData.paymentId}`
      })

    } catch (error) {
      console.error('提交预约失败:', error)
      Taro.showToast({ title: '提交失败，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 生成可选日期（未来7天）
  const generateDateOptions = () => {
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    return dates
  }

  const dateOptions = generateDateOptions()

  return (
    <View className="booking-select-page">
      <View className="booking-header">
        <Text className="booking-title">预约选择</Text>
      </View>

      {/* 资源选择 */}
      <View className="booking-section">
        <Text className="section-title">选择资源</Text>
        <View className="resource-list">
          {resources.map((resource) => (
            <View 
              key={resource.id}
              className={`resource-item ${selectedResource?.id === resource.id ? 'selected' : ''}`}
              onClick={() => handleResourceSelect(resource)}
            >
              <View className="resource-info">
                <Text className="resource-name">{resource.name}</Text>
                <Text className="resource-desc">{resource.description}</Text>
                <Text className="resource-capacity">容量: {resource.capacity}人</Text>
                {resource.price && (
                  <Text className="resource-price">¥{resource.price}/小时</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 日期选择 */}
      <View className="booking-section">
        <Text className="section-title">选择日期</Text>
        <View className="date-list">
          {dateOptions.map((date) => (
            <View 
              key={date}
              className={`date-item ${selectedDate === date ? 'selected' : ''}`}
              onClick={() => handleDateSelect(date)}
            >
              <Text className="date-text">
                {new Date(date).toLocaleDateString('zh-CN', { 
                  month: 'short', 
                  day: 'numeric',
                  weekday: 'short'
                })}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 时段选择 */}
      {selectedResource && selectedDate && (
        <View className="booking-section">
          <Text className="section-title">选择时段</Text>
          {loading ? (
            <View className="loading-container">
              <Text>加载中...</Text>
            </View>
          ) : (
            <View className="time-slot-list">
              {timeSlots.map((slot) => (
                <View 
                  key={slot.time}
                  className={`time-slot-item ${!slot.available ? 'disabled' : ''} ${selectedTimeSlot === slot.time ? 'selected' : ''}`}
                  onClick={() => slot.available && handleTimeSlotSelect(slot.time)}
                >
                  <Text className="time-text">{slot.time}</Text>
                  {slot.price && (
                    <Text className="time-price">¥{slot.price}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* 联系信息 */}
      <View className="booking-section">
        <Text className="section-title">联系信息</Text>
        <View className="input-group">
          <Text className="input-label">姓名 *</Text>
          <input
            className="input-field"
            placeholder="请输入姓名"
            value={bookingData?.customerName || ''}
            onInput={(e) => handleInputChange('customerName', e.detail.value)}
          />
        </View>
        <View className="input-group">
          <Text className="input-label">手机号 *</Text>
          <input
            className="input-field"
            placeholder="请输入手机号"
            type="number"
            value={bookingData?.customerPhone || ''}
            onInput={(e) => handleInputChange('customerPhone', e.detail.value)}
          />
        </View>
        <View className="input-group">
          <Text className="input-label">备注</Text>
          <textarea
            className="input-field textarea"
            placeholder="请输入备注信息"
            value={bookingData?.remark || ''}
            onInput={(e) => handleInputChange('remark', e.detail.value)}
          />
        </View>
      </View>

      {/* 预约总计 */}
      {selectedResource && selectedTimeSlot && (
        <View className="booking-total">
          <View className="total-row">
            <Text>资源费用</Text>
            <Text>¥{selectedResource.price || 0}</Text>
          </View>
          <View className="total-row total-final">
            <Text>应付金额</Text>
            <Text className="total-amount">¥{selectedResource.price || 0}</Text>
          </View>
        </View>
      )}

      {/* 提交按钮 */}
      <View className="booking-footer">
        <Button 
          className="submit-button"
          loading={loading}
          onClick={handleSubmitBooking}
          disabled={!selectedResource || !selectedDate || !selectedTimeSlot}
        >
          确认预约
        </Button>
      </View>
    </View>
  )
}
