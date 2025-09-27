import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { diff as diffObjects, Diff } from 'deep-diff';
import { TenantModuleConfig } from '../../entities/tenant-module-config.entity';
import {
  TenantConfigDto,
  UpdateTenantConfigDto,
  ConfigHistoryDto,
  WorkflowNoteDto,
  ApproveConfigDto,
  ConfigDiffResponseDto,
  ConfigDiffItemDto,
} from './dto/tenant-config.dto';
import { ModuleSpecService } from '../platform/module-spec.service';
import { ModuleDependencyService } from '../platform/module-dependency.service';
import { ConfigMergeService } from './services/config-merge.service';
import { Audit, AUDIT_ACTIONS } from '../../common/decorators/audit.decorator';
import { CacheService } from '../../common/services/cache.service';
import { Cacheable } from '../../common/decorators/cache.decorator';

@Injectable()
export class TenantConfigService {
  constructor(
    @InjectRepository(TenantModuleConfig)
    private tenantModuleConfigRepository: Repository<TenantModuleConfig>,
    private moduleSpecService: ModuleSpecService,
    private moduleDependencyService: ModuleDependencyService,
    private configMergeService: ConfigMergeService,
    private cacheService: CacheService,
  ) {}

  async onModuleInit() {
    // 初始化时加载所有模块规范
    this.moduleSpecService.loadAllModuleSpecs();
  }

