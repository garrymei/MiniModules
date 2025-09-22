import Taro from '@tarojs/taro'
import axios from 'axios'
import type { TenantConfig } from './types'

const API_BASE =
  process.env.TARO_APP_API_BASE_URL || 'http://localhost:3000'

const client = axios.create({
  baseURL: API_BASE,
})

export const fetchTenantConfig = async (tenantId: string): Promise<TenantConfig> => {
  const response = await client.get(`/api/tenant/${tenantId}/config`)
  return response.data
}
