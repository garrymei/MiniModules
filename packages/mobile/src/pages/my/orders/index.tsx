import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useI18n } from '../../../hooks/useI18n'
import useUserStore from '../../../store/user'
import { getStoredTenantId } from '../../../services/config'
import { fetchUserOrders, type OrderSummary } from '../../../services/orders'
import './index.scss'

const MyOrdersPage: React.FC = () => {
  const { t } = useI18n()
  const profile = useUserStore((state) => state.profile)
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [tenantId, setTenantId] = useState('')

  useEffect(() => {
    const storedTenantId = getStoredTenantId()
    setTenantId(storedTenantId)
    loadOrders()
  }, [])

  const loadOrders = async () => {
    if (!profile?.userId || !tenantId) return

    try {
      setLoading(true)
      const orderList = await fetchUserOrders(tenantId, profile.userId)
      setOrders(orderList)
    } catch (error) {
      console.error('加载订单失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadOrders()
  }

  const handleOrderDetail = (orderId: string) => {
    Taro.navigateTo({
      url: `/pages/order-confirm/index?orderId=${orderId}&fromHistory=true`
    })
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待确认',
      confirmed: '已确认',
      preparing: '制作中',
      ready: '待取餐',
      completed: '已完成',
      cancelled: '已取消',
      refunded: '已退款'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: '#ff9500',
      confirmed: '#007aff',
      preparing: '#ff3b30',
      ready: '#34c759',
      completed: '#8e8e93',
      cancelled: '#8e8e93',
      refunded: '#8e8e93'
    }
    return colorMap[status] || '#8e8e93'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <View className="orders-page">
        <View className="loading-container">
          <Text className="loading-text">{t('common.loading')}</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="orders-page">
      <View className="page-header">
        <Text className="page-title">{t('profile.orderHistory')}</Text>
        <Button className="refresh-button" size="mini" onClick={handleRefresh}>
          {t('common.refresh')}
        </Button>
      </View>

      {orders.length === 0 ? (
        <View className="empty-container">
          <Text className="empty-icon">📋</Text>
          <Text className="empty-text">暂无订单记录</Text>
          <Button 
            className="go-shopping-button" 
            type="primary" 
            size="small"
            onClick={() => Taro.switchTab({ url: '/pages/index/index' })}
          >
            去下单
          </Button>
        </View>
      ) : (
        <ScrollView className="orders-list" scrollY>
          {orders.map((order) => (
            <View 
              key={order.id} 
              className="order-item"
              onClick={() => handleOrderDetail(order.id)}
            >
              <View className="order-header">
                <Text className="order-number">订单号: {order.orderNumber}</Text>
                <View 
                  className="order-status"
                  style={{ color: getStatusColor(order.status) }}
                >
                  {getStatusText(order.status)}
                </View>
              </View>

              <View className="order-info">
                <View className="info-row">
                  <Text className="info-label">下单时间:</Text>
                  <Text className="info-value">{formatDate(order.createdAt)}</Text>
                </View>
                <View className="info-row">
                  <Text className="info-label">订单类型:</Text>
                  <Text className="info-value">
                    {order.orderType === 'dine_in' ? '堂食' : '外卖'}
                  </Text>
                </View>
                {order.tableNumber && (
                  <View className="info-row">
                    <Text className="info-label">桌号:</Text>
                    <Text className="info-value">{order.tableNumber}</Text>
                  </View>
                )}
                <View className="info-row">
                  <Text className="info-label">商品数量:</Text>
                  <Text className="info-value">{order.itemCount}件</Text>
                </View>
              </View>

              <View className="order-footer">
                <Text className="total-amount">¥{order.totalAmount.toFixed(2)}</Text>
                <View className="order-arrow">
                  <Text className="arrow">›</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

export default MyOrdersPage