  @Cacheable({
    key: 'tenant-config',
    ttl: 300, // 5分钟缓存
    useTenant: true,
    useParams: true,
  })
  async getTenantConfig(tenantId: string, includeDraft = false): Promise<TenantConfigDto> {
    // 使用配置合并服务获取完整配置
    const mergedConfig = await this.configMergeService.getMergedTenantConfig(tenantId, includeDraft);
    
    return {
      tenantId,
      config: mergedConfig.finalConfig,
      version: mergedConfig.layers.find(l => l.type === 'tenant')?.version || 1,
      status: includeDraft && mergedConfig.layers.find(l => l.type === 'draft') ? 'draft' : 'published',
      layers: mergedConfig.layers,
      conflicts: mergedConfig.conflicts,
      warnings: mergedConfig.warnings,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  @Audit({
    action: AUDIT_ACTIONS.UPDATE,
    resourceType: 'CONFIG',
    description: '更新租户配置',
    includeRequestData: true,
    sensitiveFields: ['password', 'secret', 'apiKey'],
  })
  async updateTenantConfig(tenantId: string, configDto: UpdateTenantConfigDto): Promise<TenantConfigDto> {
    // 验证启用的模块是否有效
    for (const moduleId of configDto.enabledModules) {
      try {
        this.moduleSpecService.getModuleSpec(moduleId);
      } catch (error) {
        throw new BadRequestException(`Invalid module: ${moduleId}`);
      }
    }

    // 检查模块依赖
    const dependencyCheck = this.moduleDependencyService.checkDependencies(configDto.enabledModules);
    if (!dependencyCheck.valid) {
      throw new BadRequestException(`Module dependency check failed: ${dependencyCheck.errors?.join(', ')}`);
    }

    // 验证每个模块的配置
    for (const [key, value] of Object.entries(configDto)) {
      // 跳过非对象类型的配置（如enabledModules、theme等）
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // 检查这个键是否是模块ID
        if (configDto.enabledModules.includes(key)) {
          const validationResult = this.moduleSpecService.validateModuleConfig(key, value);
          if (!validationResult.isValid) {
            throw new BadRequestException(`Invalid configuration for module ${key}: ${validationResult.errors?.join(', ')}`);
          }
        }
      }
    }

    // 获取当前版本
    const currentConfig = await this.tenantModuleConfigRepository.findOne({
      where: { tenantId },
      order: { version: 'DESC' }
    });

    const newVersion = currentConfig ? currentConfig.version + 1 : 1;

    // 创建新配置记录
    const newConfig = this.tenantModuleConfigRepository.create({
      tenantId,
      configJson: configDto,
      version: newVersion,
      status: 'draft',
    });

    const saved = await this.tenantModuleConfigRepository.save(newConfig);

    // 清除相关缓存
    await this.cacheService.delPattern(`tenant-config:${tenantId}:*`);

    return this.hydrateConfig(saved);
  }

  async publishTenantConfig(tenantId: string, version: number): Promise<TenantConfigDto> {
    const config = await this.getConfigOrFail(tenantId, version);

    await this.tenantModuleConfigRepository.update(
      { tenantId, status: 'published', version: Not(version) },
      { status: 'approved' },
    );

    config.status = 'published';
    config.publishedAt = new Date();
    config.approvedAt = config.approvedAt ?? new Date();
    config.updatedAt = new Date();
    const saved = await this.tenantModuleConfigRepository.save(config);

    return this.hydrateConfig(saved);
  }

  async getTenantConfigHistory(tenantId: string): Promise<ConfigHistoryDto[]> {
    const configs = await this.tenantModuleConfigRepository.find({
      where: { tenantId },
      order: { version: 'DESC' },
    });

    return configs.map((config) => ({
      version: config.version,
      status: config.status,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
      submittedAt: config.submittedAt?.toISOString(),
      approvedAt: config.approvedAt?.toISOString(),
      publishedAt: config.publishedAt?.toISOString(),
      config: this.hydrateConfig(config),
    }));
  }

  async submitTenantConfig(tenantId: string, dto: WorkflowNoteDto): Promise<TenantConfigDto> {
    const config = await this.getConfigOrFail(tenantId, dto.version);

    if (config.status !== 'draft' && config.status !== 'rejected') {
      throw new BadRequestException('Only draft or rejected configs can be submitted');
    }

    config.status = 'submitted';
    config.submittedAt = new Date();
    config.reviewNote = dto.note;
    config.updatedAt = new Date();
    const saved = await this.tenantModuleConfigRepository.save(config);

    return this.hydrateConfig(saved);
  }

  async approveTenantConfig(tenantId: string, dto: ApproveConfigDto, reviewerId?: string): Promise<TenantConfigDto> {
    const config = await this.getConfigOrFail(tenantId, dto.version);

    if (config.status !== 'submitted') {
      throw new BadRequestException('Only submitted configs can be approved');
    }

    config.status = 'approved';
    config.approvedAt = new Date();
    config.approvedBy = reviewerId ?? null;
    config.reviewNote = dto.note;
    config.updatedAt = new Date();
    const saved = await this.tenantModuleConfigRepository.save(config);

    if (dto.publish) {
      return this.publishTenantConfig(tenantId, dto.version);
    }

    return this.hydrateConfig(saved);
  }

  async rollbackTenantConfig(tenantId: string, targetVersion: number, note?: string): Promise<TenantConfigDto> {
    const origin = await this.getConfigOrFail(tenantId, targetVersion);

    if (origin.status !== 'published' && origin.status !== 'approved') {
      throw new BadRequestException('Only approved or published versions can be rolled back');
    }

    const latest = await this.tenantModuleConfigRepository.findOne({
      where: { tenantId },
      order: { version: 'DESC' },
    });

    const nextVersion = latest ? latest.version + 1 : targetVersion + 1;

    const rollbackConfig = this.tenantModuleConfigRepository.create({
      tenantId,
      configJson: origin.configJson,
      version: nextVersion,
      status: 'draft',
      reviewNote: note ? `${note} (rollback from v${targetVersion})` : `Rollback from version ${targetVersion}`,
    });

    const saved = await this.tenantModuleConfigRepository.save(rollbackConfig);

    return this.hydrateConfig(saved);
  }

  async getConfigDiff(tenantId: string, fromVersion: number, toVersion: number): Promise<ConfigDiffResponseDto> {
    if (fromVersion === toVersion) {
      return { fromVersion, toVersion, diffs: [] };
    }

    const fromConfig = await this.getConfigOrFail(tenantId, fromVersion);
    const toConfig = await this.getConfigOrFail(tenantId, toVersion);

    const differences = diffObjects(fromConfig.configJson, toConfig.configJson) || [];
    const normalized = this.normalizeDiffs(differences);

    return {
      fromVersion,
      toVersion,
      diffs: normalized,
    };
  }

  async getTenantConfigMeta(tenantId: string) {
    const config = await this.tenantModuleConfigRepository.findOne({
      where: { tenantId, status: 'published' },
      order: { version: 'DESC' },
      select: ['version', 'updatedAt', 'status', 'publishedAt'],
    });

    if (!config) {
      throw new NotFoundException(`Published tenant config not found for tenant: ${tenantId}`);
    }

    return {
      tenantId,
      version: config.version,
      status: config.status,
      updatedAt: (config.publishedAt || config.updatedAt).toISOString(),
    };
  }

  private hydrateConfig(config: TenantModuleConfig): TenantConfigDto {
    const payload = config.configJson as TenantConfigDto;
    return {
      ...payload,
      version: config.version,
      status: config.status,
      updatedAt: config.updatedAt.toISOString(),
    };
  }

  private async getConfigOrFail(tenantId: string, version: number): Promise<TenantModuleConfig> {
    const config = await this.tenantModuleConfigRepository.findOne({
      where: { tenantId, version },
    });

    if (!config) {
      throw new NotFoundException(`Tenant config not found for tenant: ${tenantId}, version: ${version}`);
    }

    return config;
  }

  private normalizeDiffs(differences: Diff<any, any>[]): ConfigDiffItemDto[] {
    return differences.map((item) => ({
      path: (item.path || []).join('.'),
      kind: item.kind,
      lhs: (item as any).lhs,
      rhs: (item as any).rhs,
    }));
  }
}
