import { SetMetadata } from '@nestjs/common';
import { AuditAction, AuditResourceType } from '../../entities/audit-log.entity';

export interface AuditOptions {
  action: AuditAction;
  resourceType: AuditResourceType;
  description?: string;
  includeRequest?: boolean;
  includeResponse?: boolean;
}

export const AUDIT_KEY = 'audit';

/**
 * 审计日志装饰器
 * 用于标记需要记录审计日志的方法
 */
export const Audit = (options: AuditOptions) => SetMetadata(AUDIT_KEY, options);
