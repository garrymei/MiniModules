import Taro from '@tarojs/taro'

export interface ThemeConfig {
  primaryColor: string
  buttonRadius: number
  logo: string
  name: string
  cssVariables: Record<string, string>
}

export class ThemeService {
  private static instance: ThemeService
  private currentTheme: ThemeConfig | null = null
  private lastUpdated: number = 0

  static getInstance(): ThemeService {
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService()
    }
    return ThemeService.instance
  }

  /**
   * 获取租户主题配置
   */
  async getTenantTheme(tenantId: string): Promise<ThemeConfig> {
    try {
      const response = await Taro.request({
        url: `/api/theme/${tenantId}`,
        method: 'GET',
      })

      if (response.statusCode === 200 && response.data) {
        this.currentTheme = response.data
        this.lastUpdated = Date.now()
        this.applyTheme(response.data)
        return response.data
      }

      throw new Error('Failed to fetch theme')
    } catch (error) {
      console.error('获取主题配置失败:', error)
      // 返回默认主题
      return this.getDefaultTheme()
    }
  }

  /**
   * 应用主题到页面
   */
  applyTheme(theme: ThemeConfig): void {
    // 在Taro环境中，主题通过CSS变量文件应用
    // 这里主要保存主题配置，供组件使用
    console.log('Applying theme:', theme)
  }

  /**
   * 检查主题是否需要更新
   */
  async checkThemeUpdate(tenantId: string): Promise<boolean> {
    try {
      const response = await Taro.request({
        url: `/api/theme/${tenantId}/check`,
        method: 'GET',
        header: {
          'If-Modified-Since': new Date(this.lastUpdated).toUTCString()
        }
      })

      // 如果返回304 Not Modified，说明没有更新
      if (response.statusCode === 304) {
        return false
      }

      // 如果有更新，重新获取主题
      if (response.statusCode === 200) {
        await this.getTenantTheme(tenantId)
        return true
      }

      return false
    } catch (error) {
      console.error('检查主题更新失败:', error)
      return false
    }
  }

  /**
   * 获取当前主题
   */
  getCurrentTheme(): ThemeConfig | null {
    return this.currentTheme
  }

  /**
   * 获取默认主题
   */
  private getDefaultTheme(): ThemeConfig {
    return {
      primaryColor: '#1890ff',
      buttonRadius: 6,
      logo: '',
      name: 'MiniModules',
      cssVariables: {
        '--color-primary': '#1890ff',
        '--radius-md': '6px',
        '--logo-url': 'none',
      }
    }
  }

  /**
   * 更新favicon（在Taro环境中暂不实现）
   */
  private updateFavicon(logoUrl: string): void {
    // 在Taro环境中，favicon更新需要特殊处理
    console.log('Update favicon:', logoUrl)
  }

  /**
   * 监听主题变化（用于实时更新）
   */
  startThemeWatcher(tenantId: string, interval: number = 30000): void {
    setInterval(async () => {
      await this.checkThemeUpdate(tenantId)
    }, interval)
  }

  /**
   * 停止主题监听
   */
  stopThemeWatcher(): void {
    // 这里可以实现停止监听的逻辑
  }
}
