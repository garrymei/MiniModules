import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindManyOptions } from 'typeorm';
import { ApprovalConfig, ApprovalScope, ApprovalType, ApprovalStatus } from '../entities/approval-config.entity';
import { ApprovalRequest, ApprovalRequestStatus } from '../entities/approval-request.entity';
import { AuditLog } from '../../../entities/audit-log.entity';
import { BusinessException, BusinessErrorCode } from '../../../common/errors/business.exception';

// Interfaces remain the same for DTOs
export interface ApprovalDecision {
  requestId: string;
  approverId: string;
  decision: 'approve' | 'reject';
  comment?: string;
}

@Injectable()
export class ApprovalWorkflowService {
  private readonly logger = new Logger(ApprovalWorkflowService.name);

  constructor(
    @InjectRepository(ApprovalConfig)
    private approvalConfigRepository: Repository<ApprovalConfig>,
    @InjectRepository(ApprovalRequest)
    private approvalRequestRepository: Repository<ApprovalRequest>,
    private dataSource: DataSource,
  ) {}

  async getApprovalConfigs(filter: Partial<ApprovalConfig>): Promise<ApprovalConfig[]> {
      return this.approvalConfigRepository.find({ where: filter });
  }

  async createApprovalRequest(requestDto: Partial<ApprovalRequest>): Promise<ApprovalRequest> {
    const config = await this.findMatchingConfig(requestDto.type, requestDto.scope, requestDto.moduleKey, requestDto.tenantId);
    if (!config || config.status === ApprovalStatus.DISABLED) {
      throw new BadRequestException('Approval is not required or disabled for this operation.');
    }

    const newRequest = this.approvalRequestRepository.create({
        ...requestDto,
        configId: config.id,
        status: ApprovalRequestStatus.PENDING,
        decisions: [],
    });

    return this.approvalRequestRepository.save(newRequest);
  }

  async processApprovalDecision(decisionDto: ApprovalDecision): Promise<ApprovalRequest> {
    const request = await this.approvalRequestRepository.findOne({ 
        where: { id: decisionDto.requestId },
        relations: ['config'] 
    });

    if (!request) {
      throw new NotFoundException(`Approval request with ID ${decisionDto.requestId} not found.`);
    }
    if (request.status !== ApprovalRequestStatus.PENDING) {
        throw new BadRequestException(`This request is already ${request.status} and cannot be processed.`);
    }

    // Add the new decision
    request.decisions.push({
        approverId: decisionDto.approverId,
        decision: decisionDto.decision,
        comment: decisionDto.comment,
        timestamp: new Date(),
    });

    // Check if the workflow is complete
    if (decisionDto.decision === 'reject') {
        request.status = ApprovalRequestStatus.REJECTED;
    } else {
        const approvalCount = request.decisions.filter(d => d.decision === 'approve').length;
        if (approvalCount >= request.config.requiredApprovals) {
            request.status = ApprovalRequestStatus.APPROVED;
        }
    }

    return this.approvalRequestRepository.save(request);
  }

  async updateApprovalConfig(id: string, updates: Partial<ApprovalConfig>, operatorId: string): Promise<ApprovalConfig> {
    const config = await this.approvalConfigRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`Approval config with ID ${id} not found`);
    }
    const updatedConfig = this.approvalConfigRepository.merge(config, updates, { updatedBy: operatorId });
    return this.approvalConfigRepository.save(updatedConfig);
  }

  async toggleApproval(type: ApprovalType, scope: ApprovalScope, enabled: boolean, moduleKey?: string, tenantId?: string, operatorId?: string): Promise<ApprovalConfig> {
    let config = await this.findMatchingConfig(type, scope, moduleKey, tenantId);
    
    if (!config) {
      config = this.approvalConfigRepository.create({
        scope, type, moduleKey, tenantId,
        status: enabled ? ApprovalStatus.ENABLED : ApprovalStatus.DISABLED,
        approvalRoles: ['admin'],
        requiredApprovals: 1,
        createdBy: operatorId || 'system',
      });
    } else {
        config.status = enabled ? ApprovalStatus.ENABLED : ApprovalStatus.DISABLED;
        config.updatedBy = operatorId || 'system';
    }
    
    return this.approvalConfigRepository.save(config);
  }

  async getApprovalStats(type?: ApprovalType, scope?: ApprovalScope, tenantId?: string): Promise<any> {
      const query = { where: {} };
      if (type) query.where['type'] = type;
      if (scope) query.where['scope'] = scope;
      if (tenantId) query.where['tenantId'] = tenantId;

      const [pending, approved, rejected] = await Promise.all([
          this.approvalRequestRepository.count({ ...query, where: { ...query.where, status: ApprovalRequestStatus.PENDING } }),
          this.approvalRequestRepository.count({ ...query, where: { ...query.where, status: ApprovalRequestStatus.APPROVED } }),
          this.approvalRequestRepository.count({ ...query, where: { ...query.where, status: ApprovalRequestStatus.REJECTED } }),
      ]);
      return { pending, approved, rejected, total: pending + approved + rejected };
  }

  private async findMatchingConfig(type: ApprovalType, scope: ApprovalScope, moduleKey?: string, tenantId?: string): Promise<ApprovalConfig | null> {
    const query = this.approvalConfigRepository.createQueryBuilder('config')
      .where('config.type = :type', { type })
      .andWhere('config.scope = :scope', { scope });

    if (moduleKey) query.andWhere('(config.moduleKey = :moduleKey OR config.moduleKey IS NULL)', { moduleKey });
    if (tenantId) query.andWhere('(config.tenantId = :tenantId OR config.tenantId IS NULL)', { tenantId });

    query.orderBy('config.tenantId', 'DESC').addOrderBy('config.moduleKey', 'DESC');

    return query.getOne();
  }
  
  // ... other methods like requiresApproval, setGradualRollout can be further refined ...
}