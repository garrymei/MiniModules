import create from "zustand"
import type { TenantConfig } from "@minimodules/libs"

import { getCachedTenantConfig, loadTenantConfig } from "../services/config"

interface TenantConfigState {
  config?: TenantConfig
  isLoading: boolean
  error?: string
  loadConfig: (tenantId?: string, options?: { refresh?: boolean }) => Promise<TenantConfig>
  setConfig: (config: TenantConfig) => void
}

export const useTenantConfigStore = create<TenantConfigState>((set) => ({
  config: getCachedTenantConfig() || undefined,
  isLoading: false,
  error: undefined,
  async loadConfig(tenantId, options) {
    const refresh = options?.refresh ?? false

    set({ isLoading: true, error: undefined })

    try {
      const config = await loadTenantConfig(tenantId, { refresh })
      set({ config, isLoading: false })
      return config
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load tenant configuration"
      set({ error: message, isLoading: false })
      throw error
    }
  },
  setConfig(config) {
    set({ config })
  },
}))

export default useTenantConfigStore
