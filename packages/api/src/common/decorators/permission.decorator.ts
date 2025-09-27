import { SetMetadata } from '@nestjs/common';

export interface PermissionRequirement {
  resource: string;
  action: string;
  module?: string;
}

export const PERMISSION_KEY = 'permission';

/**
 * 权限装饰器 - 支持细粒度的资源:动作权限控制
 * @param requirements 权限要求
 * 
 * @example
 * @Permission({ resource: 'order', action: 'read' })
 * @Permission({ resource: 'order', action: 'write', module: 'ordering' })
 * @Permission([
 *   { resource: 'order', action: 'read' },
 *   { resource: 'booking', action: 'write' }
 * ])
 */
export const Permission = (requirements: PermissionRequirement | PermissionRequirement[]) =>
  SetMetadata(PERMISSION_KEY, Array.isArray(requirements) ? requirements : [requirements]);

/**
 * 资源权限装饰器 - 简化版本
 * @param resource 资源名称
 * @param action 动作名称
 * @param module 模块名称（可选）
 * 
 * @example
 * @ResourcePermission('order', 'read')
 * @ResourcePermission('order', 'write', 'ordering')
 */
export const ResourcePermission = (resource: string, action: string, module?: string) =>
  Permission({ resource, action, module });

/**
 * 模块权限装饰器 - 检查模块级别的权限
 * @param module 模块名称
 * @param action 动作名称
 * 
 * @example
 * @ModulePermission('ordering', 'write')
 */
export const ModulePermission = (module: string, action: string) =>
  Permission({ resource: module, action, module });

/**
 * 预定义的权限常量
 */
export const PERMISSIONS = {
  // 订单相关权限
  ORDER: {
    READ: { resource: 'order', action: 'read' },
    WRITE: { resource: 'order', action: 'write' },
    DELETE: { resource: 'order', action: 'delete' },
    EXPORT: { resource: 'order', action: 'export' },
  },
  
  // 预约相关权限
  BOOKING: {
    READ: { resource: 'booking', action: 'read' },
    WRITE: { resource: 'booking', action: 'write' },
    DELETE: { resource: 'booking', action: 'delete' },
    VERIFY: { resource: 'booking', action: 'verify' },
  },
  
  // 商品相关权限
  PRODUCT: {
    READ: { resource: 'product', action: 'read' },
    WRITE: { resource: 'product', action: 'write' },
    DELETE: { resource: 'product', action: 'delete' },
    MANAGE_STOCK: { resource: 'product', action: 'manage_stock' },
  },
  
  // 场地相关权限
  RESOURCE: {
    READ: { resource: 'resource', action: 'read' },
    WRITE: { resource: 'resource', action: 'write' },
    DELETE: { resource: 'resource', action: 'delete' },
    MANAGE_AVAILABILITY: { resource: 'resource', action: 'manage_availability' },
  },
  
  // 用户相关权限
  USER: {
    READ: { resource: 'user', action: 'read' },
    WRITE: { resource: 'user', action: 'write' },
    DELETE: { resource: 'user', action: 'delete' },
    MANAGE_ROLES: { resource: 'user', action: 'manage_roles' },
  },
  
  // CMS相关权限
  CMS: {
    READ: { resource: 'cms', action: 'read' },
    WRITE: { resource: 'cms', action: 'write' },
    DELETE: { resource: 'cms', action: 'delete' },
    PUBLISH: { resource: 'cms', action: 'publish' },
  },
  
  // 配置相关权限
  CONFIG: {
    READ: { resource: 'config', action: 'read' },
    WRITE: { resource: 'config', action: 'write' },
    APPROVE: { resource: 'config', action: 'approve' },
    PUBLISH: { resource: 'config', action: 'publish' },
  },
  
  // 平台管理权限
  PLATFORM: {
    READ: { resource: 'platform', action: 'read' },
    WRITE: { resource: 'platform', action: 'write' },
    MANAGE_TENANTS: { resource: 'platform', action: 'manage_tenants' },
    MANAGE_MODULES: { resource: 'platform', action: 'manage_modules' },
  },
  
  // 模块级权限
  MODULE: {
    ORDERING: {
      READ: { resource: 'ordering', action: 'read', module: 'ordering' },
      WRITE: { resource: 'ordering', action: 'write', module: 'ordering' },
    },
    BOOKING: {
      READ: { resource: 'booking', action: 'read', module: 'booking' },
      WRITE: { resource: 'booking', action: 'write', module: 'booking' },
    },
    CMS: {
      READ: { resource: 'cms', action: 'read', module: 'cms' },
      WRITE: { resource: 'cms', action: 'write', module: 'cms' },
    },
  },
} as const;
