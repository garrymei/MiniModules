import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AuditLog, AuditAction, AuditResourceType, AuditResult } from '../../entities/audit-log.entity';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

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
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * 记录审计日志
   */
  async log(auditData: CreateAuditLogDto, request?: Request): Promise<AuditLog> {
    // 确保requestId一致性
    const requestId = this.getRequestId(auditData.requestId, request);
    
    const auditLogData = {
      ...auditData,
      requestId,
      // 从请求中获取额外信息
      ipAddress: auditData.ipAddress || this.getClientIp(request),
      userAgent: auditData.userAgent || this.getUserAgent(request),
    };

    const auditLog = this.auditLogRepository.create(auditLogData);
    const savedLog = await this.auditLogRepository.save(auditLog);
    
    this.logger.debug(`Audit log created: ${savedLog.id} for request ${requestId}`);
    
    return savedLog;
  }

  /**
   * 批量记录审计日志
   */
  async logBatch(auditDataList: CreateAuditLogDto[], request?: Request): Promise<AuditLog[]> {
    const requestId = this.getRequestId(undefined, request);
    
    const auditLogs = auditDataList.map(auditData => {
      const logData = {
        ...auditData,
        requestId,
        ipAddress: auditData.ipAddress || this.getClientIp(request),
        userAgent: auditData.userAgent || this.getUserAgent(request),
      };
      return this.auditLogRepository.create(logData);
    });

    const savedLogs = await this.auditLogRepository.save(auditLogs);
    
    this.logger.debug(`Batch audit logs created: ${savedLogs.length} for request ${requestId}`);
    
    return savedLogs;
  }

  /**
   * 获取requestId，确保一致性
   */
  private getRequestId(auditRequestId?: string, request?: Request): string {
    // 优先使用审计数据中的requestId
    if (auditRequestId) {
      return auditRequestId;
    }
    
    // 从请求对象中获取
    if (request && (request as any).requestId) {
      return (request as any).requestId;
    }
    
    // 从请求头中获取
    if (request && request.headers['x-request-id']) {
      return request.headers['x-request-id'] as string;
    }
    
    // 生成新的requestId
    return this.generateRequestId();
  }

  /**
   * 获取客户端IP
   */
  private getClientIp(request?: Request): string | undefined {
    if (!request) return undefined;
    
    return (
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      (request.connection as any)?.socket?.remoteAddress
    )?.split(',')[0]?.trim();
  }

  /**
   * 获取用户代理
   */
  private getUserAgent(request?: Request): string | undefined {
    return request?.headers['user-agent'];
  }

  /**
   * 生成requestId
   */
  private generateRequestId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

  /**
   * 根据requestId查询审计日志
   */
  async findAuditLogsByRequestId(requestId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { requestId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 获取请求的完整审计轨迹
   */
  async getRequestAuditTrail(requestId: string): Promise<{
    requestId: string;
    logs: AuditLog[];
    summary: {
      totalActions: number;
      duration: number;
      startTime: Date;
      endTime: Date;
      userId?: string;
      tenantId?: string;
      ipAddress?: string;
      userAgent?: string;
    };
  }> {
    const logs = await this.findAuditLogsByRequestId(requestId);
    
    if (logs.length === 0) {
      return {
        requestId,
        logs: [],
        summary: {
          totalActions: 0,
          duration: 0,
          startTime: new Date(),
          endTime: new Date(),
        },
      };
    }

    const startTime = logs[0].createdAt;
    const endTime = logs[logs.length - 1].createdAt;
    const duration = endTime.getTime() - startTime.getTime();

    return {
      requestId,
      logs,
      summary: {
        totalActions: logs.length,
        duration,
        startTime,
        endTime,
        userId: logs[0].userId,
        tenantId: logs[0].tenantId,
        ipAddress: logs[0].ipAddress,
        userAgent: logs[0].userAgent,
      },
    };
  }

  /**
   * 清理过期的审计日志
   */
  async cleanupExpiredLogs(retentionDays: number = 90): Promise<number> {
    const expiredDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    
    const result = await this.auditLogRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :expiredDate', { expiredDate })
      .execute();

    this.logger.log(`Cleaned up ${result.affected || 0} expired audit logs`);
    return result.affected || 0;
  }

  /**
   * 获取审计日志完整性报告
   */
  async getAuditIntegrityReport(tenantId?: string): Promise<{
    totalLogs: number;
    logsWithRequestId: number;
    logsWithoutRequestId: number;
    uniqueRequestIds: number;
    averageLogsPerRequest: number;
    integrityScore: number;
  }> {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit');

    if (tenantId) {
      queryBuilder.where('audit.tenantId = :tenantId', { tenantId });
    }

    const logs = await queryBuilder.getMany();
    const logsWithRequestId = logs.filter(log => log.requestId).length;
    const logsWithoutRequestId = logs.length - logsWithRequestId;
    
    const uniqueRequestIds = new Set(
      logs.filter(log => log.requestId).map(log => log.requestId)
    ).size;
    
    const averageLogsPerRequest = uniqueRequestIds > 0 ? logsWithRequestId / uniqueRequestIds : 0;
    const integrityScore = logs.length > 0 ? (logsWithRequestId / logs.length) * 100 : 100;

    return {
      totalLogs: logs.length,
      logsWithRequestId,
      logsWithoutRequestId,
      uniqueRequestIds,
      averageLogsPerRequest,
      integrityScore,
    };
  }
}
