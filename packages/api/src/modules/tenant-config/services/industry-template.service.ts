import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantModuleConfig } from '../../../entities/tenant-module-config.entity';
import { ConfigVersioningService } from './config-versioning.service';
import { 
  ApplyIndustryTemplateDto, 
  IndustryTemplateDto, 
  TemplateApplyResultDto 
} from '../dto/industry-template.dto';
import { TemplateManager } from '../../../../../libs/config-schema/template-utils';

@Injectable()
export class IndustryTemplateService {
  constructor(
    @InjectRepository(TenantModuleConfig)
    private configRepository: Repository<TenantModuleConfig>,
    private configVersioningService: ConfigVersioningService,
  ) {}

  /**
   * 获取所有可用的行业模板
   */
  async getAvailableTemplates(): Promise<IndustryTemplateDto[]> {
    const templates = TemplateManager.getAvailableTemplates();
    
    return templates.map(template => ({
      industry: template.industry,
      name: template.name,
      description: template.description,
      config: template.config,
      priority: template.priority.toString(),
    }));
  }

  /**
   * 获取特定行业模板
   */
  async getIndustryTemplate(industry: string): Promise<IndustryTemplateDto | null> {
    const template = TemplateManager.getIndustryTemplate(industry);
    
    if (!template) {
      return null;
    }

    return {
      industry: template.industry,
      name: template.name,
      description: template.description,
      config: template.config,
      priority: template.priority.toString(),
    };
  }

  /**
   * 应用行业模板到租户配置
   */
  async applyIndustryTemplate(
    tenantId: string,
    applyDto: ApplyIndustryTemplateDto
  ): Promise<TemplateApplyResultDto> {
    // 验证行业模板是否存在
    const template = TemplateManager.getIndustryTemplate(applyDto.industry);
    if (!template) {
      throw new NotFoundException(`行业模板 "${applyDto.industry}" 不存在`);
    }

    // 获取当前租户的草稿配置（如果有）
    const currentDraft = await this.configRepository.findOne({
      where: { tenantId, status: 'draft' },
    });

    // 应用模板
    const result = TemplateManager.applyTemplate(
      applyDto.industry,
      currentDraft?.configJson || applyDto.tenantOverrides
    );

    // 保存为草稿
    await this.configVersioningService.saveDraft(tenantId, result.mergedConfig);

    return {
      mergedConfig: result.mergedConfig,
      warnings: result.warnings,
      appliedTemplates: result.appliedTemplates,
    };
  }

  /**
   * 预览模板应用结果（不保存）
   */
  async previewTemplateApplication(
    industry: string,
    tenantOverrides?: Record<string, any>
  ): Promise<TemplateApplyResultDto> {
    const template = TemplateManager.getIndustryTemplate(industry);
    if (!template) {
      throw new NotFoundException(`行业模板 "${industry}" 不存在`);
    }

    const result = TemplateManager.applyTemplate(industry, tenantOverrides);

    return {
      mergedConfig: result.mergedConfig,
      warnings: result.warnings,
      appliedTemplates: result.appliedTemplates,
    };
  }

  /**
   * 验证配置是否符合模板要求
   */
  async validateConfigAgainstTemplate(
    industry: string,
    config: Record<string, any>
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const template = TemplateManager.getIndustryTemplate(industry);
    if (!template) {
      throw new NotFoundException(`行业模板 "${industry}" 不存在`);
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查必需的模块
    const requiredModules = template.config.enabledModules || [];
    const configModules = config.enabledModules || [];
    
    for (const module of requiredModules) {
      if (!configModules.includes(module)) {
        errors.push(`缺少必需的模块: ${module}`);
      }
    }

    // 检查模块配置
    if (template.config.modules) {
      for (const [moduleKey, moduleConfig] of Object.entries(template.config.modules)) {
        if (config.modules && config.modules[moduleKey]) {
          // 检查必需的配置项
          for (const [configKey, expectedValue] of Object.entries(moduleConfig)) {
            if (config.modules[moduleKey][configKey] === undefined) {
              warnings.push(`模块 ${moduleKey} 缺少配置项: ${configKey}`);
            }
          }
        } else {
          warnings.push(`模块 ${moduleKey} 未配置`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
