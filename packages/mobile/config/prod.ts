import type { UserConfigExport } from '@tarojs/cli'
import baseConfig from './base'

const config: UserConfigExport = {
  ...baseConfig,
  env: {
    NODE_ENV: 'production',
  },
}

export default config
