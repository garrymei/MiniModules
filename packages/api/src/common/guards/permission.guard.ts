import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY, PermissionRequirement } from '../decorators/permission.decorator';
import { UserPermissionsService } from '../../modules/auth/services/user-permissions.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userPermissionsService: UserPermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionRequirement[]>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // 没有权限要求，直接通过
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId =
      request.headers['x-tenant-id'] || request.params?.tenantId || request.query?.tenantId;

    if (!user || !tenantId) {
      throw new ForbiddenException('User or tenant information missing');
    }

    // 使用用户权限服务检查权限
    const hasPermission = await this.userPermissionsService.hasAnyPermission(
      user.userId || user.id,
      tenantId,
      requiredPermissions,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredPermissions
          .map(req => `${req.resource}:${req.action}${req.module ? `:${req.module}` : ''}`)
          .join(', ')}`,
      );
    }

    return true;
  }

}
