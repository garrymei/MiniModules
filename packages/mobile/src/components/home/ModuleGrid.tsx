import { View, Text, Image } from "@tarojs/components"
import Taro from "@tarojs/taro"
import "./ModuleGrid.scss"

interface Module {
  key: string
  name: string
  description: string
  icon: string
  enabled: boolean
  route: string
}

interface ModuleGridProps {
  modules: Module[]
  columns?: number
  onModuleClick?: (module: Module) => void
}

export const ModuleGrid: React.FC<ModuleGridProps> = ({ 
  modules, 
  columns = 2,
  onModuleClick 
}) => {
  const handleModuleClick = (module: Module) => {
    if (!module.enabled) {
      Taro.showToast({
        title: '该模块暂未开放',
        icon: 'none'
      })
      return
    }

    if (onModuleClick) {
      onModuleClick(module)
    } else {
      Taro.navigateTo({
        url: module.route
      })
    }
  }

  const getModuleIcon = (moduleKey: string) => {
    const iconMap: Record<string, string> = {
      ordering: '🍽️',
      booking: '📅',
      ecommerce: '🛒',
      ticketing: '🎫',
      subscription: '👑',
      cms: '📝'
    }
    return iconMap[moduleKey] || '📦'
  }

  const enabledModules = modules.filter(module => module.enabled)

  return (
    <View className="module-grid">
      <View className="module-grid__header">
        <Text className="module-grid__title">服务模块</Text>
        <Text className="module-grid__subtitle">
          共 {enabledModules.length} 个可用服务
        </Text>
      </View>

      <View 
        className="module-grid__content"
        style={{ 
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: 'var(--spacing-md)'
        }}
      >
        {modules.map((module) => (
          <View
            key={module.key}
            className={`module-card ${!module.enabled ? 'module-card--disabled' : ''}`}
            onClick={() => handleModuleClick(module)}
          >
            <View className="module-card__icon">
              <Text className="module-card__icon-text">
                {getModuleIcon(module.key)}
              </Text>
            </View>
            
            <View className="module-card__content">
              <Text className="module-card__name">{module.name}</Text>
              <Text className="module-card__description" numberOfLines={2}>
                {module.description}
              </Text>
            </View>

            {!module.enabled && (
              <View className="module-card__disabled-overlay">
                <Text className="module-card__disabled-text">暂未开放</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {enabledModules.length === 0 && (
        <View className="module-grid__empty">
          <Text className="module-grid__empty-icon">📦</Text>
          <Text className="module-grid__empty-text">暂无可用服务</Text>
          <Text className="module-grid__empty-hint">请联系管理员开通服务</Text>
        </View>
      )}
    </View>
  )
}
