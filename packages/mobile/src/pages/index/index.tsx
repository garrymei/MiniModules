import { useCallback, useEffect } from "react"
import { View, Text } from "@tarojs/components"
import Taro, { useDidShow } from "@tarojs/taro"

import useTenantConfigStore from "../../store/config"
import { getStoredTenantId } from "../../services/config"
import { BannerCarousel } from "../../components/cms/BannerCarousel"
import { ContentList } from "../../components/cms/ContentList"
import { useI18n } from "../../hooks/useI18n"
import { LanguageSwitcher } from "../../components/LanguageSwitcher"

import "./index.scss"

const moduleCopy: Record<string, { title: string; description: string }> = {
  ordering: { title: "Ordering", description: "Browse and purchase items" },
  booking: { title: "Booking", description: "Reserve resources and times" },
  user: { title: "Members", description: "Access my account" },
}

const getModuleCopy = (moduleId: string): { title: string; description: string } => {
  return moduleCopy[moduleId] || { title: moduleId, description: "Feature coming soon" }
}

const IndexPage: React.FC = () => {
  const { config, isLoading, error, loadConfig } = useTenantConfigStore((state) => ({
    config: state.config,
    isLoading: state.isLoading,
    error: state.error,
    loadConfig: state.loadConfig,
  }))
  const { t } = useI18n()

  useEffect(() => {
    if (!config) {
      const tenantId = getStoredTenantId()
      loadConfig(tenantId).catch((err) => {
        console.error("Failed to load tenant configuration", err)
        Taro.showToast({ title: "Failed to load config", icon: "none" })
      })
    }
  }, [config, loadConfig])

  useDidShow(() => {
    const tenantId = getStoredTenantId()
    loadConfig(tenantId).catch((err) => {
      console.error("Failed to refresh tenant configuration", err)
    })
  })

  const handleModuleTap = useCallback(
    (moduleId: string) => {
      switch (moduleId) {
        case 'ordering':
          Taro.navigateTo({ url: '/pages/products/index' })
          break
        case 'booking':
          Taro.navigateTo({ url: '/pages/booking/select' })
          break
        case 'user':
          Taro.navigateTo({ url: '/pages/my/index' })
          break
        default:
          const copy = getModuleCopy(moduleId)
          Taro.showToast({ title: `${copy.title}: coming soon`, icon: "none" })
      }
    },
    [],
  )

  const enabledModules: string[] = config?.enabledModules || []
  const tenantId = getStoredTenantId()

  return (
    <View className="index-page">
      <View className="index-header">
        <Text className="index-title">{config?.theme?.name || 'MiniModules'}</Text>
        {config ? (
          <Text className="index-subtitle">Tenant: {config.tenantId}</Text>
        ) : null}
        <LanguageSwitcher size="small" showLabel={false} />
      </View>

      <View className="index-search" onClick={() => Taro.navigateTo({ url: '/pages/search/index' })}>
        <Text className="index-search__placeholder">搜索商品、场地或资讯</Text>
      </View>

      {isLoading ? <Text className="index-status">{t('common.loading')}</Text> : null}
      {error ? <Text className="index-status index-status__error">{error}</Text> : null}

      {/* Banner轮播 */}
      {config && enabledModules.includes('cms') && (
        <BannerCarousel tenantId={tenantId} />
      )}

      {/* 模块网格 */}
      <View className="module-grid">
        {enabledModules.length === 0 && !isLoading ? (
          <Text className="index-status">{t('messages.noData')}</Text>
        ) : (
          enabledModules.filter(module => module !== 'cms').map((moduleId: string) => {
            const copy = getModuleCopy(moduleId)
            return (
              <View
                key={moduleId}
                className="module-card"
                onClick={() => handleModuleTap(moduleId)}
              >
                <Text className="module-card__title">{copy.title}</Text>
                <Text className="module-card__description">{copy.description}</Text>
              </View>
            )
          })
        )}
      </View>

      {/* CMS内容列表 */}
      {config && enabledModules.includes('cms') && (
        <ContentList 
          tenantId={tenantId}
          layout="grid"
          limit={6}
          showHeader={true}
          title={t('cms.news')}
        />
      )}
    </View>
  )
}

export default IndexPage
