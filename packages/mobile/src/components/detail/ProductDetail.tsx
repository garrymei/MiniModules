import { View, Text, Image, Button } from "@tarojs/components"
import { useState } from "react"
import "./ProductDetail.scss"

interface SKU {
  id: string
  name: string
  price: number
  originalPrice?: number
  stock: number
  attributes?: any
}

interface ProductDetailProps {
  product: {
    id: string
    name: string
    description?: string
    images?: string[]
    basePrice?: number
    category?: string
    status: string
    skus?: SKU[]
  }
  onAddToCart?: (sku: SKU, quantity: number) => void
  onBuyNow?: (sku: SKU, quantity: number) => void
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ 
  product, 
  onAddToCart,
  onBuyNow 
}) => {
  const [selectedSku, setSelectedSku] = useState<SKU | null>(
    product.skus && product.skus.length > 0 ? product.skus[0] : null
  )
  const [quantity, setQuantity] = useState(1)
  const [showSkuSelector, setShowSkuSelector] = useState(false)

  const handleSkuSelect = (sku: SKU) => {
    setSelectedSku(sku)
    setShowSkuSelector(false)
  }

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta
    if (newQuantity >= 1 && selectedSku && newQuantity <= selectedSku.stock) {
      setQuantity(newQuantity)
    }
  }

  const handleAddToCart = () => {
    if (selectedSku && onAddToCart) {
      onAddToCart(selectedSku, quantity)
    }
  }

  const handleBuyNow = () => {
    if (selectedSku && onBuyNow) {
      onBuyNow(selectedSku, quantity)
    }
  }

  const formatPrice = (price: number) => {
    return `¥${price.toFixed(2)}`
  }

  const getTotalPrice = () => {
    if (!selectedSku) return 0
    return selectedSku.price * quantity
  }

  return (
    <View className="product-detail">
      {/* 商品图片 */}
      <View className="product-detail__images">
        {product.images && product.images.length > 0 ? (
          <Image 
            src={product.images[0]} 
            mode="aspectFill"
            className="product-detail__main-image"
          />
        ) : (
          <View className="product-detail__image-placeholder">
            <Text className="product-detail__image-placeholder-text">暂无图片</Text>
          </View>
        )}
      </View>

      {/* 商品信息 */}
      <View className="product-detail__info">
        <View className="product-detail__header">
          <Text className="product-detail__name">{product.name}</Text>
          {product.category && (
            <Text className="product-detail__category">{product.category}</Text>
          )}
        </View>

        <View className="product-detail__price-section">
          {selectedSku ? (
            <View className="product-detail__price">
              <Text className="product-detail__current-price">
                {formatPrice(selectedSku.price)}
              </Text>
              {selectedSku.originalPrice && selectedSku.originalPrice > selectedSku.price && (
                <Text className="product-detail__original-price">
                  {formatPrice(selectedSku.originalPrice)}
                </Text>
              )}
            </View>
          ) : (
            <Text className="product-detail__price-text">
              {product.basePrice ? formatPrice(product.basePrice) : '价格面议'}
            </Text>
          )}
        </View>

        {product.description && (
          <View className="product-detail__description">
            <Text className="product-detail__description-text">{product.description}</Text>
          </View>
        )}

        {/* SKU选择 */}
        {product.skus && product.skus.length > 0 && (
          <View className="product-detail__sku-section">
            <View className="product-detail__sku-header">
              <Text className="product-detail__sku-title">规格选择</Text>
              <Button 
                className="product-detail__sku-selector"
                onClick={() => setShowSkuSelector(true)}
              >
                {selectedSku ? selectedSku.name : '请选择规格'}
              </Button>
            </View>
            
            {selectedSku && (
              <View className="product-detail__sku-info">
                <Text className="product-detail__sku-stock">
                  库存: {selectedSku.stock}件
                </Text>
              </View>
            )}
          </View>
        )}

        {/* 数量选择 */}
        {selectedSku && (
          <View className="product-detail__quantity-section">
            <Text className="product-detail__quantity-title">数量</Text>
            <View className="product-detail__quantity-controls">
              <Button 
                className="product-detail__quantity-btn"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                -
              </Button>
              <Text className="product-detail__quantity-value">{quantity}</Text>
              <Button 
                className="product-detail__quantity-btn"
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= selectedSku.stock}
              >
                +
              </Button>
            </View>
          </View>
        )}
      </View>

      {/* 底部操作栏 */}
      <View className="product-detail__actions">
        <View className="product-detail__total">
          <Text className="product-detail__total-label">合计:</Text>
          <Text className="product-detail__total-price">
            {formatPrice(getTotalPrice())}
          </Text>
        </View>
        
        <View className="product-detail__buttons">
          <Button 
            className="product-detail__add-cart-btn"
            onClick={handleAddToCart}
            disabled={!selectedSku}
          >
            加入购物车
          </Button>
          <Button 
            className="product-detail__buy-now-btn"
            onClick={handleBuyNow}
            disabled={!selectedSku}
          >
            立即购买
          </Button>
        </View>
      </View>

      {/* SKU选择弹窗 */}
      {showSkuSelector && (
        <View className="product-detail__sku-modal">
          <View className="product-detail__sku-modal-content">
            <View className="product-detail__sku-modal-header">
              <Text className="product-detail__sku-modal-title">选择规格</Text>
              <Button 
                className="product-detail__sku-modal-close"
                onClick={() => setShowSkuSelector(false)}
              >
                ×
              </Button>
            </View>
            
            <View className="product-detail__sku-list">
              {product.skus?.map((sku) => (
                <View 
                  key={sku.id}
                  className={`product-detail__sku-item ${
                    selectedSku?.id === sku.id ? 'product-detail__sku-item--selected' : ''
                  }`}
                  onClick={() => handleSkuSelect(sku)}
                >
                  <View className="product-detail__sku-item-info">
                    <Text className="product-detail__sku-item-name">{sku.name}</Text>
                    <Text className="product-detail__sku-item-price">
                      {formatPrice(sku.price)}
                    </Text>
                  </View>
                  <Text className="product-detail__sku-item-stock">
                    库存: {sku.stock}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
