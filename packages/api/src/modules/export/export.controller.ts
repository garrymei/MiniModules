import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ExportService, CreateExportJobDto, ExportJobQuery } from './export.service';
import { ExportJobType, ExportJobStatus, ExportJobFormat } from '../../entities/export-job.entity';
import { JwtAuthGuard } from '../auth/auth.guard';
import { Audit } from '../../common/decorators/audit.decorator';
import { AuditAction, AuditResourceType } from '../../entities/audit-log.entity';

@ApiTags('export')
@Controller('export')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('job')
  @Audit({
    action: AuditAction.CREATE,
    resourceType: AuditResourceType.CONFIG,
    description: '创建导出任务'
  })
  @ApiOperation({ summary: '创建导出任务' })
  @ApiResponse({ 
    status: 201, 
    description: '导出任务创建成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        type: { type: 'string' },
        status: { type: 'string' },
        fileName: { type: 'string' },
        createdAt: { type: 'string' }
      }
    }
  })
  async createExportJob(@Body() createDto: CreateExportJobDto) {
    return this.exportService.createExportJob(createDto);
  }

  @Get('jobs')
  @ApiOperation({ summary: '获取导出任务列表' })
  @ApiQuery({ name: 'tenantId', required: false, description: '租户ID' })
  @ApiQuery({ name: 'userId', required: false, description: '用户ID' })
  @ApiQuery({ name: 'type', required: false, enum: ExportJobType, description: '任务类型' })
  @ApiQuery({ name: 'status', required: false, enum: ExportJobStatus, description: '任务状态' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量' })
  @ApiResponse({ 
    status: 200, 
    description: '导出任务列表获取成功',
    schema: {
      type: 'object',
      properties: {
        jobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              status: { type: 'string' },
              fileName: { type: 'string' },
              recordCount: { type: 'number' },
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
  async getExportJobs(@Query() query: ExportJobQuery) {
    return this.exportService.getExportJobs(query);
  }

  @Get('job/:id')
  @ApiOperation({ summary: '获取单个导出任务' })
  @ApiParam({ name: 'id', description: '任务ID' })
  @ApiResponse({ 
    status: 200, 
    description: '导出任务获取成功' 
  })
  async getExportJob(@Param('id') id: string) {
    return this.exportService.getExportJob(id);
  }

  @Post('job/:id/cancel')
  @Audit({
    action: AuditAction.UPDATE,
    resourceType: AuditResourceType.CONFIG,
    description: '取消导出任务'
  })
  @ApiOperation({ summary: '取消导出任务' })
  @ApiParam({ name: 'id', description: '任务ID' })
  @ApiResponse({ 
    status: 200, 
    description: '导出任务取消成功' 
  })
  async cancelExportJob(@Param('id') id: string) {
    await this.exportService.cancelExportJob(id);
    return { success: true, message: 'Export job cancelled successfully' };
  }

  @Delete('job/:id')
  @Audit({
    action: AuditAction.DELETE,
    resourceType: AuditResourceType.CONFIG,
    description: '删除导出任务'
  })
  @ApiOperation({ summary: '删除导出任务' })
  @ApiParam({ name: 'id', description: '任务ID' })
  @ApiResponse({ 
    status: 200, 
    description: '导出任务删除成功' 
  })
  async deleteExportJob(@Param('id') id: string) {
    await this.exportService.deleteExportJob(id);
    return { success: true, message: 'Export job deleted successfully' };
  }

  @Post('cleanup')
  @ApiOperation({ summary: '清理过期导出任务' })
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
  async cleanupExpiredJobs() {
    const deletedCount = await this.exportService.cleanupExpiredJobs();
    return {
      deletedCount,
      message: `Cleaned up ${deletedCount} expired export jobs`,
    };
  }
}
