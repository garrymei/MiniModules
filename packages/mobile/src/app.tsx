import { PropsWithChildren } from "react"
import { useLaunch } from "@tarojs/taro"

import { getStoredTenantId } from "./services/config"
import useTenantConfigStore from "./store/config"

import "./app.scss"

const App: React.FC<PropsWithChildren> = ({ children }) => {
  const loadConfig = useTenantConfigStore((state) => state.loadConfig)

  useLaunch(() => {
    const tenantId = getStoredTenantId()
    loadConfig(tenantId).catch((error) => {
      console.error("Failed to load tenant configuration", error)
    })
  })

  return children
}

export default App
