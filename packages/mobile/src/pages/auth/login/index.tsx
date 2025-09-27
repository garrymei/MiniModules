import { useState } from "react"
import { View, Text, Button, Image } from "@tarojs/components"
import Taro from "@tarojs/taro"

import useUserStore from "../../../store/user"
import useTenantConfigStore from "../../../store/config"
import { getStoredTenantId } from "../../../services/config"

import "./index.scss"

const LoginPage: React.FC = () => {
  const login = useUserStore((state) => state.login)
  const isAuthenticating = useUserStore((state) => state.isAuthenticating)
  const loadConfig = useTenantConfigStore((state) => state.loadConfig)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    try {
      setError(null)
      const profile = await login()
      await loadConfig(profile.tenantId, { refresh: true })
      Taro.reLaunch({ url: "/pages/index/index" })
    } catch (err) {
      const message = err instanceof Error ? err.message : "登录失败，请稍后再试"
      setError(message)
      Taro.showToast({ title: message, icon: "none" })
    }
  }

  return (
    <View className="login-page">
      <View className="login-hero">
        <Image
          className="login-hero__logo"
          src="https://minimodules-assets.s3.amazonaws.com/logo.png"
          mode="aspectFit"
        />
        <Text className="login-hero__title">MiniModules</Text>
        <Text className="login-hero__subtitle">欢迎体验多租户小程序</Text>
      </View>

      <View className="login-card">
        <Text className="login-card__heading">微信账号登录</Text>
        <Text className="login-card__description">
          登录后即可查看模块内容、下单或预约。
        </Text>

        <Button
          className="login-button"
          loading={isAuthenticating}
          onClick={handleLogin}
          type="primary"
        >
          一键登录 / 注册
        </Button>

        {error ? <Text className="login-error">{error}</Text> : null}
      </View>
    </View>
  )
}

export default LoginPage
