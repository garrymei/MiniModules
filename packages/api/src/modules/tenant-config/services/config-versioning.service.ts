import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TenantModuleConfig } from '../../../entities/tenant-module-config.entity';
import { TenantConfigRevision, ConfigRevisionStatus } from '../../../entities/tenant-config-revision.entity';
import { 
  ConfigRevisionDto, 
  ConfigDiffDto, 
  ConfigRevisionListDto,
  SubmitConfigDto,
  ApproveConfigDto,
  RollbackConfigDto,
} from '../dto/config-versioning.dto';
import * as deepDiff from 'deep-diff';

@Injectable()
export class ConfigVersioningService {
  constructor(
    @InjectRepository(TenantModuleConfig)
    private liveConfigRepository: Repository<TenantModuleConfig>,
    @InjectRepository(TenantConfigRevision)
    private revisionRepository: Repository<TenantConfigRevision>,
    private dataSource: DataSource,
  ) {}

  async getConfigRevisions(tenantId: string): Promise<ConfigRevisionListDto> {
    const revisions = await this.revisionRepository.find({
      where: { tenantId },
      order: { version: 'DESC' },
    });

    const liveConfig = await this.liveConfigRepository.findOne({ where: { tenantId } });

    return {
      revisions: revisions.map(this.mapToRevisionDto),
      currentPublishedVersion: liveConfig?.version.toString(),
    };
  }

  async saveDraft(tenantId: string, configJson: Record<string, any>, userId: string): Promise<ConfigRevisionDto> {
    const latestRevision = await this.getLatestRevision(tenantId);
    const latestVersion = latestRevision?.version || 0;

    // Find if there is an existing draft for this user
    let draft = await this.revisionRepository.findOne({
        where: { tenantId, status: ConfigRevisionStatus.DRAFT, submittedBy: userId }
    });

    if (draft) {
        // Update existing draft
        draft.configJson = configJson;
    } else {
        // Create a new draft revision
        draft = this.revisionRepository.create({
            tenantId,
            configJson,
            version: latestVersion + 1, // This is a potential version, will be confirmed on submit
            status: ConfigRevisionStatus.DRAFT,
            submittedBy: userId,
        });
    }

    const saved = await this.revisionRepository.save(draft);
    return this.mapToRevisionDto(saved);
  }

  async submitForReview(tenantId: string, userId: string, submitDto: SubmitConfigDto): Promise<ConfigRevisionDto> {
    const draft = await this.revisionRepository.findOne({
      where: { tenantId, status: ConfigRevisionStatus.DRAFT, submittedBy: userId },
      order: { createdAt: 'DESC' }
    });

    if (!draft) {
      throw new NotFoundException('No draft configuration found to submit.');
    }

    await this.validateConfig(draft.configJson);

    const latestVersion = (await this.getLatestRevision(tenantId))?.version || 0;

    draft.status = ConfigRevisionStatus.SUBMITTED;
    draft.version = latestVersion + 1; // Assign final version number now
    draft.submittedAt = new Date();
    draft.submittedBy = userId;
    draft.changeReason = submitDto.changeReason;

    const saved = await this.revisionRepository.save(draft);
    return this.mapToRevisionDto(saved);
  }

  async approveConfig(revisionId: string, approvedBy: string, approveDto: ApproveConfigDto): Promise<ConfigRevisionDto> {
    const revision = await this.findRevisionById(revisionId);

    if (revision.status !== ConfigRevisionStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted configurations can be approved.');
    }

    revision.status = ConfigRevisionStatus.APPROVED;
    revision.approvedBy = approvedBy;
    revision.approvedAt = new Date();
    revision.reviewNote = approveDto.reviewNote;

    const saved = await this.revisionRepository.save(revision);
    return this.mapToRevisionDto(saved);
  }

  async publishConfig(revisionId: string, publishedBy: string): Promise<ConfigRevisionDto> {
    const revision = await this.findRevisionById(revisionId);

    if (revision.status !== ConfigRevisionStatus.APPROVED) {
      throw new BadRequestException('Only approved configurations can be published.');
    }

    await this.dataSource.transaction(async manager => {
        // Upsert the live configuration
        await manager.upsert(TenantModuleConfig, {
            tenantId: revision.tenantId,
            configJson: revision.configJson,
            version: revision.version,
            publishedAt: new Date(),
            publishedBy: publishedBy,
        }, ['tenantId']);

        // Update the revision status
        revision.status = ConfigRevisionStatus.PUBLISHED;
        revision.publishedAt = new Date();
        await manager.save(revision);
    });

    return this.mapToRevisionDto(revision);
  }

  async rollbackToVersion(tenantId: string, targetVersion: number, userId: string, reason: string): Promise<ConfigRevisionDto> {
    const targetRevision = await this.revisionRepository.findOne({
      where: { tenantId, version: targetVersion, status: ConfigRevisionStatus.PUBLISHED },
    });

    if (!targetRevision) {
      throw new NotFoundException(`Published configuration version ${targetVersion} not found.`);
    }

    // Create a new draft based on the old version's config
    const newDraft = this.revisionRepository.create({
        tenantId,
        configJson: targetRevision.configJson,
        status: ConfigRevisionStatus.DRAFT,
        submittedBy: userId,
        changeReason: reason || `Rollback to version ${targetVersion}`,
    });

    const saved = await this.revisionRepository.save(newDraft);
    return this.mapToRevisionDto(saved);
  }

  async getConfigDiff(tenantId: string, version1: number, version2: number): Promise<ConfigDiffDto[]> {
    const [config1, config2] = await Promise.all([
      this.revisionRepository.findOne({ where: { tenantId, version: version1 } }),
      this.revisionRepository.findOne({ where: { tenantId, version: version2 } }),
    ]);

    if (!config1 || !config2) {
      throw new NotFoundException('One or both configuration versions not found');
    }

    const diffs = deepDiff.diff(config1.configJson, config2.configJson);
    if (!diffs) return [];

    return diffs.map(d => ({
      path: d.path?.join('.') || '',
      operation: this.mapDiffOperation(d.kind),
      oldValue: (d as any).lhs,
      newValue: (d as any).rhs,
    }));
  }

  async getPublishedConfig(tenantId: string): Promise<Record<string, any> | null> {
    const liveConfig = await this.liveConfigRepository.findOne({ where: { tenantId } });
    return liveConfig?.configJson || null;
  }

  private async getLatestRevision(tenantId: string): Promise<TenantConfigRevision | null> {
    return this.revisionRepository.findOne({
      where: { tenantId },
      order: { version: 'DESC' },
    });
  }

  private async findRevisionById(id: string): Promise<TenantConfigRevision> {
      const revision = await this.revisionRepository.findOne({ where: { id } });
      if (!revision) {
          throw new NotFoundException(`Configuration revision with ID ${id} not found`);
      }
      return revision;
  }

  private async validateConfig(configJson: Record<string, any>): Promise<void> {
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

  private mapToRevisionDto(revision: TenantConfigRevision): ConfigRevisionDto {
    return {
      id: revision.id,
      tenantId: revision.tenantId,
      version: revision.version.toString(),
      status: revision.status,
      configJson: revision.configJson,
      changeReason: revision.changeReason,
      submittedBy: revision.submittedBy,
      approvedBy: revision.approvedBy,
      reviewNote: revision.reviewNote,
      submittedAt: revision.submittedAt?.toISOString(),
      approvedAt: revision.approvedAt?.toISOString(),
      publishedAt: revision.publishedAt?.toISOString(),
      createdAt: revision.createdAt.toISOString(),
      updatedAt: revision.updatedAt.toISOString(),
    };
  }
}