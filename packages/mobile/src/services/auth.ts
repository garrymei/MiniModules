import Taro from "@tarojs/taro"

import { request, setAuthToken } from "./request"
import { setStoredTenantId } from "./config"

interface WechatLoginResponse {
  token: string
  user: {
    userId: string
    tenantId: string
    wechatOpenId: string
    nickname?: string
    avatarUrl?: string
  }
}

export interface AuthState {
  token: string | null
  userId: string | null
  tenantId: string | null
  nickname?: string
  avatarUrl?: string
}

export const loginWithWeChat = async (options?: { tenantId?: string; nickname?: string; avatarUrl?: string }) => {
  const loginResult = await Taro.login()
  if (!loginResult.code) {
    throw new Error(loginResult.errMsg || "微信登录失败")
  }

  const payload = {
    code: loginResult.code,
    tenantId: options?.tenantId,
    nickname: options?.nickname,
    avatarUrl: options?.avatarUrl,
  }

  const response = await request<WechatLoginResponse>({
    path: "auth/wechat",
    method: "POST",
    data: payload,
  })

  setAuthToken(response.token)
  setStoredTenantId(response.user.tenantId)

  return response
}

export const logout = () => {
  setAuthToken(null)
}
