import { View, Text, Image } from "@tarojs/components"
import Taro from "@tarojs/taro"
import "./ProductCard.scss"

interface ProductCardProps {
  product: {
    id: string
    name: string
    description?: string
    images?: string[]
    basePrice?: number
    category?: string
    status: string
  }
  cardStyle?: 'elevated' | 'flat' | 'outlined'
  onClick?: (product: any) => void
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  cardStyle = 'elevated',
  onClick 
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(product)
    } else {
      Taro.navigateTo({
        url: `/pages/products/detail?id=${product.id}`
      })
    }
  }

  const formatPrice = (price?: number) => {
    if (!price) return '价格面议'
    return `¥${price.toFixed(2)}`
  }

  return (
    <View 
      className={`product-card product-card--${cardStyle}`}
      onClick={handleClick}
    >
      <View className="product-card__image">
        {product.images && product.images.length > 0 ? (
          <Image 
            src={product.images[0]} 
            mode="aspectFill"
            className="product-card__image-content"
          />
        ) : (
          <View className="product-card__image-placeholder">
            <Text className="product-card__image-placeholder-text">暂无图片</Text>
          </View>
        )}
        {product.status !== 'active' && (
          <View className="product-card__status-badge">
            <Text className="product-card__status-text">下架</Text>
          </View>
        )}
      </View>
      
      <View className="product-card__content">
        <View className="product-card__header">
          <Text className="product-card__name">{product.name}</Text>
          {product.category && (
            <Text className="product-card__category">{product.category}</Text>
          )}
        </View>
        
        {product.description && (
          <Text className="product-card__description" numberOfLines={2}>
            {product.description}
          </Text>
        )}
        
        <View className="product-card__footer">
          <Text className="product-card__price">{formatPrice(product.basePrice)}</Text>
          <View className="product-card__action">
            <Text className="product-card__action-text">查看详情</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
