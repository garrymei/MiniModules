import React, { useState, useEffect } from 'react'
import { View, Text, Button, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useI18n } from '../../hooks/useI18n'
import useUserStore from '../../store/user'
import { getStoredTenantId } from '../../services/config'
import './index.scss'

const MyPage: React.FC = () => {
  const { t } = useI18n()
  const profile = useUserStore((state) => state.profile)
  const logout = useUserStore((state) => state.logout)
  const [tenantId, setTenantId] = useState('')

  useEffect(() => {
    const storedTenantId = getStoredTenantId()
    setTenantId(storedTenantId)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      Taro.reLaunch({ url: '/pages/auth/login/index' })
    } catch (error) {
      console.error('Logout failed:', error)
      Taro.showToast({ title: '退出登录失败', icon: 'none' })
    }
  }

  const handleNavigateToOrders = () => {
    Taro.navigateTo({ url: '/pages/my/orders/index' })
  }

  const handleNavigateToBookings = () => {
    Taro.navigateTo({ url: '/pages/my/bookings/index' })
  }

  const handleNavigateToSettings = () => {
    Taro.showToast({ title: '功能开发中', icon: 'none' })
  }

  return (
    <ScrollView className="my-page" scrollY>
      {/* 用户信息卡片 */}
      <View className="user-card">
        <View className="user-info">
          <Image
            className="user-avatar"
            src={profile?.avatarUrl || 'https://minimodules-assets.s3.amazonaws.com/default-avatar.png'}
            mode="aspectFill"
          />
          <View className="user-details">
            <Text className="user-name">{profile?.nickname || '用户'}</Text>
            <Text className="user-id">ID: {profile?.userId || 'N/A'}</Text>
          </View>
        </View>
        <Button className="logout-button" size="mini" onClick={handleLogout}>
          {t('auth.logout')}
        </Button>
      </View>

      {/* 功能菜单 */}
      <View className="menu-section">
        <View className="menu-item" onClick={handleNavigateToOrders}>
          <View className="menu-icon">
            <Text className="icon">📋</Text>
          </View>
          <View className="menu-content">
            <Text className="menu-title">{t('profile.orderHistory')}</Text>
            <Text className="menu-desc">查看订单记录</Text>
          </View>
          <View className="menu-arrow">
            <Text className="arrow">›</Text>
          </View>
        </View>

        <View className="menu-item" onClick={handleNavigateToBookings}>
          <View className="menu-icon">
            <Text className="icon">📅</Text>
          </View>
          <View className="menu-content">
            <Text className="menu-title">{t('profile.bookingHistory')}</Text>
            <Text className="menu-desc">查看预约记录</Text>
          </View>
          <View className="menu-arrow">
            <Text className="arrow">›</Text>
          </View>
        </View>

        <View className="menu-item" onClick={handleNavigateToSettings}>
          <View className="menu-icon">
            <Text className="icon">⚙️</Text>
          </View>
          <View className="menu-content">
            <Text className="menu-title">{t('profile.settings')}</Text>
            <Text className="menu-desc">个人设置</Text>
          </View>
          <View className="menu-arrow">
            <Text className="arrow">›</Text>
          </View>
        </View>
      </View>

      {/* 其他功能 */}
      <View className="menu-section">
        <View className="menu-item" onClick={handleNavigateToSettings}>
          <View className="menu-icon">
            <Text className="icon">💬</Text>
          </View>
          <View className="menu-content">
            <Text className="menu-title">{t('profile.feedback')}</Text>
            <Text className="menu-desc">意见反馈</Text>
          </View>
          <View className="menu-arrow">
            <Text className="arrow">›</Text>
          </View>
        </View>

        <View className="menu-item" onClick={handleNavigateToSettings}>
          <View className="menu-icon">
            <Text className="icon">ℹ️</Text>
          </View>
          <View className="menu-content">
            <Text className="menu-title">{t('profile.about')}</Text>
            <Text className="menu-desc">关于我们</Text>
          </View>
          <View className="menu-arrow">
            <Text className="arrow">›</Text>
          </View>
        </View>
      </View>

      {/* 版本信息 */}
      <View className="version-info">
        <Text className="version-text">MiniModules v1.0.0</Text>
      </View>
    </ScrollView>
  )
}

export default MyPage
