import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuditLogService, AuditLogQuery } from './audit-log.service';
import { AuditAction, AuditResourceType, AuditResult } from '../../entities/audit-log.entity';
import { JwtAuthGuard } from '../auth/auth.guard';

@ApiTags('audit')
@Controller('audit')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get('logs')
  @ApiOperation({ summary: '查询审计日志' })
  @ApiQuery({ name: 'tenantId', required: false, description: '租户ID' })
  @ApiQuery({ name: 'userId', required: false, description: '用户ID' })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction, description: '操作类型' })
  @ApiQuery({ name: 'resourceType', required: false, enum: AuditResourceType, description: '资源类型' })
  @ApiQuery({ name: 'resourceId', required: false, description: '资源ID' })
  @ApiQuery({ name: 'result', required: false, enum: AuditResult, description: '操作结果' })
  @ApiQuery({ name: 'startDate', required: false, description: '开始日期' })
  @ApiQuery({ name: 'endDate', required: false, description: '结束日期' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量' })
  @ApiResponse({ 
    status: 200, 
    description: '审计日志查询成功',
    schema: {
      type: 'object',
      properties: {
        logs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              tenantId: { type: 'string' },
              userId: { type: 'string' },
              action: { type: 'string' },
              resourceType: { type: 'string' },
              resourceId: { type: 'string' },
              description: { type: 'string' },
              result: { type: 'string' },
              createdAt: { type: 'string' }
            }
          }
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' }
      }
    }
  })
  async findAuditLogs(@Query() query: AuditLogQuery) {
    return this.auditLogService.findAuditLogs(query);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取审计日志统计' })
  @ApiQuery({ name: 'tenantId', required: false, description: '租户ID' })
  @ApiQuery({ name: 'startDate', required: false, description: '开始日期' })
  @ApiQuery({ name: 'endDate', required: false, description: '结束日期' })
  @ApiResponse({ 
    status: 200, 
    description: '审计统计获取成功',
    schema: {
      type: 'object',
      properties: {
        totalLogs: { type: 'number' },
        actionStats: { type: 'object' },
        resourceStats: { type: 'object' },
        resultStats: { type: 'object' },
        dailyStats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              count: { type: 'number' }
            }
          }
        }
      }
    }
  })
  async getAuditStats(
    @Query('tenantId') tenantId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.auditLogService.getAuditStats(tenantId, start, end);
  }

  @Get('user-activity/:userId')
  @ApiOperation({ summary: '获取用户活动日志' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiQuery({ name: 'limit', required: false, description: '返回数量限制' })
  @ApiResponse({ 
    status: 200, 
    description: '用户活动日志获取成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          action: { type: 'string' },
          resourceType: { type: 'string' },
          description: { type: 'string' },
          createdAt: { type: 'string' }
        }
      }
    }
  })
  async getUserActivity(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.auditLogService.getUserActivity(userId, limit);
  }

  @Get('resource-history/:resourceType/:resourceId')
  @ApiOperation({ summary: '获取资源变更历史' })
  @ApiParam({ name: 'resourceType', enum: AuditResourceType, description: '资源类型' })
  @ApiParam({ name: 'resourceId', description: '资源ID' })
  @ApiQuery({ name: 'limit', required: false, description: '返回数量限制' })
  @ApiResponse({ 
    status: 200, 
    description: '资源变更历史获取成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          action: { type: 'string' },
          oldValues: { type: 'object' },
          newValues: { type: 'object' },
          createdAt: { type: 'string' }
        }
      }
    }
  })
  async getResourceHistory(
    @Param('resourceType') resourceType: AuditResourceType,
    @Param('resourceId') resourceId: string,
    @Query('limit') limit?: number,
  ) {
    return this.auditLogService.getResourceHistory(resourceType, resourceId, limit);
  }

  @Post('cleanup')
  @ApiOperation({ summary: '清理旧审计日志' })
  @ApiQuery({ name: 'olderThanDays', required: false, description: '保留天数' })
  @ApiResponse({ 
    status: 200, 
    description: '清理完成',
    schema: {
      type: 'object',
      properties: {
        deletedCount: { type: 'number' },
        message: { type: 'string' }
      }
    }
  })
  async cleanupOldLogs(@Query('olderThanDays') olderThanDays?: number) {
    const deletedCount = await this.auditLogService.cleanupOldLogs(olderThanDays);
    return {
      deletedCount,
      message: `Cleaned up ${deletedCount} old audit logs`,
    };
  }

  @Post('export')
  @ApiOperation({ summary: '导出审计日志' })
  @ApiResponse({ 
    status: 200, 
    description: '导出完成',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          tenantId: { type: 'string' },
          userId: { type: 'string' },
          action: { type: 'string' },
          resourceType: { type: 'string' },
          resourceId: { type: 'string' },
          description: { type: 'string' },
          result: { type: 'string' },
          createdAt: { type: 'string' }
        }
      }
    }
  })
  async exportAuditLogs(@Body() query: AuditLogQuery) {
    return this.auditLogService.exportAuditLogs(query);
  }
}
