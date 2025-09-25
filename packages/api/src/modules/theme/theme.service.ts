import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantModuleConfig } from '../../entities/tenant-module-config.entity';
import { ConfigVersioningService } from '../tenant-config/services/config-versioning.service';

@Injectable()
export class ThemeService {
  constructor(
    @InjectRepository(TenantModuleConfig)
    private configRepository: Repository<TenantModuleConfig>,
    private configVersioningService: ConfigVersioningService,
  ) {}

  async getThemePreview(tenantId: string): Promise<any> {
    // 获取草稿配置作为预览
    const draft = await this.configRepository.findOne({
      where: { tenantId, status: 'draft' },
    });

    if (!draft) {
      throw new NotFoundException('No draft configuration found');
    }

    return this.extractThemeConfig(draft.configJson);
  }

  async updateThemePreview(tenantId: string, themeConfig: any): Promise<any> {
    // 获取或创建草稿配置
    let draft = await this.configRepository.findOne({
      where: { tenantId, status: 'draft' },
    });

    if (!draft) {
      // 创建新草稿
      const latestVersion = await this.getLatestVersion(tenantId);
      draft = this.configRepository.create({
        tenantId,
        configJson: {},
        version: latestVersion + 1,
        status: 'draft',
      });
    }

    // 更新主题配置
    draft.configJson = {
      ...draft.configJson,
      theme: themeConfig,
    };

    const saved = await this.configRepository.save(draft);
    return this.extractThemeConfig(saved.configJson);
  }

  async syncThemeToMobile(tenantId: string): Promise<any> {
    // 发布主题配置到生产环境
    const draft = await this.configRepository.findOne({
      where: { tenantId, status: 'draft' },
    });

    if (!draft) {
      throw new NotFoundException('No draft configuration found');
    }

    // 发布配置
    await this.configVersioningService.publishConfig(tenantId);
    
    return {
      success: true,
      message: '主题已同步到移动端',
      theme: this.extractThemeConfig(draft.configJson),
    };
  }

  async getPublishedTheme(tenantId: string): Promise<any> {
    const published = await this.configRepository.findOne({
      where: { tenantId, status: 'published' },
      order: { publishedAt: 'DESC' },
    });

    if (!published) {
      return this.getDefaultTheme();
    }

    return this.extractThemeConfig(published.configJson);
  }

  private extractThemeConfig(config: any): any {
    return {
      primaryColor: config.theme?.primaryColor || '#1890ff',
      buttonRadius: config.theme?.buttonRadius || 6,
      logo: config.theme?.logo || '',
      name: config.theme?.name || '默认租户',
      // 生成CSS变量
      cssVariables: this.generateCSSVariables(config.theme || {}),
    };
  }

  private generateCSSVariables(theme: any): Record<string, string> {
    return {
      '--color-primary': theme.primaryColor || '#1890ff',
      '--radius-md': `${theme.buttonRadius || 6}px`,
      '--logo-url': theme.logo ? `url(${theme.logo})` : 'none',
    };
  }

  private getDefaultTheme(): any {
    return {
      primaryColor: '#1890ff',
      buttonRadius: 6,
      logo: '',
      name: '默认租户',
      cssVariables: {
        '--color-primary': '#1890ff',
        '--radius-md': '6px',
        '--logo-url': 'none',
      },
    };
  }

  private async getLatestVersion(tenantId: string): Promise<number> {
    const latest = await this.configRepository.findOne({
      where: { tenantId },
      order: { version: 'DESC' },
    });

    return latest?.version || 0;
  }
}
