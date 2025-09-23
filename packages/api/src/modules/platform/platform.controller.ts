import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { PlatformService, EntitlementDto } from './platform.service';

@ApiTags('platform')
@Controller('platform')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('tenants/:id/entitlements')
  @ApiOperation({ summary: '获取租户授权列表' })
  @ApiParam({ name: 'id', description: '租户ID' })
  @ApiResponse({ 
    status: 200, 
    description: '租户授权列表'
  })
  async getTenantEntitlements(@Param('id') tenantId: string) {
    return this.platformService.getTenantEntitlements(tenantId);
  }

  @Put('tenants/:id/entitlements')
  @ApiOperation({ summary: '更新租户授权' })
  @ApiParam({ name: 'id', description: '租户ID' })
  @ApiResponse({ 
    status: 200, 
    description: '授权更新成功'
  })
  async updateTenantEntitlements(
    @Param('id') tenantId: string,
    @Body() entitlements: EntitlementDto[]
  ) {
    return this.platformService.updateTenantEntitlements(tenantId, entitlements);
  }
}
