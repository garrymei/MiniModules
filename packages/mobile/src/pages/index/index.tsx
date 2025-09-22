import { useCallback, useEffect } from "react"
import { View, Text } from "@tarojs/components"
import Taro from "@tarojs/taro"

import useTenantConfigStore from "../../store/config"
import { getStoredTenantId } from "../../services/config"

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

  useEffect(() => {
    if (!config) {
      const tenantId = getStoredTenantId()
      loadConfig(tenantId).catch((err) => {
        console.error("Failed to load tenant configuration", err)
        Taro.showToast({ title: "Failed to load config", icon: "none" })
      })
    }
  }, [config, loadConfig])

  const handleModuleTap = useCallback(
    (moduleId: string) => {
      const copy = getModuleCopy(moduleId)
      Taro.showToast({ title: `${copy.title}: coming soon`, icon: "none" })
    },
    [],
  )

  const enabledModules: string[] = config?.enabledModules || []

  return (
    <View className="index-page">
      <View className="index-header">
        <Text className="index-title">MiniModules</Text>
        {config ? (
          <Text className="index-subtitle">Tenant: {config.tenantId}</Text>
        ) : null}
      </View>

      {isLoading ? <Text className="index-status">Loading tenant configuration...</Text> : null}
      {error ? <Text className="index-status index-status__error">{error}</Text> : null}

      <View className="module-grid">
        {enabledModules.length === 0 && !isLoading ? (
          <Text className="index-status">No modules enabled</Text>
        ) : (
          enabledModules.map((moduleId: string) => {
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
    </View>
  )
}

export default IndexPage
