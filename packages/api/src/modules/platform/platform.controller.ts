import { Controller, Get, Put, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { PlatformService, TenantEntitlementDto } from './platform.service';
import { TenantEntitlement } from '../../entities/tenant-entitlement.entity';

@Controller('platform/tenants')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get(':id/entitlements')
  async getTenantEntitlements(@Param('id') tenantId: string): Promise<{ success: boolean; data: TenantEntitlement[] }> {
    const entitlements = await this.platformService.getTenantEntitlements(tenantId);
    return {
      success: true,
      data: entitlements,
    };
  }

  @Put(':id/entitlements')
  async updateTenantEntitlements(
    @Param('id') tenantId: string,
    @Body() entitlements: TenantEntitlementDto[],
  ): Promise<{ success: boolean; data: TenantEntitlement[] }> {
    const updatedEntitlements = await this.platformService.updateTenantEntitlements(tenantId, entitlements);
    return {
      success: true,
      data: updatedEntitlements,
    };
  }

  @Post(':id/entitlements')
  async addTenantEntitlement(
    @Param('id') tenantId: string,
    @Body() body: { moduleKey: string; expiresAt?: string },
  ): Promise<{ success: boolean; data: TenantEntitlement }> {
    const entitlement = await this.platformService.addTenantEntitlement(
      tenantId,
      body.moduleKey,
      body.expiresAt ? new Date(body.expiresAt) : undefined,
    );
    return {
      success: true,
      data: entitlement,
    };
  }

  @Delete(':id/entitlements/:moduleKey')
  async removeTenantEntitlement(
    @Param('id') tenantId: string,
    @Param('moduleKey') moduleKey: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.platformService.removeTenantEntitlement(tenantId, moduleKey);
    return {
      success: true,
      message: `Entitlement for module ${moduleKey} removed successfully`,
    };
  }
}