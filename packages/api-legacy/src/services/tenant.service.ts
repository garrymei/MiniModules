import { ModuleSpec } from '@minimodules/libs';

export interface TenantConfig {
  tenant_id: string;
  industry: string;
  enabled_modules: string[];
  theme: {
    primaryColor: string;
    logo: string;
    name: string;
  };
  [key: string]: any; // 模块特定配置
}

export class TenantService {
  /**
   * 获取租户配置
   */
  async getTenantConfig(tenantId: string): Promise<TenantConfig> {
    // 这里应该从数据库获取租户配置
    // 暂时返回示例配置
    return {
      tenant_id: tenantId,
      industry: 'restaurant',
      enabled_modules: ['ordering', 'user', 'pay', 'cms'],
      theme: {
        primaryColor: '#FF6A00',
        logo: 'https://example.com/logo.png',
        name: '示例餐厅'
      },
      ordering: {
        time_slot_length: 30,
        max_items_per_order: 50,
        enable_takeout: true,
        enable_dine_in: true
      },
      booking: {
        slot_duration: 60,
        advance_booking_days: 7,
        max_people_per_slot: 10
      }
    };
  }

  /**
   * 更新租户配置
   */
  async updateTenantConfig(tenantId: string, config: Partial<TenantConfig>): Promise<TenantConfig> {
    // 这里应该更新数据库中的租户配置
    const currentConfig = await this.getTenantConfig(tenantId);
    const updatedConfig = { ...currentConfig, ...config };
    
    // 保存到数据库的逻辑...
    
    return updatedConfig;
  }

  /**
   * 获取启用的模块规范
   */
  async getEnabledModuleSpecs(tenantId: string): Promise<ModuleSpec[]> {
    const config = await this.getTenantConfig(tenantId);
    const moduleSpecs: ModuleSpec[] = [];

    for (const moduleId of config.enabled_modules) {
      try {
        // 这里应该从数据库或文件系统加载模块规范
        // 暂时返回空数组，后续实现
        console.log(`Loading module spec for: ${moduleId}`);
        // const spec = await loadModuleSpec(moduleId);
        // moduleSpecs.push(spec);
      } catch (error) {
        console.warn(`模块 ${moduleId} 规范文件不存在`);
      }
    }

    return moduleSpecs;
  }
}
