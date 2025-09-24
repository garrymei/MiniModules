import { Controller, Get, Put, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { TenantConfigService } from './tenant-config.service';
import { TenantConfigDto, UpdateTenantConfigDto, ConfigHistoryDto } from './dto/tenant-config.dto';

@ApiTags('tenant-config')
@Controller()
export class TenantConfigController {
  constructor(private readonly tenantConfigService: TenantConfigService) {}

  @Get('api/tenant/:id/config')
  @ApiOperation({ summary: '获取租户配置（小程序端）' })
  @ApiParam({ name: 'id', description: '租户ID' })
  @ApiResponse({ 
    status: 200, 
    description: '租户配置',
    type: TenantConfigDto
  })
  @ApiResponse({ 
    status: 404, 
    description: '租户配置不存在'
  })
  async getTenantConfig(@Param('id') tenantId: string): Promise<TenantConfigDto> {
    return this.tenantConfigService.getTenantConfig(tenantId);
  }

  @Put('admin/tenant/:id/config')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新租户配置（管理端）' })
  @ApiParam({ name: 'id', description: '租户ID' })
  @ApiResponse({ 
    status: 200, 
    description: '配置更新成功',
    type: TenantConfigDto
  })
  @ApiResponse({ 
    status: 404, 
    description: '租户不存在'
  })
  async updateTenantConfig(
    @Param('id') tenantId: string,
    @Body() configDto: UpdateTenantConfigDto
  ): Promise<TenantConfigDto> {
    return this.tenantConfigService.updateTenantConfig(tenantId, configDto);
  }

  @Post('admin/tenant/:id/config/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '发布租户配置' })
  @ApiParam({ name: 'id', description: '租户ID' })
  @ApiResponse({ 
    status: 200, 
    description: '配置发布成功',
    type: TenantConfigDto
  })
  @ApiResponse({ 
    status: 404, 
    description: '租户配置不存在'
  })
  async publishTenantConfig(
    @Param('id') tenantId: string,
    @Body('version') version: number
  ): Promise<TenantConfigDto> {
    return this.tenantConfigService.publishTenantConfig(tenantId, version);
  }

  @Get('admin/tenant/:id/config/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取租户配置历史' })
  @ApiParam({ name: 'id', description: '租户ID' })
  @ApiResponse({ 
    status: 200, 
    description: '配置历史列表',
    type: [ConfigHistoryDto]
  })
  async getTenantConfigHistory(@Param('id') tenantId: string) {
    return this.tenantConfigService.getTenantConfigHistory(tenantId);
  }
}