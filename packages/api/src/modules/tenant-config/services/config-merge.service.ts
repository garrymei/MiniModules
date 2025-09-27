import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantModuleConfig } from '../../../entities/tenant-module-config.entity';
import { ApprovalConfigService } from '../../platform/services/approval-config.service';
import { IndustryTemplateService } from './industry-template.service';
import { BusinessException, BusinessErrorCode } from '../../../common/errors/business.exception';

export interface ConfigLayer {
  type: 'platform' | 'industry' | 'tenant' | 'draft';
  priority: number;
  config: Record<string, any>;
  source: string;
  version?: number;
}

export interface MergedConfig {
  finalConfig: Record<string, any>;
  layers: ConfigLayer[];
  conflicts: Array<{
    path: string;
    values: Array<{ layer: string; value: any }>;
    resolved: any;
  }>;
  warnings: string[];
}

@Injectable()
export class ConfigMergeService {
  private readonly logger = new Logger(ConfigMergeService.name);

  constructor(
    @InjectRepository(TenantModuleConfig)
    private configRepository: Repository<TenantModuleConfig>,
    private approvalConfigService: ApprovalConfigService,
    private industryTemplateService: IndustryTemplateService,
  ) {}

  /**
   * 获取租户的完整配置（多层合并）
   */
  async getMergedTenantConfig(tenantId: string, includeDraft = false): Promise<MergedConfig> {
    const layers: ConfigLayer[] = [];

    try {
      // 1. 平台默认配置（最低优先级）
      const platformConfig = await this.getPlatformDefaultConfig();
      layers.push({
        type: 'platform',
        priority: 1,
        config: platformConfig,
        source: 'platform-defaults',
      });

      // 2. 行业模板配置
      const industryConfig = await this.getIndustryConfig(tenantId);
      if (industryConfig) {
        layers.push({
          type: 'industry',
          priority: 2,
          config: industryConfig.config,
          source: industryConfig.industry,
        });
      }

      // 3. 租户已发布配置
      const publishedConfig = await this.getTenantPublishedConfig(tenantId);
      if (publishedConfig) {
        layers.push({
          type: 'tenant',
          priority: 3,
          config: publishedConfig.configJson,
          source: 'tenant-published',
          version: publishedConfig.version,
        });
      }

      // 4. 租户草稿配置（最高优先级）
      if (includeDraft) {
        const draftConfig = await this.getTenantDraftConfig(tenantId);
        if (draftConfig) {
          layers.push({
            type: 'draft',
            priority: 4,
            config: draftConfig.configJson,
            source: 'tenant-draft',
            version: draftConfig.version,
          });
        }
      }

      // 5. 合并配置
      return this.mergeConfigLayers(layers);
    } catch (error) {
      this.logger.error(`Failed to get merged config for tenant ${tenantId}:`, error);
      throw new BusinessException(
        BusinessErrorCode.CONFIG_NOT_FOUND,
        `Failed to load configuration for tenant ${tenantId}`,
      );
    }
  }

  /**
   * 预览配置合并结果
   */
  async previewConfigMerge(
    tenantId: string,
    draftConfig: Record<string, any>,
  ): Promise<MergedConfig> {
    const layers: ConfigLayer[] = [];

    // 获取基础层
    const platformConfig = await this.getPlatformDefaultConfig();
    layers.push({
      type: 'platform',
      priority: 1,
      config: platformConfig,
      source: 'platform-defaults',
    });

    const industryConfig = await this.getIndustryConfig(tenantId);
    if (industryConfig) {
      layers.push({
        type: 'industry',
        priority: 2,
        config: industryConfig.config,
        source: industryConfig.industry,
      });
    }

    const publishedConfig = await this.getTenantPublishedConfig(tenantId);
    if (publishedConfig) {
      layers.push({
        type: 'tenant',
        priority: 3,
        config: publishedConfig.configJson,
        source: 'tenant-published',
        version: publishedConfig.version,
      });
    }

    // 添加预览的草稿配置
    layers.push({
      type: 'draft',
      priority: 4,
      config: draftConfig,
      source: 'tenant-draft-preview',
    });

    return this.mergeConfigLayers(layers);
  }

