import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UsageService, UsageStats, QuotaCheckResult } from './usage.service';
import { UsageMetric, UsagePeriod } from '../../entities/usage-counter.entity';
import { QuotaType } from '../../entities/tenant-quota.entity';
import { JwtAuthGuard } from '../auth/auth.guard';

@ApiTags('usage')
@Controller('usage')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Get('stats/:tenantId')
  @ApiOperation({ summary: '获取租户用量统计' })
  @ApiParam({ name: 'tenantId', description: '租户ID' })
  @ApiQuery({ name: 'metric', required: false, enum: UsageMetric, description: '指标类型' })
  @ApiQuery({ name: 'period', required: false, enum: UsagePeriod, description: '统计周期' })
  @ApiQuery({ name: 'startDate', required: false, description: '开始日期 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: '结束日期 (YYYY-MM-DD)' })
  @ApiResponse({ 
    status: 200, 
    description: '用量统计获取成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          metric: { type: 'string', enum: Object.values(UsageMetric) },
          period: { type: 'string', enum: Object.values(UsagePeriod) },
          current: { type: 'number', description: '当前用量' },
          limit: { type: 'number', description: '配额限制' },
          type: { type: 'string', enum: Object.values(QuotaType), description: '配额类型' },
          percentage: { type: 'number', description: '使用百分比' },
          isOverLimit: { type: 'boolean', description: '是否超限' }
        }
      }
    }
  })
  async getTenantUsage(
    @Param('tenantId') tenantId: string,
    @Query('metric') metric?: UsageMetric,
    @Query('period') period?: UsagePeriod,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<UsageStats[]> {
    return this.usageService.getTenantUsage(tenantId, metric, period, startDate, endDate);
  }

  @Post('increment/:tenantId')
  @ApiOperation({ summary: '增加用量计数' })
  @ApiParam({ name: 'tenantId', description: '租户ID' })
  @ApiResponse({ 
    status: 201, 
    description: '用量计数增加成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        tenantId: { type: 'string' },
        metric: { type: 'string' },
        value: { type: 'number' },
        periodDate: { type: 'string' }
      }
    }
  })
  async incrementUsage(
    @Param('tenantId') tenantId: string,
    @Body() body: { metric: UsageMetric; amount?: number; metadata?: any }
  ) {
    const { metric, amount = 1, metadata } = body;
    return this.usageService.incrementUsage(tenantId, metric, amount, metadata);
  }

  @Post('check-quota/:tenantId')
  @ApiOperation({ summary: '检查配额限制' })
  @ApiParam({ name: 'tenantId', description: '租户ID' })
  @ApiResponse({ 
    status: 200, 
    description: '配额检查完成',
    schema: {
      type: 'object',
      properties: {
        allowed: { type: 'boolean', description: '是否允许' },
        current: { type: 'number', description: '当前用量' },
        limit: { type: 'number', description: '配额限制' },
        type: { type: 'string', enum: Object.values(QuotaType) },
        message: { type: 'string', description: '提示信息' }
      }
    }
  })
  async checkQuota(
    @Param('tenantId') tenantId: string,
    @Body() body: { metric: UsageMetric; amount?: number }
  ): Promise<QuotaCheckResult> {
    const { metric, amount = 1 } = body;
    return this.usageService.checkQuota(tenantId, metric, amount);
  }

  @Get('quotas/:tenantId')
  @ApiOperation({ summary: '获取租户配额配置' })
  @ApiParam({ name: 'tenantId', description: '租户ID' })
  @ApiResponse({ 
    status: 200, 
    description: '配额配置获取成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          tenantId: { type: 'string' },
          metric: { type: 'string', enum: Object.values(UsageMetric) },
          type: { type: 'string', enum: Object.values(QuotaType) },
          limit: { type: 'number' },
          description: { type: 'string' }
        }
      }
    }
  })
  async getTenantQuotas(@Param('tenantId') tenantId: string) {
    return this.usageService.getTenantQuotas(tenantId);
  }

  @Post('quotas/:tenantId')
  @ApiOperation({ summary: '设置租户配额' })
  @ApiParam({ name: 'tenantId', description: '租户ID' })
  @ApiResponse({ 
    status: 201, 
    description: '配额设置成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        tenantId: { type: 'string' },
        metric: { type: 'string' },
        type: { type: 'string' },
        limit: { type: 'number' },
        description: { type: 'string' }
      }
    }
  })
  async setQuota(
    @Param('tenantId') tenantId: string,
    @Body() body: { 
      metric: UsageMetric; 
      type: QuotaType; 
      limit: number; 
      description?: string 
    }
  ) {
    const { metric, type, limit, description } = body;
    return this.usageService.setQuota(tenantId, metric, type, limit, description);
  }

  @Delete('quotas/:quotaId')
  @ApiOperation({ summary: '删除配额配置' })
  @ApiParam({ name: 'quotaId', description: '配额ID' })
  @ApiResponse({ 
    status: 200, 
    description: '配额删除成功' 
  })
  async deleteQuota(@Param('quotaId') quotaId: string) {
    await this.usageService.deleteQuota(quotaId);
    return { success: true, message: 'Quota deleted successfully' };
  }

  @Get('monthly/:tenantId/:metric/:year/:month')
  @ApiOperation({ summary: '获取月度用量统计' })
  @ApiParam({ name: 'tenantId', description: '租户ID' })
  @ApiParam({ name: 'metric', enum: UsageMetric, description: '指标类型' })
  @ApiParam({ name: 'year', description: '年份' })
  @ApiParam({ name: 'month', description: '月份' })
  @ApiResponse({ 
    status: 200, 
    description: '月度用量统计获取成功',
    schema: {
      type: 'object',
      properties: {
        tenantId: { type: 'string' },
        metric: { type: 'string' },
        year: { type: 'number' },
        month: { type: 'number' },
        total: { type: 'number', description: '月度总用量' }
      }
    }
  })
  async getMonthlyUsage(
    @Param('tenantId') tenantId: string,
    @Param('metric') metric: UsageMetric,
    @Param('year') year: number,
    @Param('month') month: number,
  ) {
    const total = await this.usageService.getMonthlyUsage(tenantId, metric, year, month);
    return {
      tenantId,
      metric,
      year,
      month,
      total,
    };
  }
}
