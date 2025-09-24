import { Controller, Get, Query } from '@nestjs/common';
import { UserPermissionsService, UserPermissionsDto } from './user-permissions.service';

@Controller('me')
export class UserPermissionsController {
  constructor(private readonly userPermissionsService: UserPermissionsService) {}

  @Get('permissions')
  async getUserPermissions(
    @Query('tenantId') tenantId: string,
  ): Promise<{ success: boolean; data: UserPermissionsDto }> {
    if (!tenantId) {
      return {
        success: false,
        data: { permissions: [], enabledModules: [] },
      };
    }

    const permissions = await this.userPermissionsService.getUserPermissions(tenantId);
    return {
      success: true,
      data: permissions,
    };
  }
}
