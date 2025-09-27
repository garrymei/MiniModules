import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserPermissionsService, UserPermissionsDto } from './user-permissions.service';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class UserPermissionsController {
  constructor(private readonly userPermissionsService: UserPermissionsService) {}

  @Get('permissions')
  async getUserPermissions(
    @Request() req: any,
    @Query('tenantId') tenantId?: string,
  ): Promise<{ success: boolean; data: UserPermissionsDto }> {
    const payload = req.user;
    const effectiveTenant = tenantId || payload?.tenantId || payload?.tenants?.[0];

    if (!payload?.userId || !effectiveTenant) {
      return {
        success: false,
        data: { permissions: [], enabledModules: [], roles: [] },
      };
    }

    const data = await this.userPermissionsService.getUserPermissions(
      payload.userId,
      effectiveTenant,
      payload.roles || [],
    );

    return {
      success: true,
      data,
    };
  }
}
