import { Controller, Get, Post, Delete, Param, Body, Query, Res, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportJobService } from '../services/export-job.service';
import { ExportJobType } from '../../../entities/export-job.entity';
import * as path from 'path';
import * as fs from 'fs';

@ApiTags('export')
@Controller('api/export')
export class ExportController {
  constructor(private readonly exportJobService: ExportJobService) {}

  @Post('jobs')
  @ApiOperation({ summary: '创建导出任务' })
  @ApiResponse({ status: 201, description: '导出任务创建成功' })
  async createExportJob(
    @Body() body: {
      type: ExportJobType;
      filters?: any;
      tenantId: string;
      requestedBy: string;
    },
  ) {
    const job = await this.exportJobService.createExportJob(
      body.tenantId,
      body.type,
      body.filters,
      body.requestedBy,
    );

    return {
      success: true,
      data: job,
      message: '导出任务创建成功',
    };
  }

  @Get('jobs')
  @ApiOperation({ summary: '获取导出任务列表' })
  @ApiQuery({ name: 'tenantId', required: true, description: '租户ID' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量' })
  @ApiResponse({ status: 200, description: '导出任务列表' })
  async getExportJobs(
    @Query('tenantId') tenantId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const result = await this.exportJobService.getExportJobs(tenantId, page, limit);

    return {
      success: true,
      data: result.jobs,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: '获取导出任务详情' })
  @ApiResponse({ status: 200, description: '导出任务详情' })
  async getExportJob(@Param('id') id: string) {
    const job = await this.exportJobService.getExportJob(id);

    return {
      success: true,
      data: job,
    };
  }

  @Delete('jobs/:id')
  @ApiOperation({ summary: '删除导出任务' })
  @ApiResponse({ status: 200, description: '导出任务删除成功' })
  async deleteExportJob(@Param('id') id: string) {
    await this.exportJobService.deleteExportJob(id);

    return {
      success: true,
      message: '导出任务删除成功',
    };
  }

  @Get('download/:filename')
  @ApiOperation({ summary: '下载导出文件' })
  @ApiResponse({ status: 200, description: '文件下载' })
  async downloadExportFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filePath = path.join(process.cwd(), 'exports', filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('文件不存在');
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(filePath);
  }

  @Post('orders')
  @ApiOperation({ summary: '导出订单' })
  @ApiResponse({ status: 201, description: '订单导出任务创建成功' })
  async exportOrders(
    @Body() body: {
      tenantId: string;
      filters?: {
        startDate?: string;
        endDate?: string;
        status?: string;
      };
      requestedBy: string;
    },
  ) {
    const job = await this.exportJobService.createExportJob(
      body.tenantId,
      ExportJobType.ORDERS,
      body.filters,
      body.requestedBy,
    );

    return {
      success: true,
      data: job,
      message: '订单导出任务创建成功',
    };
  }

  @Post('bookings')
  @ApiOperation({ summary: '导出预约' })
  @ApiResponse({ status: 201, description: '预约导出任务创建成功' })
  async exportBookings(
    @Body() body: {
      tenantId: string;
      filters?: {
        startDate?: string;
        endDate?: string;
        status?: string;
        resourceId?: string;
      };
      requestedBy: string;
    },
  ) {
    const job = await this.exportJobService.createExportJob(
      body.tenantId,
      ExportJobType.BOOKINGS,
      body.filters,
      body.requestedBy,
    );

    return {
      success: true,
      data: job,
      message: '预约导出任务创建成功',
    };
  }

  @Post('users')
  @ApiOperation({ summary: '导出用户' })
  @ApiResponse({ status: 201, description: '用户导出任务创建成功' })
  async exportUsers(
    @Body() body: {
      tenantId: string;
      filters?: {
        startDate?: string;
        endDate?: string;
      };
      requestedBy: string;
    },
  ) {
    const job = await this.exportJobService.createExportJob(
      body.tenantId,
      ExportJobType.USERS,
      body.filters,
      body.requestedBy,
    );

    return {
      success: true,
      data: job,
      message: '用户导出任务创建成功',
    };
  }

  @Post('cleanup')
  @ApiOperation({ summary: '清理过期导出任务' })
  @ApiResponse({ status: 200, description: '清理完成' })
  async cleanupExpiredJobs() {
    await this.exportJobService.cleanupExpiredJobs();

    return {
      success: true,
      message: '过期导出任务清理完成',
    };
  }
}
