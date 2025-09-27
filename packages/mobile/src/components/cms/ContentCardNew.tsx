import React from 'react'
import { View, Image, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './ContentCard.scss'

interface ContentCardProps {
  id: string
  title: string
  summary?: string
  coverImage?: string
  category: string
  tags?: string[]
  publishedAt?: string
  linkType?: 'product' | 'resource' | 'url' | 'article' | 'none'
  linkPayload?: any
  onClick?: () => void
  layout?: 'horizontal' | 'vertical'
  showCategory?: boolean
  showDate?: boolean
  showTags?: boolean
}

export const ContentCardNew: React.FC<ContentCardProps> = ({
  id,
  title,
  summary,
  coverImage,
  category,
  tags,
  publishedAt,
  linkType,
  linkPayload,
  onClick,
  layout = 'vertical',
  showCategory = true,
  showDate = true,
  showTags = true
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick()
      return
    }

    if (!linkType || linkType === 'none') {
      return
    }

    try {
      switch (linkType) {
        case 'product':
          if (linkPayload?.productId) {
            Taro.navigateTo({
              url: `/pages/product/detail?id=${linkPayload.productId}`
            })
          }
          break
        case 'resource':
          if (linkPayload?.resourceId) {
            Taro.navigateTo({
              url: `/pages/booking/select?resourceId=${linkPayload.resourceId}`
            })
          }
          break
        case 'article':
          if (linkPayload?.articleId) {
            Taro.navigateTo({
              url: `/pages/article/detail?id=${linkPayload.articleId}`
            })
          }
          break
        case 'url':
          if (linkPayload?.url) {
            // 外部链接
            if (linkPayload.url.startsWith('http')) {
              Taro.navigateTo({
                url: `/pages/webview/index?url=${encodeURIComponent(linkPayload.url)}`
              })
            } else {
              // 内部路由
              Taro.navigateTo({
                url: linkPayload.url
              })
            }
          }
          break
        default:
          console.warn('Unknown link type:', linkType)
      }
    } catch (error) {
      console.error('处理链接跳转失败:', error)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return '今天'
    } else if (diffDays === 1) {
      return '昨天'
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else {
      return date.toLocaleDateString('zh-CN')
    }
  }

  const cardClass = `content-card content-card--${layout}`

  return (
    <View className={cardClass} onClick={handleClick}>
      {coverImage && (
        <View className="card-image-container">
          <Image
            className="card-image"
            src={coverImage}
            mode="aspectFill"
            lazyLoad
            onError={() => {
              console.warn(`Failed to load content image: ${coverImage}`)
            }}
          />
        </View>
      )}
      
      <View className="card-content">
        <View className="card-header">
          {showCategory && (
            <Text className="card-category">{category}</Text>
          )}
          {showDate && publishedAt && (
            <Text className="card-date">{formatDate(publishedAt)}</Text>
          )}
        </View>
        
        <Text className="card-title" numberOfLines={2}>{title}</Text>
        
        {summary && (
          <Text className="card-summary" numberOfLines={layout === 'horizontal' ? 2 : 3}>
            {summary}
          </Text>
        )}
        
        {showTags && tags && tags.length > 0 && (
          <View className="card-tags">
            {tags.slice(0, 3).map((tag, index) => (
              <Text key={index} className="card-tag">
                {tag}
              </Text>
            ))}
            {tags.length > 3 && (
              <Text className="card-tag card-tag--more">
                +{tags.length - 3}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  )
}