  /**
   * 获取平台默认配置
   */
  private async getPlatformDefaultConfig(): Promise<Record<string, any>> {
    // 平台默认配置
    return {
      enabledModules: ['user', 'cms'],
      theme: {
        primaryColor: '#1890ff',
        secondaryColor: '#f0f0f0',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
      modules: {
        user: {
          allowSelfRegistration: true,
          requireEmailVerification: true,
        },
        cms: {
          allowRichText: true,
          maxImageSize: 5242880, // 5MB
        },
      },
      features: {
        multiLanguage: false,
        analytics: false,
        notifications: true,
      },
    };
  }

  /**
   * 获取行业配置
   */
  private async getIndustryConfig(tenantId: string): Promise<{ industry: string; config: Record<string, any> } | null> {
    // 这里应该从租户信息中获取行业类型
    // 简化实现：根据租户ID或其他标识获取行业
    const tenantIndustry = await this.getTenantIndustry(tenantId);
    
    if (!tenantIndustry) {
      return null;
    }

    try {
      const template = await this.industryTemplateService.getIndustryTemplate(tenantIndustry);
      return template ? { industry: tenantIndustry, config: template.config } : null;
    } catch (error) {
      this.logger.warn(`Failed to load industry template for ${tenantIndustry}:`, error);
      return null;
    }
  }

  /**
   * 获取租户行业类型
   */
  private async getTenantIndustry(tenantId: string): Promise<string | null> {
    // 简化实现：从租户配置中获取行业信息
    // 实际应该从租户实体中获取
    const config = await this.configRepository.findOne({
      where: { tenantId, status: 'published' },
      order: { version: 'DESC' },
    });

    return config?.configJson?.industry || null;
  }

  /**
   * 获取租户已发布配置
   */
  private async getTenantPublishedConfig(tenantId: string): Promise<TenantModuleConfig | null> {
    return this.configRepository.findOne({
      where: { tenantId, status: 'published' },
      order: { version: 'DESC' },
    });
  }

  /**
   * 获取租户草稿配置
   */
  private async getTenantDraftConfig(tenantId: string): Promise<TenantModuleConfig | null> {
    return this.configRepository.findOne({
      where: { tenantId, status: 'draft' },
      order: { version: 'DESC' },
    });
  }

  /**
   * 合并配置层
   */
  private mergeConfigLayers(layers: ConfigLayer[]): MergedConfig {
    // 按优先级排序
    const sortedLayers = layers.sort((a, b) => a.priority - b.priority);
    
    let finalConfig: Record<string, any> = {};
    const conflicts: Array<{
      path: string;
      values: Array<{ layer: string; value: any }>;
      resolved: any;
    }> = [];
    const warnings: string[] = [];

    // 逐层合并
    for (const layer of sortedLayers) {
      const { merged, layerConflicts, layerWarnings } = this.deepMergeConfigs(
        finalConfig,
        layer.config,
        layer.source,
      );
      
      finalConfig = merged;
      conflicts.push(...layerConflicts);
      warnings.push(...layerWarnings);
    }

    return {
      finalConfig,
      layers: sortedLayers,
      conflicts,
      warnings,
    };
  }

  /**
   * 深度合并配置对象
   */
  private deepMergeConfigs(
    base: Record<string, any>,
    override: Record<string, any>,
    source: string,
  ): {
    merged: Record<string, any>;
    conflicts: Array<{
      path: string;
      values: Array<{ layer: string; value: any }>;
      resolved: any;
    }>;
    warnings: string[];
  } {
    const merged = { ...base };
    const conflicts: Array<{
      path: string;
      values: Array<{ layer: string; value: any }>;
      resolved: any;
    }> = [];
    const warnings: string[] = [];

    for (const [key, value] of Object.entries(override)) {
      const path = key;
      
      if (merged[key] !== undefined && merged[key] !== value) {
        // 检测冲突
        if (this.isObject(merged[key]) && this.isObject(value)) {
          // 对象类型，递归合并
          const subResult = this.deepMergeConfigs(merged[key], value, source);
          merged[key] = subResult.merged;
          conflicts.push(...subResult.conflicts.map(c => ({
            ...c,
            path: `${path}.${c.path}`,
          })));
          warnings.push(...subResult.warnings);
        } else {
          // 基础类型冲突，使用覆盖值
          conflicts.push({
            path,
            values: [
              { layer: 'base', value: merged[key] },
              { layer: source, value },
            ],
            resolved: value,
          });
          merged[key] = value;
        }
      } else {
        // 无冲突，直接设置
        merged[key] = value;
      }
    }

    return { merged, conflicts, warnings };
  }

  /**
   * 检查是否为对象
   */
  private isObject(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * 验证合并后的配置
   */
  async validateMergedConfig(config: Record<string, any>): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查必需字段
    if (!config.enabledModules || !Array.isArray(config.enabledModules)) {
      errors.push('enabledModules is required and must be an array');
    }

    // 检查模块配置
    if (config.modules) {
      for (const [moduleKey, moduleConfig] of Object.entries(config.modules)) {
        if (typeof moduleConfig !== 'object' || moduleConfig === null) {
          errors.push(`Module ${moduleKey} configuration must be an object`);
        }
      }
    }

    // 检查主题配置
    if (config.theme) {
      if (!config.theme.primaryColor) {
        warnings.push('Theme primary color is not set');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
