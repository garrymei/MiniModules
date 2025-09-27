import { SetMetadata } from '@nestjs/common';

export interface AuditOptions {
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  description?: string;
  includeRequestData?: boolean;
  includeResponseData?: boolean;
  sensitiveFields?: string[];
}

export const AUDIT_KEY = 'audit';

/**
 * 审计装饰器 - 用于标记需要审计的方法
 * @param options 审计选项
 * 
 * @example
 * @Audit({
 *   action: 'CREATE',
 *   resourceType: 'ORDER',
 *   description: '创建订单'
 * })
 * 
 * @Audit({
 *   action: 'UPDATE',
 *   resourceType: 'CONFIG',
 *   includeRequestData: true,
 *   sensitiveFields: ['password', 'secret']
 * })
 */
export const Audit = (options: AuditOptions) => SetMetadata(AUDIT_KEY, options);

/**
 * 预定义的审计动作
 */
export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  PUBLISH: 'PUBLISH',
  UNPUBLISH: 'UNPUBLISH',
  GRANT: 'GRANT',
  REVOKE: 'REVOKE',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT',
  UPLOAD: 'UPLOAD',
  DOWNLOAD: 'DOWNLOAD',
  VERIFY: 'VERIFY',
  CANCEL: 'CANCEL',
  REFUND: 'REFUND',
} as const;

/**
 * 预定义的资源类型
 */
export const AUDIT_RESOURCE_TYPES = {
  ORDER: 'ORDER',
  BOOKING: 'BOOKING',
  PRODUCT: 'PRODUCT',
  RESOURCE: 'RESOURCE',
  USER: 'USER',
  TENANT: 'TENANT',
  CONFIG: 'CONFIG',
  MODULE: 'MODULE',
  PAYMENT: 'PAYMENT',
  FILE: 'FILE',
  WEBHOOK: 'WEBHOOK',
  NOTIFICATION: 'NOTIFICATION',
  AUDIT_LOG: 'AUDIT_LOG',
  EXPORT_JOB: 'EXPORT_JOB',
  USAGE_COUNTER: 'USAGE_COUNTER',
  QUOTA: 'QUOTA',
  PERMISSION: 'PERMISSION',
  ROLE: 'ROLE',
} as const;

/**
 * 简化的审计装饰器
 */
export const AuditCreate = (resourceType: string, description?: string) =>
  Audit({
    action: AUDIT_ACTIONS.CREATE,
    resourceType,
    description: description || `创建${resourceType}`,
  });

export const AuditUpdate = (resourceType: string, description?: string) =>
  Audit({
    action: AUDIT_ACTIONS.UPDATE,
    resourceType,
    description: description || `更新${resourceType}`,
  });

export const AuditDelete = (resourceType: string, description?: string) =>
  Audit({
    action: AUDIT_ACTIONS.DELETE,
    resourceType,
    description: description || `删除${resourceType}`,
  });

export const AuditApprove = (resourceType: string, description?: string) =>
  Audit({
    action: AUDIT_ACTIONS.APPROVE,
    resourceType,
    description: description || `审批${resourceType}`,
  });

export const AuditPublish = (resourceType: string, description?: string) =>
  Audit({
    action: AUDIT_ACTIONS.PUBLISH,
    resourceType,
    description: description || `发布${resourceType}`,
  });