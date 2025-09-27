import { Controller, Get, Put, Post, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { TenantConfigService } from './tenant-config.service';
import {
  TenantConfigDto,
  UpdateTenantConfigDto,
  ConfigHistoryDto,
  WorkflowNoteDto,
  ApproveConfigDto,
  ConfigDiffResponseDto,
} from './dto/tenant-config.dto';

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

  @Get('api/tenant/:id/config/meta')
  @ApiOperation({ summary: '获取租户配置元信息' })
  @ApiParam({ name: 'id', description: '租户ID' })
  @ApiResponse({ status: 200, description: '元信息' })
  async getTenantConfigMeta(@Param('id') tenantId: string) {
    return this.tenantConfigService.getTenantConfigMeta(tenantId);
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

  @Post('admin/tenant/:id/config/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '提交配置进入审批' })
  async submitConfig(
    @Param('id') tenantId: string,
    @Body() body: WorkflowNoteDto,
  ) {
    return this.tenantConfigService.submitTenantConfig(tenantId, body);
  }

  @Post('admin/tenant/:id/config/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '审核配置' })
  async approveConfig(
    @Param('id') tenantId: string,
    @Body() body: ApproveConfigDto,
    @Query('reviewerId') reviewerId?: string,
  ) {
    return this.tenantConfigService.approveTenantConfig(tenantId, body, reviewerId);
  }

  @Post('admin/tenant/:id/config/rollback/:version')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '回滚到指定版本' })
  @ApiParam({ name: 'version', description: '被回滚的目标版本' })
  async rollbackConfig(
    @Param('id') tenantId: string,
    @Param('version') version: number,
    @Body('note') note?: string,
  ) {
    return this.tenantConfigService.rollbackTenantConfig(tenantId, Number(version), note);
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

  @Get('admin/tenant/:id/config/diff')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '对比两个版本的配置差异' })
  @ApiQuery({ name: 'from', required: true, description: '源版本号' })
  @ApiQuery({ name: 'to', required: true, description: '目标版本号' })
  async diffConfig(
    @Param('id') tenantId: string,
    @Query('from') fromVersion: number,
    @Query('to') toVersion: number,
  ): Promise<ConfigDiffResponseDto> {
    return this.tenantConfigService.getConfigDiff(tenantId, Number(fromVersion), Number(toVersion));
  }
}
