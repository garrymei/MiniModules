import { useEffect, useMemo, useState } from "react"
import { View, Text, Button, Input, Textarea } from "@tarojs/components"
import Taro from "@tarojs/taro"

import { listCartItems, updateCartItemQuantity, removeCartItem, clearCart, type CartItem } from "../../services/cart"
import { getStoredTenantId } from "../../services/config"
import useUserStore from "../../store/user"
import { createOrder } from "../../services/orders"
import { createPayment } from "../../services/payment"

import "./index.scss"

const CheckoutPage: React.FC = () => {
  const [items, setItems] = useState<CartItem[]>([])
  const [orderType, setOrderType] = useState<"dine_in" | "takeout">("dine_in")
  const [tableNumber, setTableNumber] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [remark, setRemark] = useState("")
  const [loading, setLoading] = useState(false)

  const profile = useUserStore((state) => state.profile)

  useEffect(() => {
    const cartItems = listCartItems()
    setItems(cartItems)
  }, [])

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [items])

  const handleQuantityChange = (itemId: string, delta: number) => {
    const target = items.find((item) => item.id === itemId)
    if (!target) return
    const next = target.quantity + delta
    updateCartItemQuantity(itemId, next)
    const updated = listCartItems()
    setItems(updated)
  }

  const handleRemoveItem = (itemId: string) => {
    removeCartItem(itemId)
    setItems(listCartItems())
  }

  const validate = () => {
    if (items.length === 0) {
      Taro.showToast({ title: "购物车为空", icon: "none" })
      return false
    }
    if (!profile) {
      Taro.showToast({ title: "请先登录", icon: "none" })
      Taro.reLaunch({ url: "/pages/auth/login/index" })
      return false
    }
    if (orderType === "dine_in" && !tableNumber) {
      Taro.showToast({ title: "请输入桌号", icon: "none" })
      return false
    }
    if (!customerName) {
      Taro.showToast({ title: "请输入姓名", icon: "none" })
      return false
    }
    if (!customerPhone) {
      Taro.showToast({ title: "请输入手机号", icon: "none" })
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validate()) {
      return
    }

    try {
      setLoading(true)
      const tenantId = getStoredTenantId()
      const order = await createOrder({
        tenantId,
        userId: profile!.userId,
        orderType,
        totalAmount,
        items: items.map((item) => ({
          productId: item.productId,
          skuId: item.skuId,
          quantity: item.quantity,
          price: item.price,
        })),
        metadata: {
          tableNumber: orderType === "dine_in" ? tableNumber : undefined,
          customerName,
          customerPhone,
          remark,
        },
      })

      const payment = await createPayment({
        orderId: order.id,
        amount: totalAmount,
        description: `订单 ${order.orderNumber}`,
      })

      clearCart()
      setItems([])

      Taro.redirectTo({
        url: `/pages/order-confirm/index?orderId=${order.id}&paymentId=${payment.prepayId}`,
      })
    } catch (error) {
      console.error("提交订单失败", error)
      const message = error instanceof Error ? error.message : "提交失败，请重试"
      Taro.showToast({ title: message, icon: "none" })
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <View className="checkout-page">
        <View className="checkout-empty">
          <Text className="checkout-empty__text">购物车为空</Text>
          <Button className="checkout-empty__btn" onClick={() => Taro.switchTab({ url: "/pages/index/index" })}>
            返回首页选购
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View className="checkout-page">
      <View className="checkout-header">
        <Text className="checkout-title">确认订单</Text>
        <Text className="checkout-subtitle">共 {items.length} 件商品</Text>
      </View>

      <View className="checkout-section">
        <Text className="section-title">商品清单</Text>
        {items.map((item) => (
          <View key={item.id} className="checkout-item">
            <View className="checkout-item__info">
              <Text className="checkout-item__name">{item.productName}</Text>
              {item.skuName && <Text className="checkout-item__sku">{item.skuName}</Text>}
            </View>
            <View className="checkout-item__actions">
              <Text className="checkout-item__price">¥{item.price.toFixed(2)}</Text>
              <View className="quantity-control">
                <Button className="quantity-btn" onClick={() => handleQuantityChange(item.id, -1)}>-</Button>
                <Text className="quantity-value">{item.quantity}</Text>
                <Button className="quantity-btn" onClick={() => handleQuantityChange(item.id, 1)}>+</Button>
              </View>
              <Text className="remove-link" onClick={() => handleRemoveItem(item.id)}>
                删除
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View className="checkout-section">
        <Text className="section-title">订单类型</Text>
        <View className="order-type-selector">
          <View
            className={`type-option ${orderType === "dine_in" ? "type-option--active" : ""}`}
            onClick={() => setOrderType("dine_in")}
          >
            <Text>堂食</Text>
          </View>
          <View
            className={`type-option ${orderType === "takeout" ? "type-option--active" : ""}`}
            onClick={() => setOrderType("takeout")}
          >
            <Text>外卖</Text>
          </View>
        </View>

        {orderType === "dine_in" ? (
          <View className="input-group">
            <Text className="input-label">桌号 *</Text>
            <Input
              className="input-field"
              placeholder="请输入桌号"
              value={tableNumber}
              onInput={(event) => setTableNumber(event.detail.value)}
            />
          </View>
        ) : null}
      </View>

      <View className="checkout-section">
        <Text className="section-title">联系人信息</Text>
        <View className="input-group">
          <Text className="input-label">姓名 *</Text>
          <Input
            className="input-field"
            placeholder="请输入姓名"
            value={customerName}
            onInput={(event) => setCustomerName(event.detail.value)}
          />
        </View>
        <View className="input-group">
          <Text className="input-label">手机号 *</Text>
          <Input
            className="input-field"
            placeholder="请输入手机号"
            type="number"
            maxLength={11}
            value={customerPhone}
            onInput={(event) => setCustomerPhone(event.detail.value)}
          />
        </View>
        <View className="input-group">
          <Text className="input-label">备注</Text>
          <Textarea
            className="input-field textarea"
            placeholder="补充要求，例如：少辣、不加冰"
            value={remark}
            onInput={(event) => setRemark(event.detail.value)}
          />
        </View>
      </View>

      <View className="checkout-total">
        <View className="total-row">
          <Text>商品合计</Text>
          <Text>¥{totalAmount.toFixed(2)}</Text>
        </View>
        <View className="total-row total-row--final">
          <Text>应付金额</Text>
          <Text className="total-amount">¥{totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      <View className="checkout-footer">
        <Button className="submit-button" loading={loading} onClick={handleSubmit}>
          提交订单并支付
        </Button>
      </View>
    </View>
  )
}

export default CheckoutPage
