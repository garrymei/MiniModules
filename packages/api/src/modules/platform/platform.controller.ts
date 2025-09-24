import { Controller, Get, Put, Post, Delete, Param, Body, ValidationPipe } from '@nestjs/common';
import { PlatformService, TenantEntitlementDto } from './platform.service';
import { TenantEntitlement } from '../../entities/tenant-entitlement.entity';
import { RequireModule } from '../../decorators/require-module.decorator';

@Controller('platform/tenants')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get(':id/entitlements')
  @RequireModule('platform')
  async getTenantEntitlements(@Param('id') tenantId: string): Promise<{ success: boolean; data: TenantEntitlement[] }> {
    const entitlements = await this.platformService.getTenantEntitlements(tenantId);
    return {
      success: true,
      data: entitlements,
    };
  }

  @Put(':id/entitlements')
  @RequireModule('platform')
  async updateTenantEntitlements(
    @Param('id') tenantId: string,
    @Body(ValidationPipe) entitlements: TenantEntitlementDto[],
  ): Promise<{ success: boolean; data: TenantEntitlement[] }> {
    const updatedEntitlements = await this.platformService.updateTenantEntitlements(tenantId, entitlements);
    return {
      success: true,
      data: updatedEntitlements,
    };
  }

  @Post(':id/entitlements')
  @RequireModule('platform')
  async addTenantEntitlement(
    @Param('id') tenantId: string,
    @Body(ValidationPipe) body: { moduleKey: string; expiresAt?: string },
  ): Promise<{ success: boolean; data: TenantEntitlement }> {
    let expiresAt: Date | undefined;
    if (body.expiresAt) {
      expiresAt = new Date(body.expiresAt);
      if (isNaN(expiresAt.getTime())) {
        throw new Error('Invalid date format for expiresAt');
      }
    }
    
    const entitlement = await this.platformService.addTenantEntitlement(
      tenantId,
      body.moduleKey,
      expiresAt,
    );
    return {
      success: true,
      data: entitlement,
    };
  }

  @Delete(':id/entitlements/:moduleKey')
  @RequireModule('platform')
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

  @Get('modules/versions')
  @RequireModule('platform')
  async getAllModuleVersions(): Promise<{ success: boolean; data: any[] }> {
    const versions = this.platformService.getAllModuleVersions();
    return {
      success: true,
      data: versions,
    };
  }

  @Get('modules/:id/version')
  @RequireModule('platform')
  async getModuleVersion(@Param('id') moduleId: string): Promise<{ success: boolean; data: any }> {
    const version = this.platformService.getModuleVersion(moduleId);
    return {
      success: true,
      data: version,
    };
  }
}