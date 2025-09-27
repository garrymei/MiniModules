import { PropsWithChildren } from "react"
import { useLaunch } from "@tarojs/taro"

import { getStoredTenantId } from "./services/config"
import { ThemeService } from "./services/theme"
import useTenantConfigStore from "./store/config"
import { useI18n } from "./hooks/useI18n"
import useUserStore from "./store/user"
import { getAuthToken } from "./services/request"

import "./app.scss"
import "./styles/theme.css"

const App: React.FC<PropsWithChildren> = ({ children }) => {
  const loadConfig = useTenantConfigStore((state) => state.loadConfig)
  const { locale } = useI18n()
  const loadUserFromStorage = useUserStore((state) => state.loadFromStorage)

  useLaunch(() => {
    loadUserFromStorage()

    const tenantId = getStoredTenantId()

    const existingToken = getAuthToken()

    if (existingToken) {
      loadConfig(tenantId).catch((error) => {
        console.error("Failed to load tenant configuration", error)
      })

      const themeService = ThemeService.getInstance()
      themeService
        .getTenantTheme(tenantId)
        .then((theme) => {
          console.log("Theme loaded:", theme)
        })
        .catch((error) => {
          console.error("Failed to load theme:", error)
        })

      themeService.startThemeWatcher(tenantId, 30000)
    }
  })

  return children
}

export default App
