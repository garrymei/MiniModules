import { useEffect } from 'react'
import { PropsWithChildren } from 'react'
import Taro from '@tarojs/taro'
import { fetchTenantConfig } from './services/config'
import { useTenantStore } from './store/tenant'
import './styles/app.css'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

function App({ children }: PropsWithChildren) {
  const setConfig = useTenantStore(state => state.setConfig)
  const hasConfig = useTenantStore(state => Boolean(state.config))

  useEffect(() => {
    if (hasConfig) return

    const load = async () => {
      try {
        const config = await fetchTenantConfig(TENANT_ID)
        setConfig(config)
      } catch (error) {
        console.error('Failed to load tenant config', error)
        Taro.showToast({ title: '加载配置失败', icon: 'none' })
      }
    }

    load()
  }, [hasConfig, setConfig])

  return children as JSX.Element
}

export default App
