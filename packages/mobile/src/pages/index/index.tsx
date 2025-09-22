import { useEffect } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useTenantStore } from '../../store/tenant'
import './index.css'

const moduleLabels: Record<string, string> = {
  ordering: '点餐',
  ticketing: '票务',
  booking: '预约',
  'table-management': '桌位管理',
  ecommerce: '电商',
}

const Index = () => {
  const config = useTenantStore(state => state.config)

  useEffect(() => {
    if (config?.theme?.primaryColor) {
      Taro.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: config.theme.primaryColor,
      })
    }
  }, [config?.theme?.primaryColor])

  if (!config) {
    return (
      <View className="page">
        <Text className="loading">加载配置中...</Text>
      </View>
    )
  }

  const modules = config.enabledModules ?? []

  return (
    <View className="page">
      <View className="header">
        <Text className="title">欢迎来到 {config.industry} 门户</Text>
        <Text className="subtitle">请选择一个功能模块开始</Text>
      </View>
      <View className="grid">
        {modules.length === 0 ? (
          <View className="empty">
            <Text>当前没有启用模块</Text>
          </View>
        ) : (
          modules.map(moduleId => (
            <View key={moduleId} className="card">
              <Text className="card-title">
                {moduleLabels[moduleId] ?? moduleId}
              </Text>
              <Button
                className="card-button"
                onClick={() =>
                  Taro.showToast({
                    title: `${moduleLabels[moduleId] ?? moduleId} 敬请期待`,
                    icon: 'none',
                  })
                }
              >
                进入
              </Button>
            </View>
          ))
        )}
      </View>
    </View>
  )
}

export default Index
