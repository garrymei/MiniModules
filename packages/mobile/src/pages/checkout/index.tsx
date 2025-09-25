import React, { useState, useEffect } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getStoredTenantId } from '../../services/config'
import './index.scss'

interface CartItem {
  id: string
  productId: string
  skuId: string
  name: string
  price: number
  quantity: number
  image?: string
  specs?: Record<string, string>
}

interface CheckoutData {
  items: CartItem[]
  totalAmount: number
  orderType: 'dine_in' | 'takeaway'
  tableNumber?: string
  customerName?: string
  customerPhone?: string
  remark?: string
}

export default function CheckoutPage() {
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null)
  const [loading, setLoading] = useState(false)
  const [tenantId, setTenantId] = useState('')

  useEffect(() => {
    const tenantId = getStoredTenantId()
    setTenantId(tenantId)
    loadCartData()
  }, [])

  const loadCartData = () => {
    // 从本地存储或状态管理获取购物车数据
    const cartItems: CartItem[] = [
      {
        id: '1',
        productId: 'prod-1',
        skuId: 'sku-1',
        name: '招牌汉堡',
        price: 29.9,
        quantity: 2,
        image: 'https://example.com/burger.jpg',
        specs: { size: '大', spicy: '微辣' }
      },
      {
        id: '2',
        productId: 'prod-2',
        skuId: 'sku-2',
        name: '可乐',
        price: 8.0,
        quantity: 1,
        image: 'https://example.com/coke.jpg'
      }
    ]

    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    setCheckoutData({
      items: cartItems,
      totalAmount,
      orderType: 'dine_in'
    })
  }

  const handleOrderTypeChange = (type: 'dine_in' | 'takeaway') => {
    if (checkoutData) {
      setCheckoutData({
        ...checkoutData,
        orderType: type,
        tableNumber: type === 'dine_in' ? checkoutData.tableNumber : undefined
      })
    }
  }

  const handleInputChange = (field: keyof CheckoutData, value: string) => {
    if (checkoutData) {
      setCheckoutData({
        ...checkoutData,
        [field]: value
      })
    }
  }

  const handleSubmitOrder = async () => {
    if (!checkoutData) return

    // 验证必填字段
    if (checkoutData.orderType === 'dine_in' && !checkoutData.tableNumber) {
      Taro.showToast({ title: '请输入桌号', icon: 'none' })
      return
    }

    if (!checkoutData.customerName) {
      Taro.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }

    if (!checkoutData.customerPhone) {
      Taro.showToast({ title: '请输入手机号', icon: 'none' })
      return
    }

    try {
      setLoading(true)

      // 1. 创建订单
      const orderResponse = await Taro.request({
        url: '/api/orders',
        method: 'POST',
        data: {
          tenantId,
          items: checkoutData.items.map(item => ({
            productId: item.productId,
            skuId: item.skuId,
            quantity: item.quantity,
            price: item.price
          })),
          orderType: checkoutData.orderType,
          tableNumber: checkoutData.tableNumber,
          customerName: checkoutData.customerName,
          customerPhone: checkoutData.customerPhone,
          remark: checkoutData.remark,
          totalAmount: checkoutData.totalAmount
        }
      })

      if (orderResponse.statusCode !== 201) {
        throw new Error('创建订单失败')
      }

      const order = orderResponse.data

      // 2. 创建支付订单
      const paymentResponse = await Taro.request({
        url: '/api/pay/create',
        method: 'POST',
        data: {
          orderId: order.id,
          amount: checkoutData.totalAmount
        }
      })

      if (paymentResponse.statusCode !== 200) {
        throw new Error('创建支付订单失败')
      }

      const paymentData = paymentResponse.data

      // 3. 跳转到订单确认页
      Taro.redirectTo({
        url: `/pages/order-confirm/index?orderId=${order.id}&paymentId=${paymentData.paymentId}`
      })

    } catch (error) {
      console.error('提交订单失败:', error)
      Taro.showToast({ title: '提交失败，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  if (!checkoutData) {
    return (
      <View className="checkout-page">
        <View className="checkout-loading">
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="checkout-page">
      <View className="checkout-header">
        <Text className="checkout-title">确认订单</Text>
      </View>

      {/* 商品列表 */}
      <View className="checkout-section">
        <Text className="section-title">商品清单</Text>
        {checkoutData.items.map((item) => (
          <View key={item.id} className="checkout-item">
            <View className="item-info">
              <Text className="item-name">{item.name}</Text>
              {item.specs && (
                <Text className="item-specs">
                  {Object.entries(item.specs).map(([key, value]) => `${key}: ${value}`).join(', ')}
                </Text>
              )}
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

      {/* 订单类型 */}
      <View className="checkout-section">
        <Text className="section-title">订单类型</Text>
        <View className="order-type-selector">
          <View 
            className={`type-option ${checkoutData.orderType === 'dine_in' ? 'active' : ''}`}
            onClick={() => handleOrderTypeChange('dine_in')}
          >
            <Text>堂食</Text>
          </View>
          <View 
            className={`type-option ${checkoutData.orderType === 'takeaway' ? 'active' : ''}`}
            onClick={() => handleOrderTypeChange('takeaway')}
          >
            <Text>外卖</Text>
          </View>
        </View>

        {checkoutData.orderType === 'dine_in' && (
          <View className="input-group">
            <Text className="input-label">桌号</Text>
            <input
              className="input-field"
              placeholder="请输入桌号"
              value={checkoutData.tableNumber || ''}
              onInput={(e) => handleInputChange('tableNumber', e.detail.value)}
            />
          </View>
        )}
      </View>

      {/* 客户信息 */}
      <View className="checkout-section">
        <Text className="section-title">联系信息</Text>
        <View className="input-group">
          <Text className="input-label">姓名 *</Text>
          <input
            className="input-field"
            placeholder="请输入姓名"
            value={checkoutData.customerName || ''}
            onInput={(e) => handleInputChange('customerName', e.detail.value)}
          />
        </View>
        <View className="input-group">
          <Text className="input-label">手机号 *</Text>
          <input
            className="input-field"
            placeholder="请输入手机号"
            type="number"
            value={checkoutData.customerPhone || ''}
            onInput={(e) => handleInputChange('customerPhone', e.detail.value)}
          />
        </View>
        <View className="input-group">
          <Text className="input-label">备注</Text>
          <textarea
            className="input-field textarea"
            placeholder="请输入备注信息"
            value={checkoutData.remark || ''}
            onInput={(e) => handleInputChange('remark', e.detail.value)}
          />
        </View>
      </View>

      {/* 订单总计 */}
      <View className="checkout-total">
        <View className="total-row">
          <Text>商品总价</Text>
          <Text>¥{checkoutData.totalAmount.toFixed(2)}</Text>
        </View>
        <View className="total-row total-final">
          <Text>应付金额</Text>
          <Text className="total-amount">¥{checkoutData.totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      {/* 提交按钮 */}
      <View className="checkout-footer">
        <Button 
          className="submit-button"
          loading={loading}
          onClick={handleSubmitOrder}
        >
          提交订单
        </Button>
      </View>
    </View>
  )
}
