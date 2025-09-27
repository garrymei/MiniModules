import React, { useState, useEffect } from 'react'
import { View, Swiper, SwiperItem, Image, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { request } from '../../services/request'
import './BannerCarousel.scss'

interface Banner {
  id: string
  title: string
  description?: string
  imageUrl: string
  linkType: 'product' | 'resource' | 'url' | 'article' | 'none'
  linkPayload?: any
  sort: number
  status: 'draft' | 'published' | 'archived'
  startAt?: string
  endAt?: string
}

interface BannerCarouselProps {
  tenantId: string
  autoplay?: boolean
  interval?: number
  circular?: boolean
  indicatorDots?: boolean
  indicatorColor?: string
  indicatorActiveColor?: string
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({
  tenantId,
  autoplay = true,
  interval = 3000,
  circular = true,
  indicatorDots = true,
  indicatorColor = 'rgba(255, 255, 255, 0.3)',
  indicatorActiveColor = '#ffffff'
}) => {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBanners()
  }, [tenantId])

  const loadBanners = async () => {
    try {
      setLoading(true)
      const data = await request<Banner[]>({
        path: `cms/banners/${tenantId}`,
        method: 'GET'
      })

      if (Array.isArray(data)) {
        setBanners(data)
      }
    } catch (error) {
      console.error('加载Banner失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBannerClick = (banner: Banner) => {
    if (!banner.linkType || !banner.linkPayload) {
      return
    }

    try {
      const linkData = JSON.parse(banner.linkPayload)
      
      switch (banner.linkType) {
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
          console.warn('Unknown link type:', banner.linkType)
      }
    } catch (error) {
      console.error('解析链接数据失败:', error)
    }
  }

  if (loading) {
    return (
      <View className="banner-carousel banner-carousel--loading">
        <View className="banner-carousel__placeholder">
          <Text className="banner-carousel__placeholder-text">加载中...</Text>
        </View>
      </View>
    )
  }

  if (banners.length === 0) {
    return null
  }

  return (
    <View className="banner-carousel">
      <Swiper
        className="banner-carousel__swiper"
        autoplay={autoplay}
        interval={interval}
        circular={circular}
        indicatorDots={indicatorDots}
        indicatorColor={indicatorColor}
        indicatorActiveColor={indicatorActiveColor}
        duration={500}
      >
        {banners.map((banner) => (
          <SwiperItem key={banner.id}>
            <View 
              className="banner-carousel__item"
              onClick={() => handleBannerClick(banner)}
            >
              <Image
                className="banner-carousel__image"
                src={banner.imageUrl}
                mode="aspectFill"
                lazyLoad
              />
              {(banner.title || banner.description) && (
                <View className="banner-carousel__overlay">
                  {banner.title && (
                    <Text className="banner-carousel__title">{banner.title}</Text>
                  )}
                  {banner.description && (
                    <Text className="banner-carousel__description">{banner.description}</Text>
                  )}
                </View>
              )}
            </View>
          </SwiperItem>
        ))}
      </Swiper>
    </View>
  )
}
