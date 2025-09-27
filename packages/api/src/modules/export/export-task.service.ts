import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExportTask, ExportTaskStatus, ExportTaskType } from '../../entities/export-task.entity';
import { DataSource } from 'typeorm';
import { Order } from '../../entities/order.entity';
import { Booking } from '../../entities/booking.entity';
import { CMSContent } from '../../entities/cms-content.entity';
import { User } from '../../entities/user.entity';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

export interface ExportOptions {
  format: 'excel' | 'csv' | 'json';
  filters?: Record<string, any>;
  columns?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  tenantId: string;
  userId: string;
}

export interface ExportResult {
  taskId: string;
  status: ExportTaskStatus;
  downloadUrl?: string;
  error?: string;
}

@Injectable()
export class ExportTaskService {
  private readonly logger = new Logger(ExportTaskService.name);
  private readonly exportDir = path.join(process.cwd(), 'exports');

  constructor(
    @InjectRepository(ExportTask)
    private exportTaskRepository: Repository<ExportTask>,
    private dataSource: DataSource,
  ) {
    this.ensureExportDirectory();
  }

  /**
   * 创建导出任务
   */
  async createExportTask(
    type: ExportTaskType,
    options: ExportOptions,
  ): Promise<ExportResult> {
    const task = this.exportTaskRepository.create({
      type,
      status: ExportTaskStatus.PENDING,
      options,
      tenantId: options.tenantId,
      userId: options.userId,
      progress: 0,
    });

    const savedTask = await this.exportTaskRepository.save(task);

    // 异步执行导出任务
    this.executeExportTask(savedTask.id).catch(error => {
      this.logger.error(`Export task ${savedTask.id} failed:`, error);
    });

    return {
      taskId: savedTask.id,
      status: savedTask.status,
    };
  }

  /**
   * 获取导出任务状态
   */
  async getExportTaskStatus(taskId: string): Promise<ExportTask | null> {
    return this.exportTaskRepository.findOne({ where: { id: taskId } });
  }

