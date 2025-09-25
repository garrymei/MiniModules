import { PropsWithChildren } from "react"
import { useLaunch } from "@tarojs/taro"

import { getStoredTenantId } from "./services/config"
import { ThemeService } from "./services/theme"
import useTenantConfigStore from "./store/config"
import { useI18n } from "./hooks/useI18n"

import "./app.scss"
import "./styles/theme.css"

const App: React.FC<PropsWithChildren> = ({ children }) => {
  const loadConfig = useTenantConfigStore((state) => state.loadConfig)
  const { locale } = useI18n()

  useLaunch(() => {
    const tenantId = getStoredTenantId()
    
    // 加载租户配置
    loadConfig(tenantId).catch((error) => {
      console.error("Failed to load tenant configuration", error)
    })

    // 加载并应用主题
    const themeService = ThemeService.getInstance()
    themeService.getTenantTheme(tenantId).then((theme) => {
      console.log("Theme loaded:", theme)
    }).catch((error) => {
      console.error("Failed to load theme:", error)
    })

    // 启动主题监听（每30秒检查一次更新）
    themeService.startThemeWatcher(tenantId, 30000)
  })

  return children
}

export default App
