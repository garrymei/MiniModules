import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AuditLog, AuditAction, AuditResourceType, AuditResult } from '../../entities/audit-log.entity';

export interface CreateAuditLogDto {
  tenantId?: string;
  userId?: string;
  userEmail?: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  resourceName?: string;
  description?: string;
  oldValues?: any;
  newValues?: any;
  result?: AuditResult;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  metadata?: any;
}

export interface AuditLogQuery {
  tenantId?: string;
  userId?: string;
  action?: AuditAction;
  resourceType?: AuditResourceType;
  resourceId?: string;
  result?: AuditResult;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * 记录审计日志
   */
  async log(auditData: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(auditData);
    return this.auditLogRepository.save(auditLog);
  }

  /**
   * 查询审计日志
   */
  async findAuditLogs(query: AuditLogQuery): Promise<{
    logs: AuditLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      tenantId,
      userId,
      action,
      resourceType,
      resourceId,
      result,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = query;

    const where: any = {};

    if (tenantId) where.tenantId = tenantId;
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;
    if (resourceId) where.resourceId = resourceId;
    if (result) where.result = result;

    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }

    const [logs, total] = await this.auditLogRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      logs,
      total,
      page,
      limit,
    };
  }

  /**
   * 获取审计日志统计
   */
  async getAuditStats(
    tenantId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalLogs: number;
    actionStats: Record<AuditAction, number>;
    resourceStats: Record<AuditResourceType, number>;
    resultStats: Record<AuditResult, number>;
    dailyStats: Array<{ date: string; count: number }>;
  }> {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }

    const logs = await this.auditLogRepository.find({
      where,
      select: ['action', 'resourceType', 'result', 'createdAt'],
    });

    // 统计各种指标
    const actionStats = {} as Record<AuditAction, number>;
    const resourceStats = {} as Record<AuditResourceType, number>;
    const resultStats = {} as Record<AuditResult, number>;
    const dailyStatsMap = new Map<string, number>();

    for (const log of logs) {
      // 动作统计
      actionStats[log.action] = (actionStats[log.action] || 0) + 1;
      
      // 资源类型统计
      resourceStats[log.resourceType] = (resourceStats[log.resourceType] || 0) + 1;
      
      // 结果统计
      resultStats[log.result] = (resultStats[log.result] || 0) + 1;
      
      // 每日统计
      const date = log.createdAt.toISOString().split('T')[0];
      dailyStatsMap.set(date, (dailyStatsMap.get(date) || 0) + 1);
    }

    const dailyStats = Array.from(dailyStatsMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalLogs: logs.length,
      actionStats,
      resourceStats,
      resultStats,
      dailyStats,
    };
  }

  /**
   * 获取用户活动日志
   */
  async getUserActivity(
    userId: string,
    limit: number = 50
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * 获取资源变更历史
   */
  async getResourceHistory(
    resourceType: AuditResourceType,
    resourceId: string,
    limit: number = 50
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { resourceType, resourceId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * 清理旧日志
   */
  async cleanupOldLogs(olderThanDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.auditLogRepository.delete({
      createdAt: Between(new Date('1970-01-01'), cutoffDate),
    });

    return result.affected || 0;
  }

  /**
   * 导出审计日志
   */
  async exportAuditLogs(query: AuditLogQuery): Promise<AuditLog[]> {
    const { logs } = await this.findAuditLogs({
      ...query,
      limit: 10000, // 导出时增加限制
    });
    return logs;
  }
}
