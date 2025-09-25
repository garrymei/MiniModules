import React from 'react'
import { View, Image, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './ContentCard.scss'

interface ContentCardProps {
  id: string
  title: string
  excerpt?: string
  coverUrl?: string
  category?: string
  viewCount?: number
  publishedAt?: string
  linkType: 'product' | 'resource' | 'url' | 'article'
  linkPayload?: string
  cardStyle?: 'flat' | 'elevated'
  onClick?: (content: any) => void
}

export const ContentCard: React.FC<ContentCardProps> = ({
  id,
  title,
  excerpt,
  coverUrl,
  category,
  viewCount,
  publishedAt,
  linkType,
  linkPayload,
  cardStyle = 'elevated',
  onClick
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick({ id, title, excerpt, coverUrl, category, viewCount, publishedAt, linkType, linkPayload })
      return
    }

    if (!linkType || !linkPayload) {
      return
    }

    try {
      const linkData = JSON.parse(linkPayload)
      
      switch (linkType) {
        case 'product':
          Taro.navigateTo({
            url: `/pages/products/detail?id=${linkData.id}`
          })
          break
        case 'resource':
          Taro.navigateTo({
            url: `/pages/booking/resource?id=${linkData.id}`
          })
          break
        case 'article':
          Taro.navigateTo({
            url: `/pages/articles/detail?id=${linkData.id}`
          })
          break
        case 'url':
          if (linkData.url) {
            Taro.navigateTo({
              url: `/pages/webview/index?url=${encodeURIComponent(linkData.url)}`
            })
          }
          break
        default:
          console.warn('Unknown link type:', linkType)
      }
    } catch (error) {
      console.error('解析链接数据失败:', error)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    })
  }

  const formatViewCount = (count?: number) => {
    if (!count) return ''
    if (count < 1000) return count.toString()
    if (count < 10000) return `${(count / 1000).toFixed(1)}k`
    return `${(count / 10000).toFixed(1)}w`
  }

  return (
    <View 
      className={`content-card content-card--${cardStyle}`}
      onClick={handleClick}
    >
      {coverUrl && (
        <View className="content-card__image-container">
          <Image
            className="content-card__image"
            src={coverUrl}
            mode="aspectFill"
            lazyLoad
          />
          {category && (
            <View className="content-card__category">
              <Text className="content-card__category-text">{category}</Text>
            </View>
          )}
        </View>
      )}

      <View className="content-card__content">
        <Text className="content-card__title" numberOfLines={2}>
          {title}
        </Text>
        
        {excerpt && (
          <Text className="content-card__excerpt" numberOfLines={2}>
            {excerpt}
          </Text>
        )}

        <View className="content-card__meta">
          {publishedAt && (
            <Text className="content-card__date">
              {formatDate(publishedAt)}
            </Text>
          )}
          {viewCount && viewCount > 0 && (
            <Text className="content-card__views">
              {formatViewCount(viewCount)} 阅读
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}
