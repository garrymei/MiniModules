import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TenantEntitlement } from '../../../entities/tenant-entitlement.entity';
import { AuditLog, AuditAction, AuditResourceType } from '../../../entities/audit-log.entity';
import { BatchEntitlementsDto, BatchOperationType, BatchEntitlementsResult } from '../dto/batch-entitlements.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BatchEntitlementsService {
  private readonly logger = new Logger(BatchEntitlementsService.name);

  constructor(
    @InjectRepository(TenantEntitlement)
    private tenantEntitlementRepository: Repository<TenantEntitlement>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private dataSource: DataSource,
  ) {}

  /**
   * 批量授权操作
   */
  async batchEntitlements(
    batchDto: BatchEntitlementsDto,
    operatorId: string,
  ): Promise<BatchEntitlementsResult> {
    const operationId = uuidv4();
    const failures: Array<{ tenantId: string; moduleKey: string; error: string }> = [];
    let successCount = 0;

    this.logger.log(`Starting batch entitlements operation ${operationId}: ${batchDto.operation}`);

    // 使用事务处理批量操作
    await this.dataSource.transaction(async (manager) => {
      for (const item of batchDto.items) {
        try {
          switch (batchDto.operation) {
            case BatchOperationType.GRANT:
              await this.grantEntitlement(manager, item, operatorId, operationId);
              break;
            case BatchOperationType.REVOKE:
              await this.revokeEntitlement(manager, item, operatorId, operationId);
              break;
            case BatchOperationType.UPDATE:
              await this.updateEntitlement(manager, item, operatorId, operationId);
              break;
          }
          successCount++;
        } catch (error) {
          this.logger.error(`Failed to process entitlement for tenant ${item.tenantId}, module ${item.moduleKey}:`, error);
          failures.push({
            tenantId: item.tenantId,
            moduleKey: item.moduleKey,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    });

    const result: BatchEntitlementsResult = {
      successCount,
      failureCount: failures.length,
      failures,
      operationId,
    };

    // 记录批量操作审计日志
    await this.auditLogRepository.save({
      action: AuditAction.UPDATE,
      resourceType: AuditResourceType.ENTITLEMENT,
      resourceId: operationId,
      resourceName: 'Batch Entitlements Operation',
      description: `Batch ${batchDto.operation} entitlements: ${successCount} success, ${failures.length} failures`,
      newValues: {
        operation: batchDto.operation,
        totalItems: batchDto.items.length,
        successCount,
        failureCount: failures.length,
        remark: batchDto.remark,
      },
      userId: operatorId,
      result: failures.length === 0 ? 'success' : 'partial',
    });

    this.logger.log(`Batch entitlements operation ${operationId} completed: ${successCount} success, ${failures.length} failures`);
    return result;
  }

  /**
   * 授权模块
   */
  private async grantEntitlement(
    manager: any,
    item: any,
    operatorId: string,
    operationId: string,
  ): Promise<void> {
    // 检查是否已存在
    const existing = await manager.findOne(TenantEntitlement, {
      where: { tenantId: item.tenantId, moduleKey: item.moduleKey },
    });

    if (existing) {
      // 更新现有授权
      await manager.update(TenantEntitlement, { id: existing.id }, {
        status: item.status,
        expiresAt: item.expiresAt ? new Date(item.expiresAt) : null,
        updatedAt: new Date(),
      });
    } else {
      // 创建新授权
      const entitlement = manager.create(TenantEntitlement, {
        tenantId: item.tenantId,
        moduleKey: item.moduleKey,
        status: item.status,
        expiresAt: item.expiresAt ? new Date(item.expiresAt) : null,
      });
      await manager.save(entitlement);
    }

    // 记录单个授权审计日志
    await manager.save(AuditLog, {
      action: AuditAction.GRANT,
      resourceType: AuditResourceType.ENTITLEMENT,
      resourceId: item.tenantId,
      resourceName: `Module ${item.moduleKey} for Tenant ${item.tenantId}`,
      description: `Granted module ${item.moduleKey} to tenant ${item.tenantId}`,
      newValues: {
        moduleKey: item.moduleKey,
        status: item.status,
        expiresAt: item.expiresAt,
        operationId,
      },
      userId: operatorId,
      result: 'success',
    });
  }

  /**
   * 撤销授权
   */
  private async revokeEntitlement(
    manager: any,
    item: any,
    operatorId: string,
    operationId: string,
  ): Promise<void> {
    const result = await manager.delete(TenantEntitlement, {
      tenantId: item.tenantId,
      moduleKey: item.moduleKey,
    });

    if (result.affected === 0) {
      throw new Error(`Entitlement not found for tenant ${item.tenantId} and module ${item.moduleKey}`);
    }

    // 记录撤销审计日志
    await manager.save(AuditLog, {
      action: AuditAction.REVOKE,
      resourceType: AuditResourceType.ENTITLEMENT,
      resourceId: item.tenantId,
      resourceName: `Module ${item.moduleKey} for Tenant ${item.tenantId}`,
      description: `Revoked module ${item.moduleKey} from tenant ${item.tenantId}`,
      oldValues: {
        moduleKey: item.moduleKey,
        status: 'active',
      },
      userId: operatorId,
      result: 'success',
    });
  }

  /**
   * 更新授权
   */
  private async updateEntitlement(
    manager: any,
    item: any,
    operatorId: string,
    operationId: string,
  ): Promise<void> {
    const existing = await manager.findOne(TenantEntitlement, {
      where: { tenantId: item.tenantId, moduleKey: item.moduleKey },
    });

    if (!existing) {
      throw new Error(`Entitlement not found for tenant ${item.tenantId} and module ${item.moduleKey}`);
    }

    const oldValues = {
      status: existing.status,
      expiresAt: existing.expiresAt,
    };

    await manager.update(TenantEntitlement, { id: existing.id }, {
      status: item.status,
      expiresAt: item.expiresAt ? new Date(item.expiresAt) : null,
      updatedAt: new Date(),
    });

    // 记录更新审计日志
    await manager.save(AuditLog, {
      action: AuditAction.UPDATE,
      resourceType: AuditResourceType.ENTITLEMENT,
      resourceId: item.tenantId,
      resourceName: `Module ${item.moduleKey} for Tenant ${item.tenantId}`,
      description: `Updated module ${item.moduleKey} entitlement for tenant ${item.tenantId}`,
      oldValues,
      newValues: {
        moduleKey: item.moduleKey,
        status: item.status,
        expiresAt: item.expiresAt,
        operationId,
      },
      userId: operatorId,
      result: 'success',
    });
  }

  /**
   * 获取批量操作历史
   */
  async getBatchOperationHistory(
    limit: number = 20,
    offset: number = 0,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: {
        resourceType: AuditResourceType.ENTITLEMENT,
        resourceName: 'Batch Entitlements Operation',
      },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * 获取批量操作详情
   */
  async getBatchOperationDetails(operationId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: {
        newValues: { operationId } as any,
      },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 批量授权模板
   */
  async applyEntitlementTemplate(
    templateId: string,
    tenantIds: string[],
    operatorId: string,
    options?: {
      overwriteExisting?: boolean;
      expiresAt?: Date;
      customModules?: Array<{ moduleKey: string; status: string; expiresAt?: Date }>;
    }
  ): Promise<BatchEntitlementsResult> {
    // 预定义的授权模板
    const templates: Record<string, Array<{ moduleKey: string; status: string; expiresAt?: string }>> = {
      'restaurant_basic': [
        { moduleKey: 'ordering', status: 'active' },
        { moduleKey: 'user', status: 'active' },
        { moduleKey: 'cms', status: 'active' },
      ],
      'restaurant_premium': [
        { moduleKey: 'ordering', status: 'active' },
        { moduleKey: 'booking', status: 'active' },
        { moduleKey: 'user', status: 'active' },
        { moduleKey: 'cms', status: 'active' },
        { moduleKey: 'notify', status: 'active' },
      ],
      'fitness_basic': [
        { moduleKey: 'booking', status: 'active' },
        { moduleKey: 'user', status: 'active' },
        { moduleKey: 'cms', status: 'active' },
      ],
      'fitness_premium': [
        { moduleKey: 'booking', status: 'active' },
        { moduleKey: 'ordering', status: 'active' },
        { moduleKey: 'user', status: 'active' },
        { moduleKey: 'cms', status: 'active' },
        { moduleKey: 'notify', status: 'active' },
      ],
      'ecommerce_basic': [
        { moduleKey: 'ordering', status: 'active' },
        { moduleKey: 'user', status: 'active' },
        { moduleKey: 'cms', status: 'active' },
        { moduleKey: 'inventory', status: 'active' },
      ],
      'ecommerce_premium': [
        { moduleKey: 'ordering', status: 'active' },
        { moduleKey: 'booking', status: 'active' },
        { moduleKey: 'user', status: 'active' },
        { moduleKey: 'cms', status: 'active' },
        { moduleKey: 'notify', status: 'active' },
        { moduleKey: 'inventory', status: 'active' },
        { moduleKey: 'analytics', status: 'active' },
      ],
    };

    const template = templates[templateId];
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // 使用自定义模块或模板模块
    const modulesToApply = options?.customModules || template.map(m => ({
      moduleKey: m.moduleKey,
      status: m.status,
      expiresAt: options?.expiresAt || (m.expiresAt ? new Date(m.expiresAt) : undefined),
    }));

    const items = tenantIds.flatMap(tenantId =>
      modulesToApply.map(module => ({
        tenantId,
        moduleKey: module.moduleKey,
        status: module.status,
        expiresAt: module.expiresAt,
      }))
    );

    const batchDto: BatchEntitlementsDto = {
      operation: options?.overwriteExisting ? BatchOperationType.REPLACE : BatchOperationType.GRANT,
      items,
      remark: `Applied template ${templateId} to ${tenantIds.length} tenants`,
    };

    return this.batchEntitlements(batchDto, operatorId);
  }

  /**
   * 批量移除授权
   */
  async batchRevokeEntitlements(
    tenantIds: string[],
    moduleKeys: string[],
    operatorId: string,
    reason?: string,
  ): Promise<BatchEntitlementsResult> {
    const items = tenantIds.flatMap(tenantId =>
      moduleKeys.map(moduleKey => ({
        tenantId,
        moduleKey,
        status: 'revoked',
      }))
    );

    const batchDto: BatchEntitlementsDto = {
      operation: BatchOperationType.REVOKE,
      items,
      remark: reason || `Revoked modules ${moduleKeys.join(', ')} from ${tenantIds.length} tenants`,
    };

    return this.batchEntitlements(batchDto, operatorId);
  }

  /**
   * 批量更新授权状态
   */
  async batchUpdateEntitlementStatus(
    tenantIds: string[],
    moduleKeys: string[],
    newStatus: 'active' | 'suspended' | 'expired',
    operatorId: string,
    reason?: string,
  ): Promise<BatchEntitlementsResult> {
    const items = tenantIds.flatMap(tenantId =>
      moduleKeys.map(moduleKey => ({
        tenantId,
        moduleKey,
        status: newStatus,
      }))
    );

    const batchDto: BatchEntitlementsDto = {
      operation: BatchOperationType.UPDATE,
      items,
      remark: reason || `Updated status to ${newStatus} for modules ${moduleKeys.join(', ')} on ${tenantIds.length} tenants`,
    };

    return this.batchEntitlements(batchDto, operatorId);
  }

  /**
   * 批量设置授权过期时间
   */
  async batchSetExpiration(
    tenantIds: string[],
    moduleKeys: string[],
    expiresAt: Date,
    operatorId: string,
    reason?: string,
  ): Promise<BatchEntitlementsResult> {
    const items = tenantIds.flatMap(tenantId =>
      moduleKeys.map(moduleKey => ({
        tenantId,
        moduleKey,
        status: 'active',
        expiresAt,
      }))
    );

    const batchDto: BatchEntitlementsDto = {
      operation: BatchOperationType.UPDATE,
      items,
      remark: reason || `Set expiration to ${expiresAt.toISOString()} for modules ${moduleKeys.join(', ')} on ${tenantIds.length} tenants`,
    };

    return this.batchEntitlements(batchDto, operatorId);
  }

  /**
   * 获取可用的授权模板
   */
  async getAvailableTemplates(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    modules: Array<{ moduleKey: string; status: string; expiresAt?: string }>;
    industry: string;
    tier: 'basic' | 'premium' | 'enterprise';
  }>> {
    return [
      {
        id: 'restaurant_basic',
        name: 'Restaurant Basic',
        description: 'Basic restaurant management modules',
        modules: [
          { moduleKey: 'ordering', status: 'active' },
          { moduleKey: 'user', status: 'active' },
          { moduleKey: 'cms', status: 'active' },
        ],
        industry: 'restaurant',
        tier: 'basic',
      },
      {
        id: 'restaurant_premium',
        name: 'Restaurant Premium',
        description: 'Premium restaurant management with booking and notifications',
        modules: [
          { moduleKey: 'ordering', status: 'active' },
          { moduleKey: 'booking', status: 'active' },
          { moduleKey: 'user', status: 'active' },
          { moduleKey: 'cms', status: 'active' },
          { moduleKey: 'notify', status: 'active' },
        ],
        industry: 'restaurant',
        tier: 'premium',
      },
      {
        id: 'fitness_basic',
        name: 'Fitness Basic',
        description: 'Basic fitness center management',
        modules: [
          { moduleKey: 'booking', status: 'active' },
          { moduleKey: 'user', status: 'active' },
          { moduleKey: 'cms', status: 'active' },
        ],
        industry: 'fitness',
        tier: 'basic',
      },
      {
        id: 'fitness_premium',
        name: 'Fitness Premium',
        description: 'Premium fitness center with ordering and notifications',
        modules: [
          { moduleKey: 'booking', status: 'active' },
          { moduleKey: 'ordering', status: 'active' },
          { moduleKey: 'user', status: 'active' },
          { moduleKey: 'cms', status: 'active' },
          { moduleKey: 'notify', status: 'active' },
        ],
        industry: 'fitness',
        tier: 'premium',
      },
      {
        id: 'ecommerce_basic',
        name: 'E-commerce Basic',
        description: 'Basic e-commerce platform',
        modules: [
          { moduleKey: 'ordering', status: 'active' },
          { moduleKey: 'user', status: 'active' },
          { moduleKey: 'cms', status: 'active' },
          { moduleKey: 'inventory', status: 'active' },
        ],
        industry: 'ecommerce',
        tier: 'basic',
      },
      {
        id: 'ecommerce_premium',
        name: 'E-commerce Premium',
        description: 'Premium e-commerce with analytics and advanced features',
        modules: [
          { moduleKey: 'ordering', status: 'active' },
          { moduleKey: 'booking', status: 'active' },
          { moduleKey: 'user', status: 'active' },
          { moduleKey: 'cms', status: 'active' },
          { moduleKey: 'notify', status: 'active' },
          { moduleKey: 'inventory', status: 'active' },
          { moduleKey: 'analytics', status: 'active' },
        ],
        industry: 'ecommerce',
        tier: 'premium',
      },
    ];
  }
}
