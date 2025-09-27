import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ExportTaskService } from './export-task.service';
import { ExportTaskType } from '../../entities/export-task.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { Permission } from '../../common/decorators/permission.decorator';
import * as fs from 'fs';
import * as path from 'path';

@Controller('export')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ExportTaskController {
  constructor(private readonly exportTaskService: ExportTaskService) {}

  @Post('task')
  @Permission({ resource: 'export', action: 'create' })
  async createExportTask(
    @Body() body: {
      type: ExportTaskType;
      format: 'excel' | 'csv' | 'json';
      filters?: Record<string, any>;
      columns?: string[];
      dateRange?: {
        start: string;
        end: string;
      };
    },
    @Request() req: any,
  ) {
    const { type, format, filters, columns, dateRange } = body;
    const tenantId = req.headers['x-tenant-id'] || req.user.tenantId;
    const userId = req.user.userId || req.user.id;

    const options = {
      format,
      filters,
      columns,
      dateRange: dateRange ? {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end),
      } : undefined,
      tenantId,
      userId,
    };

    return await this.exportTaskService.createExportTask(type, options);
  }

  @Get('task/:taskId')
  @Permission({ resource: 'export', action: 'read' })
  async getExportTaskStatus(@Param('taskId') taskId: string) {
    return await this.exportTaskService.getExportTaskStatus(taskId);
  }

  @Get('tasks')
  @Permission({ resource: 'export', action: 'read' })
  async getUserExportTasks(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Request() req: any,
  ) {
    const tenantId = req.headers['x-tenant-id'] || req.user.tenantId;
    const userId = req.user.userId || req.user.id;

    return await this.exportTaskService.getUserExportTasks(userId, tenantId, page, limit);
  }

  @Delete('task/:taskId')
  @Permission({ resource: 'export', action: 'delete' })
  async deleteExportTask(
    @Param('taskId') taskId: string,
    @Request() req: any,
  ) {
    const userId = req.user.userId || req.user.id;
    await this.exportTaskService.deleteExportTask(taskId, userId);
    return { success: true, message: 'Export task deleted successfully' };
  }

  @Get('download/:taskId')
  @Permission({ resource: 'export', action: 'read' })
  async downloadExportFile(
    @Param('taskId') taskId: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const userId = req.user.userId || req.user.id;
    const task = await this.exportTaskService.getExportTaskStatus(taskId);

    if (!task) {
      return res.status(HttpStatus.NOT_FOUND).json({
        error: 'Export task not found',
      });
    }

    if (task.userId !== userId) {
      return res.status(HttpStatus.FORBIDDEN).json({
        error: 'Access denied',
      });
    }

    if (task.status !== 'completed' || !task.filePath) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        error: 'Export file not ready',
      });
    }

    if (!fs.existsSync(task.filePath)) {
      return res.status(HttpStatus.NOT_FOUND).json({
        error: 'Export file not found',
      });
    }

    const fileName = task.fileName || `export_${taskId}.${task.options.format}`;
    const fileStream = fs.createReadStream(task.filePath);

    res.setHeader('Content-Type', this.getContentType(task.options.format));
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    fileStream.pipe(res);
  }

  @Get('stats')
  @Permission({ resource: 'export', action: 'read' })
  async getExportStats(@Request() req: any) {
    const tenantId = req.headers['x-tenant-id'] || req.user.tenantId;
    return await this.exportTaskService.getExportStats(tenantId);
  }

  @Post('cleanup')
  @Permission({ resource: 'export', action: 'write' })
  async cleanupExpiredExports() {
    const cleanedCount = await this.exportTaskService.cleanupExpiredExports();
    return {
      success: true,
      message: `Cleaned up ${cleanedCount} expired export files`,
      cleanedCount,
    };
  }

  private getContentType(format: string): string {
    switch (format) {
      case 'excel':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'csv':
        return 'text/csv';
      case 'json':
        return 'application/json';
      default:
        return 'application/octet-stream';
    }
  }
}