  /**
   * 获取用户的导出任务列表
   */
  async getUserExportTasks(
    userId: string,
    tenantId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    tasks: ExportTask[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [tasks, total] = await this.exportTaskRepository.findAndCount({
      where: { userId, tenantId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      tasks,
      total,
      page,
      limit,
    };
  }

  /**
   * 删除导出任务
   */
  async deleteExportTask(taskId: string, userId: string): Promise<void> {
    const task = await this.exportTaskRepository.findOne({
      where: { id: taskId, userId },
    });

    if (!task) {
      throw new Error('Export task not found');
    }

    // 删除文件
    if (task.filePath && fs.existsSync(task.filePath)) {
      fs.unlinkSync(task.filePath);
    }

    await this.exportTaskRepository.delete(taskId);
  }

  /**
   * 执行导出任务
   */
  private async executeExportTask(taskId: string): Promise<void> {
    const task = await this.exportTaskRepository.findOne({ where: { id: taskId } });
    if (!task) {
      this.logger.error(`Export task ${taskId} not found`);
      return;
    }

    try {
      // 更新任务状态为处理中
      await this.updateTaskStatus(taskId, ExportTaskStatus.PROCESSING, 0);

      let result: { filePath: string; fileName: string };

      switch (task.type) {
        case ExportTaskType.ORDERS:
          result = await this.exportOrders(task);
          break;
        case ExportTaskType.BOOKINGS:
          result = await this.exportBookings(task);
          break;
        case ExportTaskType.CMS_CONTENT:
          result = await this.exportCMSContent(task);
          break;
        case ExportTaskType.USERS:
          result = await this.exportUsers(task);
          break;
        default:
          throw new Error(`Unsupported export type: ${task.type}`);
      }

      // 更新任务状态为完成
      await this.updateTaskStatus(
        taskId,
        ExportTaskStatus.COMPLETED,
        100,
        result.filePath,
        result.fileName,
      );

      this.logger.log(`Export task ${taskId} completed successfully`);
    } catch (error) {
      this.logger.error(`Export task ${taskId} failed:`, error);
      await this.updateTaskStatus(
        taskId,
        ExportTaskStatus.FAILED,
        0,
        undefined,
        undefined,
        error.message,
      );
    }
  }

  /**
   * 导出订单数据
   */
  private async exportOrders(task: ExportTask): Promise<{ filePath: string; fileName: string }> {
    const { options } = task;
    const queryBuilder = this.dataSource
      .getRepository(Order)
      .createQueryBuilder('order')
      .where('order.tenantId = :tenantId', { tenantId: options.tenantId });

    // 应用过滤器
    if (options.filters) {
      if (options.filters.status) {
        queryBuilder.andWhere('order.status = :status', { status: options.filters.status });
      }
      if (options.filters.userId) {
        queryBuilder.andWhere('order.userId = :userId', { userId: options.filters.userId });
      }
    }

    // 应用日期范围
    if (options.dateRange) {
      queryBuilder.andWhere('order.createdAt BETWEEN :start AND :end', {
        start: options.dateRange.start,
        end: options.dateRange.end,
      });
    }

    const orders = await queryBuilder.getMany();
    const fileName = `orders_${Date.now()}.${options.format}`;
    const filePath = path.join(this.exportDir, fileName);

    await this.writeToFile(orders, filePath, options.format, 'orders');

    return { filePath, fileName };
  }

  /**
   * 导出预约数据
   */
  private async exportBookings(task: ExportTask): Promise<{ filePath: string; fileName: string }> {
    const { options } = task;
    const queryBuilder = this.dataSource
      .getRepository(Booking)
      .createQueryBuilder('booking')
      .where('booking.tenantId = :tenantId', { tenantId: options.tenantId });

    // 应用过滤器
    if (options.filters) {
      if (options.filters.status) {
        queryBuilder.andWhere('booking.status = :status', { status: options.filters.status });
      }
      if (options.filters.resourceId) {
        queryBuilder.andWhere('booking.resourceId = :resourceId', { resourceId: options.filters.resourceId });
      }
    }

    // 应用日期范围
    if (options.dateRange) {
      queryBuilder.andWhere('booking.bookingDate BETWEEN :start AND :end', {
        start: options.dateRange.start,
        end: options.dateRange.end,
      });
    }

    const bookings = await queryBuilder.getMany();
    const fileName = `bookings_${Date.now()}.${options.format}`;
    const filePath = path.join(this.exportDir, fileName);

    await this.writeToFile(bookings, filePath, options.format, 'bookings');

    return { filePath, fileName };
  }

  /**
   * 导出CMS内容数据
   */
  private async exportCMSContent(task: ExportTask): Promise<{ filePath: string; fileName: string }> {
    const { options } = task;
    const queryBuilder = this.dataSource
      .getRepository(CMSContent)
      .createQueryBuilder('content')
      .where('content.tenantId = :tenantId', { tenantId: options.tenantId });

    // 应用过滤器
    if (options.filters) {
      if (options.filters.type) {
        queryBuilder.andWhere('content.type = :type', { type: options.filters.type });
      }
      if (options.filters.status) {
        queryBuilder.andWhere('content.status = :status', { status: options.filters.status });
      }
      if (options.filters.category) {
        queryBuilder.andWhere('content.category = :category', { category: options.filters.category });
      }
    }

    const contents = await queryBuilder.getMany();
    const fileName = `cms_content_${Date.now()}.${options.format}`;
    const filePath = path.join(this.exportDir, fileName);

    await this.writeToFile(contents, filePath, options.format, 'cms_content');

    return { filePath, fileName };
  }

  /**
   * 导出用户数据
   */
  private async exportUsers(task: ExportTask): Promise<{ filePath: string; fileName: string }> {
    const { options } = task;
    const queryBuilder = this.dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .where('user.tenantId = :tenantId', { tenantId: options.tenantId });

    // 应用过滤器
    if (options.filters) {
      if (options.filters.status) {
        queryBuilder.andWhere('user.status = :status', { status: options.filters.status });
      }
      if (options.filters.role) {
        queryBuilder.andWhere('user.role = :role', { role: options.filters.role });
      }
    }

    const users = await queryBuilder.getMany();
    const fileName = `users_${Date.now()}.${options.format}`;
    const filePath = path.join(this.exportDir, fileName);

    await this.writeToFile(users, filePath, options.format, 'users');

    return { filePath, fileName };
  }

  /**
   * 写入文件
   */
  private async writeToFile(
    data: any[],
    filePath: string,
    format: string,
    sheetName: string,
  ): Promise<void> {
    switch (format) {
      case 'excel':
        await this.writeExcelFile(data, filePath, sheetName);
        break;
      case 'csv':
        await this.writeCsvFile(data, filePath);
        break;
      case 'json':
        await this.writeJsonFile(data, filePath);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * 写入Excel文件
   */
  private async writeExcelFile(data: any[], filePath: string, sheetName: string): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    if (data.length === 0) {
      await workbook.xlsx.writeFile(filePath);
      return;
    }

    // 添加表头
    const headers = Object.keys(data[0]);
    worksheet.addRow(headers);

    // 设置表头样式
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // 添加数据行
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        if (value instanceof Date) {
          return value.toISOString();
        }
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value);
        }
        return value;
      });
      worksheet.addRow(values);
    });

    // 自动调整列宽
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.min(maxLength + 2, 50);
    });

    await workbook.xlsx.writeFile(filePath);
  }

  /**
   * 写入CSV文件
   */
  private async writeCsvFile(data: any[], filePath: string): Promise<void> {
    if (data.length === 0) {
      fs.writeFileSync(filePath, '');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          if (value instanceof Date) {
            return value.toISOString();
          }
          if (typeof value === 'object' && value !== null) {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      ),
    ].join('\n');

    fs.writeFileSync(filePath, csvContent, 'utf8');
  }

  /**
   * 写入JSON文件
   */
  private async writeJsonFile(data: any[], filePath: string): Promise<void> {
    const jsonContent = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonContent, 'utf8');
  }

  /**
   * 更新任务状态
   */
  private async updateTaskStatus(
    taskId: string,
    status: ExportTaskStatus,
    progress: number,
    filePath?: string,
    fileName?: string,
    error?: string,
  ): Promise<void> {
    await this.exportTaskRepository.update(taskId, {
      status,
      progress,
      filePath,
      fileName,
      error,
      updatedAt: new Date(),
    });
  }

  /**
   * 确保导出目录存在
   */
  private ensureExportDirectory(): void {
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }

  /**
   * 清理过期的导出文件
   */
  async cleanupExpiredExports(): Promise<number> {
    const expiredDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7天前

    const expiredTasks = await this.exportTaskRepository.find({
      where: {
        status: ExportTaskStatus.COMPLETED,
        createdAt: { $lt: expiredDate } as any,
      },
    });

    let cleanedCount = 0;
    for (const task of expiredTasks) {
      if (task.filePath && fs.existsSync(task.filePath)) {
        fs.unlinkSync(task.filePath);
        cleanedCount++;
      }
      await this.exportTaskRepository.delete(task.id);
    }

    this.logger.log(`Cleaned up ${cleanedCount} expired export files`);
    return cleanedCount;
  }

  /**
   * 获取导出统计信息
   */
  async getExportStats(tenantId: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    pendingTasks: number;
    totalFileSize: number;
  }> {
    const tasks = await this.exportTaskRepository.find({
      where: { tenantId },
    });

    let totalFileSize = 0;
    for (const task of tasks) {
      if (task.filePath && fs.existsSync(task.filePath)) {
        const stats = fs.statSync(task.filePath);
        totalFileSize += stats.size;
      }
    }

    return {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === ExportTaskStatus.COMPLETED).length,
      failedTasks: tasks.filter(t => t.status === ExportTaskStatus.FAILED).length,
      pendingTasks: tasks.filter(t => t.status === ExportTaskStatus.PENDING || t.status === ExportTaskStatus.PROCESSING).length,
      totalFileSize,
    };
  }
}
