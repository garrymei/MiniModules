import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantEntitlement } from '../../entities/tenant-entitlement.entity';
import { ModuleSpecService } from '../platform/module-spec.service';

export interface UserPermissionsDto {
  permissions: string[];
  enabledModules: string[];
}

@Injectable()
export class UserPermissionsService {
  constructor(
    @InjectRepository(TenantEntitlement)
    private tenantEntitlementRepository: Repository<TenantEntitlement>,
    private moduleSpecService: ModuleSpecService,
  ) {}

  async onModuleInit() {
    // 初始化时加载所有模块规范
    this.moduleSpecService.loadAllModuleSpecs();
  }

  async getUserPermissions(tenantId: string): Promise<UserPermissionsDto> {
    const entitlements = await this.tenantEntitlementRepository.find({
      where: {
        tenantId,
        status: 'active',
      },
    });

    // 过滤未过期的授权
    const activeEntitlements = entitlements.filter(entitlement => 
      !entitlement.expiresAt || entitlement.expiresAt > new Date()
    );

    const enabledModules = activeEntitlements.map(entitlement => entitlement.moduleKey);
    
    // 根据模块生成权限列表
    const permissions = this.generatePermissionsFromModules(enabledModules);

    return {
      permissions,
      enabledModules,
    };
  }

  private generatePermissionsFromModules(modules: string[]): string[] {
    const permissions: string[] = [];
    
    modules.forEach(module => {
      // 基础权限
      permissions.push(`${module}:read`);
      permissions.push(`${module}:write`);
      
      // 特定模块权限
      switch (module) {
        case 'ordering':
          permissions.push('ordering:place_order');
          permissions.push('ordering:view_menu');
          break;
        case 'booking':
          permissions.push('booking:make_booking');
          permissions.push('booking:view_slots');
          break;
        case 'user':
          permissions.push('user:profile');
          permissions.push('user:settings');
          break;
        case 'pay':
          permissions.push('pay:process_payment');
          permissions.push('pay:view_history');
          break;
        case 'cms':
          permissions.push('cms:manage_content');
          permissions.push('cms:view_content');
          break;
      }
    });

    return permissions;
  }
}