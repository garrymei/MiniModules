import type { UserConfigExport } from '@tarojs/cli'
import devConfig from './dev'
import prodConfig from './prod'

export default defineConfig(async () => {
  if (process.env.NODE_ENV === 'development') return devConfig
  return prodConfig
}) as UserConfigExport

function defineConfig<T>(config: T): T {
  return config
}
