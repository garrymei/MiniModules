import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantModuleConfig } from '../../../entities/tenant-module-config.entity';
import { 
  ConfigRevisionDto, 
  ConfigDiffDto, 
  ConfigRevisionListDto,
  SubmitConfigDto,
  ApproveConfigDto,
  RollbackConfigDto,
  ConfigStatus 
} from '../dto/config-versioning.dto';
import * as deepDiff from 'deep-diff';

@Injectable()
export class ConfigVersioningService {
  constructor(
    @InjectRepository(TenantModuleConfig)
    private configRepository: Repository<TenantModuleConfig>,
  ) {}

  async getConfigRevisions(tenantId: string): Promise<ConfigRevisionListDto> {
    const revisions = await this.configRepository.find({
      where: { tenantId },
      order: { version: 'DESC' },
    });

    const currentPublished = revisions.find(r => r.status === ConfigStatus.PUBLISHED);

    return {
      revisions: revisions.map(this.mapToRevisionDto),
      currentPublishedVersion: currentPublished?.version.toString(),
    };
  }

  async saveDraft(tenantId: string, configJson: Record<string, any>): Promise<ConfigRevisionDto> {
    // 查找当前草稿
    let draft = await this.configRepository.findOne({
      where: { tenantId, status: ConfigStatus.DRAFT },
    });

    if (draft) {
      // 更新现有草稿
      draft.configJson = configJson;
      draft.updatedAt = new Date();
    } else {
      // 创建新草稿
      const latestVersion = await this.getLatestVersion(tenantId);
      draft = this.configRepository.create({
        tenantId,
        configJson,
        version: latestVersion + 1,
        status: ConfigStatus.DRAFT,
      });
    }

    const saved = await this.configRepository.save(draft);
    return this.mapToRevisionDto(saved);
  }

  async submitForReview(tenantId: string, submitDto: SubmitConfigDto): Promise<ConfigRevisionDto> {
    const draft = await this.configRepository.findOne({
      where: { tenantId, status: ConfigStatus.DRAFT },
    });

    if (!draft) {
      throw new NotFoundException('No draft configuration found');
    }

    // 验证配置
    await this.validateConfig(draft.configJson);

    draft.status = ConfigStatus.SUBMITTED;
    draft.submittedAt = new Date();
    draft.reviewNote = submitDto.reviewNote;

    const saved = await this.configRepository.save(draft);
    return this.mapToRevisionDto(saved);
  }

  async approveConfig(tenantId: string, approvedBy: string, approveDto: ApproveConfigDto): Promise<ConfigRevisionDto> {
    const submitted = await this.configRepository.findOne({
      where: { tenantId, status: ConfigStatus.SUBMITTED },
    });

    if (!submitted) {
      throw new NotFoundException('No submitted configuration found');
    }

    submitted.status = ConfigStatus.APPROVED;
    submitted.approvedBy = approvedBy;
    submitted.approvedAt = new Date();
    submitted.reviewNote = approveDto.reviewNote;

    const saved = await this.configRepository.save(submitted);
    return this.mapToRevisionDto(saved);
  }

  async publishConfig(tenantId: string): Promise<ConfigRevisionDto> {
    const approved = await this.configRepository.findOne({
      where: { tenantId, status: ConfigStatus.APPROVED },
    });

    if (!approved) {
      throw new NotFoundException('No approved configuration found');
    }

    // 将当前已发布的配置状态改为历史
    await this.configRepository.update(
      { tenantId, status: ConfigStatus.PUBLISHED },
      { status: ConfigStatus.PUBLISHED } // 保持已发布状态，但标记为历史版本
    );

    // 发布新配置
    approved.status = ConfigStatus.PUBLISHED;
    approved.publishedAt = new Date();

    const saved = await this.configRepository.save(approved);
    return this.mapToRevisionDto(saved);
  }

  async rollbackToVersion(tenantId: string, targetVersion: number, reason?: string): Promise<ConfigRevisionDto> {
    const targetConfig = await this.configRepository.findOne({
      where: { tenantId, version: targetVersion },
    });

    if (!targetConfig) {
      throw new NotFoundException(`Configuration version ${targetVersion} not found`);
    }

    // 创建新的回滚版本
    const latestVersion = await this.getLatestVersion(tenantId);
    const rollbackConfig = this.configRepository.create({
      tenantId,
      configJson: targetConfig.configJson,
      version: latestVersion + 1,
      status: ConfigStatus.PUBLISHED,
      publishedAt: new Date(),
      reviewNote: reason ? `Rollback to version ${targetVersion}: ${reason}` : `Rollback to version ${targetVersion}`,
    });

    // 将当前已发布的配置标记为历史
    await this.configRepository.update(
      { tenantId, status: ConfigStatus.PUBLISHED },
      { status: ConfigStatus.PUBLISHED }
    );

    const saved = await this.configRepository.save(rollbackConfig);
    return this.mapToRevisionDto(saved);
  }

  async getConfigDiff(tenantId: string, version1: number, version2: number): Promise<ConfigDiffDto[]> {
    const [config1, config2] = await Promise.all([
      this.configRepository.findOne({ where: { tenantId, version: version1 } }),
      this.configRepository.findOne({ where: { tenantId, version: version2 } }),
    ]);

    if (!config1 || !config2) {
      throw new NotFoundException('One or both configuration versions not found');
    }

    const diff = deepDiff.diff(config1.configJson, config2.configJson);
    if (!diff) return [];

    return diff.map(d => ({
      path: d.path?.join('.') || '',
      operation: this.mapDiffOperation(d.kind),
      oldValue: (d as any).lhs,
      newValue: (d as any).rhs,
    }));
  }

  async getPublishedConfig(tenantId: string): Promise<Record<string, any> | null> {
    const published = await this.configRepository.findOne({
      where: { tenantId, status: ConfigStatus.PUBLISHED },
      order: { publishedAt: 'DESC' },
    });

    return published?.configJson || null;
  }

  private async getLatestVersion(tenantId: string): Promise<number> {
    const latest = await this.configRepository.findOne({
      where: { tenantId },
      order: { version: 'DESC' },
    });

    return latest?.version || 0;
  }

  private async validateConfig(configJson: Record<string, any>): Promise<void> {
    // 这里可以添加JSON Schema验证
    // 暂时只做基本验证
    if (!configJson || typeof configJson !== 'object') {
      throw new BadRequestException('Invalid configuration format');
    }
  }

  private mapDiffOperation(kind: string): 'add' | 'remove' | 'modify' {
    switch (kind) {
      case 'N': return 'add';
      case 'D': return 'remove';
      case 'E': return 'modify';
      default: return 'modify';
    }
  }

  private mapToRevisionDto(config: TenantModuleConfig): ConfigRevisionDto {
    return {
      id: config.id,
      tenantId: config.tenantId,
      configJson: config.configJson,
      version: config.version.toString(),
      status: config.status as ConfigStatus,
      approvedBy: config.approvedBy,
      reviewNote: config.reviewNote,
      submittedAt: config.submittedAt?.toISOString(),
      approvedAt: config.approvedAt?.toISOString(),
      publishedAt: config.publishedAt?.toISOString(),
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    };
  }
}
