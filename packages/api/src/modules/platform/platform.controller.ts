import { Controller, Get, Put, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { PlatformService, TenantEntitlementDto } from './platform.service';
import { TenantEntitlement } from '../../entities/tenant-entitlement.entity';
import { UsageService } from '../usage/usage.service';
import { UsageMetric, UsagePeriod } from '../../entities/usage-counter.entity';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

@Controller('platform/tenants')
export class PlatformController {
  constructor(
    private readonly platformService: PlatformService,
    private readonly usageService: UsageService,
  ) {}

  @Get(':id/entitlements')
  @ApiOperation({ summary: '获取租户授权模块' })
  async getTenantEntitlements(@Param('id') tenantId: string): Promise<{ success: boolean; data: TenantEntitlement[] }> {
    const entitlements = await this.platformService.getTenantEntitlements(tenantId);
    return {
      success: true,
      data: entitlements,
    };
  }

  @Get(':id/usage')
  @ApiOperation({ summary: '获取租户用量统计' })
  @ApiParam({ name: 'id', description: '租户ID' })
  @ApiQuery({ name: 'metric', required: false, enum: UsageMetric, description: '指标类型' })
  @ApiQuery({ name: 'period', required: false, enum: UsagePeriod, description: '统计周期' })
  @ApiQuery({ name: 'startDate', required: false, description: '开始日期 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: '结束日期 (YYYY-MM-DD)' })
  async getTenantUsage(
    @Param('id') tenantId: string,
    @Query('metric') metric?: UsageMetric,
    @Query('period') period?: UsagePeriod,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.usageService.getTenantUsage(tenantId, metric, period, startDate, endDate);
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
