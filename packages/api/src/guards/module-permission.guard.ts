import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantEntitlements } from '../entities/tenant-entitlements.entity';
import { MODULE_KEY } from '../decorators/require-module.decorator';

@Injectable()
export class ModulePermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(TenantEntitlements)
    private entitlementsRepository: Repository<TenantEntitlements>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModule = this.reflector.getAllAndOverride<string>(MODULE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredModule) {
      return true; // 如果没有指定模块要求，则允许访问
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.tenants || user.tenants.length === 0) {
      throw new ForbiddenException('No tenant access');
    }

    // 检查用户是否有任何租户启用了该模块
    const tenantIds = user.tenants;
    const now = new Date();

    const entitlements = await this.entitlementsRepository.find({
      where: {
        tenantId: tenantIds[0], // 简化：使用第一个租户
        moduleKey: requiredModule,
        status: 'enabled',
      },
    });

    if (entitlements.length === 0) {
      throw new ForbiddenException(`Module '${requiredModule}' is not enabled for this tenant`);
    }

    // 检查是否过期
    const validEntitlement = entitlements.find(entitlement => 
      !entitlement.expiresAt || entitlement.expiresAt > now
    );

    if (!validEntitlement) {
      throw new ForbiddenException(`Module '${requiredModule}' has expired for this tenant`);
    }

    return true;
  }
}
