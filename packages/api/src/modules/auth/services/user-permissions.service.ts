import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolePermission } from '../../../entities/role-permission.entity';
import { User } from '../../../entities/user.entity';

export interface UserPermission {
  resource: string;
  action: string;
  module?: string;
}

export interface RolePermissionDto {
  roleId: string;
  resource: string;
  action: string;
  module?: string;
  metadata?: Record<string, any>;
}

export interface UserRoleDto {
  userId: string;
  roleId: string;
  tenantId: string;
  assignedBy: string;
  expiresAt?: Date;
}

@Injectable()
export class UserPermissionsService {
  private readonly logger = new Logger(UserPermissionsService.name);

  constructor(
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 获取用户的所有权限
   */
  async getUserPermissions(userId: string, tenantId: string): Promise<string[]> {
    try {
      // 获取用户信息以检查管理员权限
      const user = await this.userRepository.findOne({ 
        where: { id: userId },
        relations: ['roles']
      });

      // 平台管理员拥有所有权限
      if (user?.isPlatformAdmin) {
        return ['*:*'];
      }

      // 租户管理员拥有租户内所有权限
      if (user?.isAdmin && user.tenantId === tenantId) {
        return ['*:*'];
      }

      // 从数据库查询角色权限
      const permissions = await this.rolePermissionRepository
        .createQueryBuilder('rp')
        .innerJoin('user_roles', 'ur', 'ur.roleId = rp.roleId AND ur.tenantId = :tenantId', { tenantId })
        .innerJoin('users', 'u', 'u.id = ur.userId AND u.id = :userId', { userId })
        .select(['rp.resource', 'rp.action'])
        .getMany();

      // 转换为权限字符串数组
      const permissionStrings = permissions.map(p => `${p.resource}:${p.action}`);

      // 添加用户角色相关的权限
      if (user?.roles) {
        const rolePermissions = await this.rolePermissionRepository
          .createQueryBuilder('rp')
          .where('rp.roleId IN (:...roleIds)', { roleIds: user.roles.map(r => r.id) })
          .andWhere('rp.tenantId = :tenantId', { tenantId })
          .select(['rp.resource', 'rp.action'])
          .getMany();
        
        rolePermissions.forEach(p => permissionStrings.push(`${p.resource}:${p.action}`));
      }

      // 去重并返回
      return [...new Set(permissionStrings)];
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
  ): Promise<boolean> {
    try {
      // 获取用户信息以检查管理员权限
      const user = await this.userRepository.findOne({ 
        where: { id: userId }
      });

      // 平台管理员拥有所有权限
      if (user?.isPlatformAdmin) {
        return true;
      }

      // 租户管理员拥有租户内所有权限
      if (user?.isAdmin && user.tenantId === tenantId) {
        return true;
      }

      const count = await this.rolePermissionRepository
        .createQueryBuilder('rp')
        .innerJoin('user_roles', 'ur', 'ur.roleId = rp.roleId AND ur.tenantId = :tenantId', { tenantId })
        .innerJoin('users', 'u', 'u.id = ur.userId AND u.id = :userId', { userId })
        .where('rp.resource = :resource AND rp.action = :action', { resource, action })
        .getCount();

      return count > 0;
    } catch (error) {
      this.logger.error(`Failed to check permission for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * 检查用户是否有任意权限
   */
  async hasAnyPermission(
    userId: string,
    tenantId: string,
    requiredPermissions: Array<{ resource: string; action: string }>,
  ): Promise<boolean> {
    try {
      // 检查用户是否为管理员
      const user = await this.userRepository.findOne({ 
        where: { id: userId }
      });
      
      // 平台管理员拥有所有权限
      if (user?.isPlatformAdmin) {
        return true;
      }

      // 租户管理员拥有租户内所有权限
      if (user?.isAdmin && user.tenantId === tenantId) {
        return true;
      }

      // 构建查询条件
      const conditions = requiredPermissions.map((perm, index) => 
        `(rp.resource = :resource${index} AND rp.action = :action${index})`
      ).join(' OR ');

      const parameters: any = {
        userId,
        tenantId,
      };

      requiredPermissions.forEach((perm, index) => {
        parameters[`resource${index}`] = perm.resource;
        parameters[`action${index}`] = perm.action;
      });

      const count = await this.rolePermissionRepository
        .createQueryBuilder('rp')
        .innerJoin('user_roles', 'ur', 'ur.roleId = rp.roleId AND ur.tenantId = :tenantId', { tenantId })
        .innerJoin('users', 'u', 'u.id = ur.userId AND u.id = :userId', { userId })
        .where(conditions, parameters)
        .getCount();

      return count > 0;
    } catch (error) {
      this.logger.error(`Failed to check any permission for user ${userId}:`, error);
      return false;
    }
  }
}