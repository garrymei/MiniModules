import type { UserConfigExport } from '@tarojs/cli'

const baseConfig: UserConfigExport = {
  projectName: 'MiniModulesMobile',
  date: '2025-09-22',
  designWidth: 375,
  deviceRatio: {
    375: 2,
    414: 2,
    750: 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  framework: 'react',
  compiler: 'webpack5',
  cache: {
    enable: false,
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
      },
      url: {
        enable: true,
      },
      cssModules: {
        enable: true,
      },
    },
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    postcss: {
      autoprefixer: {
        enable: true,
      },
    },
  },
}

export default baseConfig
