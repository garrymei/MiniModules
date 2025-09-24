import { View, Text, Image, Button } from "@tarojs/components"
import { useState } from "react"
import "./ShoppingCart.scss"

interface CartItem {
  id: string
  productId: string
  skuId: string
  productName: string
  skuName: string
  price: number
  quantity: number
  image?: string
  attributes?: any
}

interface ShoppingCartProps {
  items: CartItem[]
  visible: boolean
  onClose: () => void
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemoveItem: (itemId: string) => void
  onCheckout: () => void
}

export const ShoppingCart: React.FC<ShoppingCartProps> = ({
  items,
  visible,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getTotalQuantity = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const formatPrice = (price: number) => {
    return `¥${price.toFixed(2)}`
  }

  const handleQuantityChange = (itemId: string, delta: number) => {
    const item = items.find(i => i.id === itemId)
    if (item) {
      const newQuantity = item.quantity + delta
      if (newQuantity > 0) {
        onUpdateQuantity(itemId, newQuantity)
      } else {
        onRemoveItem(itemId)
      }
    }
  }

  if (!visible) return null

  return (
    <View className="shopping-cart">
      {/* 遮罩层 */}
      <View className="shopping-cart__overlay" onClick={onClose} />
      
      {/* 购物车内容 */}
      <View className={`shopping-cart__content ${isExpanded ? 'shopping-cart__content--expanded' : ''}`}>
        {/* 头部 */}
        <View className="shopping-cart__header">
          <View className="shopping-cart__title">
            <Text className="shopping-cart__title-text">购物车</Text>
            <Text className="shopping-cart__count">({getTotalQuantity()})</Text>
          </View>
          <Button 
            className="shopping-cart__close-btn"
            onClick={onClose}
          >
            ×
          </Button>
        </View>

        {/* 商品列表 */}
        {items.length > 0 ? (
          <View className="shopping-cart__items">
            {items.map((item) => (
              <View key={item.id} className="shopping-cart__item">
                <View className="shopping-cart__item-image">
                  {item.image ? (
                    <Image 
                      src={item.image} 
                      mode="aspectFill"
                      className="shopping-cart__item-image-content"
                    />
                  ) : (
                    <View className="shopping-cart__item-image-placeholder">
                      <Text className="shopping-cart__item-image-placeholder-text">无图</Text>
                    </View>
                  )}
                </View>

                <View className="shopping-cart__item-info">
                  <Text className="shopping-cart__item-name">{item.productName}</Text>
                  {item.skuName && (
                    <Text className="shopping-cart__item-sku">{item.skuName}</Text>
                  )}
                  <View className="shopping-cart__item-price">
                    <Text className="shopping-cart__item-price-text">
                      {formatPrice(item.price)}
                    </Text>
                  </View>
                </View>

                <View className="shopping-cart__item-controls">
                  <View className="shopping-cart__quantity-controls">
                    <Button 
                      className="shopping-cart__quantity-btn"
                      onClick={() => handleQuantityChange(item.id, -1)}
                    >
                      -
                    </Button>
                    <Text className="shopping-cart__quantity-value">{item.quantity}</Text>
                    <Button 
                      className="shopping-cart__quantity-btn"
                      onClick={() => handleQuantityChange(item.id, 1)}
                    >
                      +
                    </Button>
                  </View>
                  
                  <Button 
                    className="shopping-cart__remove-btn"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    删除
                  </Button>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="shopping-cart__empty">
            <Text className="shopping-cart__empty-text">购物车是空的</Text>
            <Text className="shopping-cart__empty-hint">快去添加商品吧~</Text>
          </View>
        )}

        {/* 底部结算栏 */}
        {items.length > 0 && (
          <View className="shopping-cart__footer">
            <View className="shopping-cart__total">
              <Text className="shopping-cart__total-label">合计:</Text>
              <Text className="shopping-cart__total-price">
                {formatPrice(getTotalPrice())}
              </Text>
            </View>
            
            <Button 
              className="shopping-cart__checkout-btn"
              onClick={onCheckout}
            >
              去结算
            </Button>
          </View>
        )}
      </View>
    </View>
  )
}
