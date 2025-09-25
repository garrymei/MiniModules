import { TenantConfigDto } from '../types/tenant-config.dto';

export interface IndustryTemplate {
  industry: string;
  name: string;
  description: string;
  config: Partial<TenantConfigDto>;
  priority: number; // 优先级：数字越大优先级越高
}

export interface TemplateMergeResult {
  mergedConfig: TenantConfigDto;
  warnings: string[];
  appliedTemplates: string[];
}

export class TemplateManager {
  private static templates: IndustryTemplate[] = [
    {
      industry: 'restaurant',
      name: '餐饮行业模板',
      description: '适用于餐厅、咖啡厅等餐饮业务',
      priority: 100,
      config: {
        enabledModules: ['ordering', 'user', 'pay', 'cms'],
        theme: {
          primaryColor: '#FF6A00',
          buttonRadius: 10,
          name: '示例餐厅',
        },
        modules: {
          ordering: {
            mode: 'both',
            specSchema: 'simple',
            minOrderAmount: 0,
            packageFee: 2,
            tableNumberRequired: false,
            showSpicyLevel: true,
            showCalories: false,
          },
        },
        ui: {
          homepageLayout: 'grid-2',
          showSearch: true,
          cardStyle: 'elevated',
          imageAspectRatio: '1:1',
        },
      },
    },
    {
      industry: 'fitness',
      name: '健身行业模板',
      description: '适用于健身房、瑜伽馆等健身业务',
      priority: 100,
      config: {
        enabledModules: ['booking', 'user', 'pay', 'cms'],
        theme: {
          primaryColor: '#4CAF50',
          buttonRadius: 8,
          name: '示例健身房',
        },
        modules: {
          booking: {
            slotMinutes: 60,
            maxBookableDays: 7,
            cancelPolicy: '24h',
            checkinMethod: 'qrcode',
          },
        },
        ui: {
          homepageLayout: 'grid-3',
          showSearch: true,
          cardStyle: 'flat',
          imageAspectRatio: '16:9',
        },
      },
    },
    {
      industry: 'retail',
      name: '零售行业模板',
      description: '适用于电商、零售等业务',
      priority: 100,
      config: {
        enabledModules: ['ecommerce', 'user', 'pay', 'cms'],
        theme: {
          primaryColor: '#2196F3',
          buttonRadius: 6,
          name: '示例商店',
        },
        modules: {
          ecommerce: {
            shippingTemplate: 'standard',
            freeShippingThreshold: 99,
            priceDisplay: 'simple',
            promotion: {
              coupon: true,
              fullReduction: true,
              flashSale: false,
            },
          },
        },
        ui: {
          homepageLayout: 'grid-2',
          showSearch: true,
          cardStyle: 'elevated',
          imageAspectRatio: '1:1',
        },
      },
    },
  ];

  /**
   * 应用行业模板到租户配置
   * 优先级：平台默认 < 行业默认 < 租户模板 < 租户草稿
   */
  static applyTemplate(
    industry: string,
    tenantDraft?: Partial<TenantConfigDto>
  ): TemplateMergeResult {
    const warnings: string[] = [];
    const appliedTemplates: string[] = [];

    // 1. 获取平台默认配置
    const platformDefault = this.getPlatformDefault();
    let mergedConfig = { ...platformDefault };

    // 2. 应用行业模板
    const industryTemplate = this.getIndustryTemplate(industry);
    if (industryTemplate) {
      mergedConfig = this.deepMerge(mergedConfig, industryTemplate.config);
      appliedTemplates.push(industryTemplate.name);
    } else {
      warnings.push(`未找到行业 "${industry}" 的模板，使用平台默认配置`);
    }

    // 3. 应用租户模板（如果有）
    if (tenantDraft) {
      mergedConfig = this.deepMerge(mergedConfig, tenantDraft);
      appliedTemplates.push('租户自定义配置');
    }

    // 4. 验证配置
    const validationWarnings = this.validateConfig(mergedConfig);
    warnings.push(...validationWarnings);

    return {
      mergedConfig: mergedConfig as TenantConfigDto,
      warnings,
      appliedTemplates,
    };
  }

  /**
   * 获取行业模板
   */
  static getIndustryTemplate(industry: string): IndustryTemplate | null {
    return this.templates.find(t => t.industry === industry) || null;
  }

  /**
   * 获取所有可用行业模板
   */
  static getAvailableTemplates(): IndustryTemplate[] {
    return [...this.templates].sort((a, b) => b.priority - a.priority);
  }

  /**
   * 获取平台默认配置
   */
  private static getPlatformDefault(): Partial<TenantConfigDto> {
    return {
      enabledModules: ['user'],
      theme: {
        primaryColor: '#1890ff',
        buttonRadius: 6,
        name: '默认租户',
      },
      ui: {
        homepageLayout: 'grid-2',
        showSearch: false,
        cardStyle: 'flat',
        imageAspectRatio: '1:1',
      },
    };
  }

  /**
   * 深度合并对象
   */
  private static deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (
          typeof source[key] === 'object' &&
          source[key] !== null &&
          !Array.isArray(source[key]) &&
          typeof result[key] === 'object' &&
          result[key] !== null &&
          !Array.isArray(result[key])
        ) {
          result[key] = this.deepMerge(result[key], source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  }

  /**
   * 验证配置
   */
  private static validateConfig(config: any): string[] {
    const warnings: string[] = [];

    // 验证主题颜色格式
    if (config.theme?.primaryColor && !/^#[0-9A-Fa-f]{6}$/.test(config.theme.primaryColor)) {
      warnings.push('主题主色调格式不正确，应为 #RRGGBB 格式');
    }

    // 验证按钮圆角范围
    if (config.theme?.buttonRadius && (config.theme.buttonRadius < 0 || config.theme.buttonRadius > 20)) {
      warnings.push('按钮圆角应在 0-20 之间');
    }

    // 验证启用的模块
    if (config.enabledModules && !Array.isArray(config.enabledModules)) {
      warnings.push('enabledModules 应为数组格式');
    }

    return warnings;
  }
}
