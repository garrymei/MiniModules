import React, { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { request } from '../../services/request'
import { ContentCard } from './ContentCard'
import './ContentList.scss'

interface Article {
  id: string
  title: string
  excerpt?: string
  coverUrl?: string
  category: string
  viewCount: number
  publishedAt?: string
  linkType: 'product' | 'resource' | 'url' | 'article'
  linkPayload?: string
}

interface ContentListProps {
  tenantId: string
  category?: string
  limit?: number
  layout?: 'grid' | 'list'
  cardStyle?: 'flat' | 'elevated'
  showHeader?: boolean
  title?: string
  onLoadMore?: () => void
}

export const ContentList: React.FC<ContentListProps> = ({
  tenantId,
  category,
  limit = 10,
  layout = 'grid',
  cardStyle = 'elevated',
  showHeader = true,
  title = '最新内容',
  onLoadMore
}) => {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    loadArticles()
  }, [tenantId, category, limit])

  const loadArticles = async () => {
    try {
      setLoading(true)
      const params: string[] = []
      if (category) params.push(`category=${encodeURIComponent(category)}`)
      if (limit) params.push(`limit=${limit}`)
      const queryString = params.length > 0 ? `?${params.join('&')}` : ''

      const data = await request<Article[]>({
        path: `cms/articles/${tenantId}${queryString}`,
        method: 'GET'
      })

      if (Array.isArray(data)) {
        setArticles(data)
        setHasMore(data.length >= limit)
      }
    } catch (error) {
      console.error('加载文章失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    if (hasMore && onLoadMore) {
      onLoadMore()
    }
  }

  const handleArticleClick = (article: Article) => {
    // 记录点击统计
    request({
      path: `cms/articles/${tenantId}/${article.id}`,
      method: 'GET'
    }).catch(error => {
      console.error('记录文章访问失败:', error)
    })
  }

  if (loading) {
    return (
      <View className="content-list content-list--loading">
        {showHeader && (
          <View className="content-list__header">
            <Text className="content-list__title">{title}</Text>
          </View>
        )}
        <View className="content-list__loading">
          <Text className="content-list__loading-text">加载中...</Text>
        </View>
      </View>
    )
  }

  if (articles.length === 0) {
    return (
      <View className="content-list content-list--empty">
        {showHeader && (
          <View className="content-list__header">
            <Text className="content-list__title">{title}</Text>
          </View>
        )}
        <View className="content-list__empty">
          <Text className="content-list__empty-text">暂无内容</Text>
        </View>
      </View>
    )
  }

  return (
    <View className={`content-list content-list--${layout}`}>
      {showHeader && (
        <View className="content-list__header">
          <Text className="content-list__title">{title}</Text>
          {category && (
            <Text className="content-list__category">{category}</Text>
          )}
        </View>
      )}

      <View className={`content-list__container content-list__container--${layout}`}>
        {articles.map((article) => (
          <ContentCard
            key={article.id}
            {...article}
            cardStyle={cardStyle}
            onClick={handleArticleClick}
          />
        ))}
      </View>

      {hasMore && onLoadMore && (
        <View className="content-list__load-more" onClick={handleLoadMore}>
          <Text className="content-list__load-more-text">加载更多</Text>
        </View>
      )}
    </View>
  )
}
