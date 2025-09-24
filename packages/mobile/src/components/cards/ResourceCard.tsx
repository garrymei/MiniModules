import { View, Text, Image } from "@tarojs/components"
import Taro from "@tarojs/taro"
import "./ResourceCard.scss"

interface ResourceCardProps {
  resource: {
    id: string
    name: string
    description?: string
    type: string
    capacity: number
    images?: string[]
    basePrice?: number
    status: string
    features?: any
  }
  cardStyle?: 'elevated' | 'flat' | 'outlined'
  onClick?: (resource: any) => void
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ 
  resource, 
  cardStyle = 'elevated',
  onClick 
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(resource)
    } else {
      Taro.navigateTo({
        url: `/pages/booking/detail?id=${resource.id}`
      })
    }
  }

  const formatPrice = (price?: number) => {
    if (!price) return '价格面议'
    return `¥${price.toFixed(2)}/小时`
  }

  const getTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      room: '房间',
      table: '桌台',
      court: '场地',
      equipment: '设备',
      venue: '场馆'
    }
    return typeMap[type] || type
  }

  return (
    <View 
      className={`resource-card resource-card--${cardStyle}`}
      onClick={handleClick}
    >
      <View className="resource-card__image">
        {resource.images && resource.images.length > 0 ? (
          <Image 
            src={resource.images[0]} 
            mode="aspectFill"
            className="resource-card__image-content"
          />
        ) : (
          <View className="resource-card__image-placeholder">
            <Text className="resource-card__image-placeholder-text">暂无图片</Text>
          </View>
        )}
        {resource.status !== 'active' && (
          <View className="resource-card__status-badge">
            <Text className="resource-card__status-text">不可用</Text>
          </View>
        )}
      </View>
      
      <View className="resource-card__content">
        <View className="resource-card__header">
          <Text className="resource-card__name">{resource.name}</Text>
          <View className="resource-card__type">
            <Text className="resource-card__type-text">{getTypeText(resource.type)}</Text>
          </View>
        </View>
        
        <View className="resource-card__info">
          <View className="resource-card__capacity">
            <Text className="resource-card__capacity-text">容量: {resource.capacity}人</Text>
          </View>
          {resource.features && Object.keys(resource.features).length > 0 && (
            <View className="resource-card__features">
              {Object.entries(resource.features).slice(0, 2).map(([key, value]) => (
                <Text key={key} className="resource-card__feature-tag">
                  {String(value)}
                </Text>
              ))}
            </View>
          )}
        </View>
        
        {resource.description && (
          <Text className="resource-card__description" numberOfLines={2}>
            {resource.description}
          </Text>
        )}
        
        <View className="resource-card__footer">
          <Text className="resource-card__price">{formatPrice(resource.basePrice)}</Text>
          <View className="resource-card__action">
            <Text className="resource-card__action-text">立即预约</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
