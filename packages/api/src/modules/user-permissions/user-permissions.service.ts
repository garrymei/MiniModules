import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Tenant } from '../../entities/tenant.entity';

export interface UserPermission {
  resource: string;
  action: string;
  module?: string;
}

export interface RolePermission {
  roleId: string;
  roleName: string;
  permissions: UserPermission[];
}

@Injectable()
export class UserPermissionsService {
  private readonly logger = new Logger(UserPermissionsService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {}

  /**
   * 获取用户权限列表
   */
  async getUserPermissions(userId: string, tenantId: string): Promise<string[]> {
    try {
      // 获取用户信息
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['roles'],
      });

      if (!user) {
        this.logger.warn(`User ${userId} not found`);
        return [];
      }

      // 获取租户信息
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId },
      });

      if (!tenant) {
        this.logger.warn(`Tenant ${tenantId} not found`);
        return [];
      }

      // 构建权限列表
      const permissions: string[] = [];

      // 1. 基础权限（所有用户都有）
      permissions.push('user:read', 'tenant:read');

      // 2. 角色权限
      if (user.roles && user.roles.length > 0) {
        for (const role of user.roles) {
          const rolePermissions = this.getRolePermissions(role.name, tenantId);
          permissions.push(...rolePermissions);
        }
      }

      // 3. 租户管理员权限
      if (user.tenantId === tenantId && user.isAdmin) {
        permissions.push('*:*'); // 超级管理员权限
      }

      // 4. 平台管理员权限
      if (user.isPlatformAdmin) {
        permissions.push('platform:*', 'tenant:*', 'module:*');
      }

      // 去重并返回
      return [...new Set(permissions)];
    } catch (error) {
      this.logger.error(`Failed to get user permissions for user ${userId} in tenant ${tenantId}:`, error);
      return [];
    }
  }

  /**
   * 检查用户是否有特定权限
   */
  async hasPermission(
    userId: string,
    tenantId: string,
    resource: string,
    action: string,
    module?: string,
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, tenantId);
    
    // 检查精确权限
    const exactPermission = `${resource}:${action}`;
    if (permissions.includes(exactPermission)) {
      return true;
    }

    // 检查通配符权限
    if (permissions.includes(`${resource}:*`)) {
      return true;
    }

    // 检查模块级权限
    if (module) {
      const modulePermission = `${module}:${action}`;
      if (permissions.includes(modulePermission)) {
        return true;
      }
      
      if (permissions.includes(`${module}:*`)) {
        return true;
      }
    }

    // 检查超级管理员权限
    if (permissions.includes('*:*')) {
      return true;
    }

    return false;
  }

  /**
   * 获取角色权限
   */
  private getRolePermissions(roleName: string, tenantId: string): string[] {
    const rolePermissions: Record<string, string[]> = {
      // 管理员角色
      admin: [
        '*:*', // 所有权限
      ],
      
      // 运营角色
      operator: [
        'order:read', 'order:write', 'order:export',
        'booking:read', 'booking:write', 'booking:verify',
        'product:read', 'product:write',
        'resource:read', 'resource:write',
        'user:read', 'user:write',
        'cms:read', 'cms:write', 'cms:publish',
        'config:read', 'config:write',
      ],
      
      // 客服角色
      customer_service: [
        'order:read', 'order:write',
        'booking:read', 'booking:write', 'booking:verify',
        'user:read', 'user:write',
        'cms:read',
      ],
      
      // 财务角色
      finance: [
        'order:read', 'order:export',
        'payment:read', 'payment:write',
        'user:read',
        'config:read',
      ],
      
      // 内容管理角色
      content_manager: [
        'cms:read', 'cms:write', 'cms:publish',
        'product:read', 'product:write',
        'resource:read', 'resource:write',
      ],
      
      // 普通用户角色
      user: [
        'order:read',
        'booking:read',
        'product:read',
        'resource:read',
        'cms:read',
      ],
      
      // 只读角色
      readonly: [
        'order:read',
        'booking:read',
        'product:read',
        'resource:read',
        'user:read',
        'cms:read',
        'config:read',
      ],
    };

    return rolePermissions[roleName] || [];
  }

  /**
   * 获取用户角色信息
   */
  async getUserRoles(userId: string, tenantId: string): Promise<RolePermission[]> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['roles'],
      });

      if (!user || !user.roles) {
        return [];
      }

      return user.roles.map(role => ({
        roleId: role.id,
        roleName: role.name,
        permissions: this.getRolePermissions(role.name, tenantId).map(permission => {
          const [resource, action] = permission.split(':');
          return { resource, action };
        }),
      }));
    } catch (error) {
      this.logger.error(`Failed to get user roles for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * 检查用户是否为租户管理员
   */
  async isTenantAdmin(userId: string, tenantId: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId, tenantId },
      });

      return user ? user.isAdmin : false;
    } catch (error) {
      this.logger.error(`Failed to check tenant admin status for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * 检查用户是否为平台管理员
   */
  async isPlatformAdmin(userId: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      return user ? user.isPlatformAdmin : false;
    } catch (error) {
      this.logger.error(`Failed to check platform admin status for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * 获取用户可访问的模块列表
   */
  async getUserAccessibleModules(userId: string, tenantId: string): Promise<string[]> {
    const permissions = await this.getUserPermissions(userId, tenantId);
    const modules: string[] = [];

    // 从权限中提取模块
    permissions.forEach(permission => {
      if (permission.includes(':')) {
        const [resource, action] = permission.split(':');
        
        // 检查是否为模块级权限
        const moduleNames = ['ordering', 'booking', 'cms', 'user', 'config', 'platform'];
        if (moduleNames.includes(resource)) {
          modules.push(resource);
        }
      }
    });

    return [...new Set(modules)];
  }

  /**
   * 验证用户对特定资源的访问权限
   */
  async validateResourceAccess(
    userId: string,
    tenantId: string,
    resourceType: string,
    resourceId: string,
    action: string,
  ): Promise<boolean> {
    try {
      // 基础权限检查
      const hasBasicPermission = await this.hasPermission(userId, tenantId, resourceType, action);
      if (!hasBasicPermission) {
        return false;
      }

      // 资源级权限检查（如果需要）
      // 这里可以添加更细粒度的资源访问控制
      // 例如：用户只能访问自己创建的订单等

      return true;
    } catch (error) {
      this.logger.error(`Failed to validate resource access for user ${userId}:`, error);
      return false;
    }
  }
}