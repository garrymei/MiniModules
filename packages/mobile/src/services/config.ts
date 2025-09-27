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

export const fetchTenantConfigMeta = async (tenantId: string): Promise<{ version: number; updatedAt: string; status: string }> => {
  return request<{ version: number; updatedAt: string; status: string }>({
    path: `/tenant/${tenantId}/config/meta`,
    method: "GET",
  })
}

export const loadTenantConfig = async (
  tenantId?: string,
  options: LoadOptions = {},
): Promise<TenantConfig> => {
  const resolvedTenantId = tenantId || getStoredTenantId()
  const { refresh = false } = options

  const cached = getCachedTenantConfig()

  if (!refresh && cached && cached.tenantId === resolvedTenantId) {
    return cached
  }

  if (cached && cached.updatedAt && !refresh) {
    try {
      const meta = await fetchTenantConfigMeta(resolvedTenantId)
      if (meta.updatedAt === cached.updatedAt) {
        return cached
      }
    } catch (error) {
      console.warn("Failed to fetch tenant config meta", error)
      return cached
    }
  }

  return fetchTenantConfig(resolvedTenantId)
}
