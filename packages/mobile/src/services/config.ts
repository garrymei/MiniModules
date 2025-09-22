import Taro from "@tarojs/taro"
import type { TenantConfig } from "@minimodules/libs"

import { request } from "./request"

const TENANT_ID_STORAGE_KEY = "mm_tenant_id"
const TENANT_CONFIG_STORAGE_KEY = "mm_tenant_config"
const DEFAULT_TENANT_ID = "tenant_001"

export const getStoredTenantId = (): string => {
  const tenantId = Taro.getStorageSync<string>(TENANT_ID_STORAGE_KEY)
  return tenantId || DEFAULT_TENANT_ID
}

export const setStoredTenantId = (tenantId: string): void => {
  if (!tenantId) {
    return
  }

  Taro.setStorageSync(TENANT_ID_STORAGE_KEY, tenantId)
}

export const getCachedTenantConfig = (): TenantConfig | null => {
  const cached = Taro.getStorageSync<TenantConfig>(TENANT_CONFIG_STORAGE_KEY)
  return cached || null
}

export const cacheTenantConfig = (config: TenantConfig): void => {
  if (!config) {
    return
  }

  setStoredTenantId(config.tenantId)
  Taro.setStorageSync(TENANT_CONFIG_STORAGE_KEY, config)
}

export const fetchTenantConfig = async (tenantId: string): Promise<TenantConfig> => {
  const response = await request<TenantConfig>({
    path: `/tenant/${tenantId}/config`,
    method: "GET",
  })

  cacheTenantConfig(response)
  return response
}

interface LoadOptions {
  refresh?: boolean
}

export const loadTenantConfig = async (
  tenantId?: string,
  options: LoadOptions = {},
): Promise<TenantConfig> => {
  const resolvedTenantId = tenantId || getStoredTenantId()
  const { refresh = false } = options

  if (!refresh) {
    const cached = getCachedTenantConfig()
    if (cached && cached.tenantId === resolvedTenantId) {
      return cached
    }
  }

  return fetchTenantConfig(resolvedTenantId)
}
