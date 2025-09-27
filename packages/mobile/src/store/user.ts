import create from "zustand"
import Taro from "@tarojs/taro"

import { loginWithWeChat, logout } from "../services/auth"
import { getAuthToken, setAuthToken } from "../services/request"
import { getStoredTenantId, setStoredTenantId } from "../services/config"

interface UserProfile {
  userId: string
  tenantId: string
  nickname?: string
  avatarUrl?: string
}

interface UserState {
  token: string | null
  profile: UserProfile | null
  isAuthenticating: boolean
  login: (options?: { tenantId?: string; nickname?: string; avatarUrl?: string }) => Promise<UserProfile>
  loadFromStorage: () => void
  signOut: () => void
  logout: () => void
}

const USER_PROFILE_KEY = "mm_user_profile"

const readProfile = (): UserProfile | null => {
  const stored = Taro.getStorageSync<UserProfile>(USER_PROFILE_KEY)
  return stored || null
}

const writeProfile = (profile: UserProfile | null) => {
  if (profile) {
    Taro.setStorageSync(USER_PROFILE_KEY, profile)
  } else {
    Taro.removeStorageSync(USER_PROFILE_KEY)
  }
}

export const useUserStore = create<UserState>((set) => ({
  token: getAuthToken(),
  profile: readProfile(),
  isAuthenticating: false,
  async login(options) {
    set({ isAuthenticating: true })
    try {
      const result = await loginWithWeChat(options)
      const profile: UserProfile = {
        userId: result.user.userId,
        tenantId: result.user.tenantId,
        nickname: result.user.nickname,
        avatarUrl: result.user.avatarUrl,
      }
      writeProfile(profile)
      setStoredTenantId(profile.tenantId)
      set({ token: result.token, profile, isAuthenticating: false })
      return profile
    } catch (error) {
      set({ isAuthenticating: false })
      throw error
    }
  },
  loadFromStorage() {
    const token = getAuthToken()
    const profile = readProfile()
    if (profile?.tenantId) {
      setStoredTenantId(profile.tenantId)
    }
    set({ token, profile })
  },
  signOut() {
    logout()
    writeProfile(null)
    setAuthToken(null)
    set({ token: null, profile: null })
  },
  logout() {
    logout()
    writeProfile(null)
    setAuthToken(null)
    set({ token: null, profile: null })
  },
}))

export default useUserStore
