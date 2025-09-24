import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantEntitlement } from '../entities/tenant-entitlement.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export const RequireModule = (moduleKey: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('required_module', moduleKey, descriptor.value);
  };
};

@Injectable()
export class ModulePermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(TenantEntitlement)
    private tenantEntitlementRepository: Repository<TenantEntitlement>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModule = this.reflector.get<string>('required_module', context.getHandler());
    
    if (!requiredModule) {
      return true; // 没有模块要求，允许访问
    }

    const request = context.switchToHttp().getRequest();
    const tenantId = request.params.tenantId || request.query.tenantId || request.user?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Tenant ID is required');
    }

    // 检查租户是否有该模块的授权
    const entitlement = await this.tenantEntitlementRepository.findOne({
      where: {
        tenantId,
        moduleKey: requiredModule,
        status: 'active',
      },
    });

    if (!entitlement) {
      throw new ForbiddenException(`Module ${requiredModule} is not authorized for tenant ${tenantId}`);
    }

    // 检查是否过期
    if (entitlement.expiresAt && entitlement.expiresAt < new Date()) {
      throw new ForbiddenException(`Module ${requiredModule} authorization has expired`);
    }

    return true;
  }
}