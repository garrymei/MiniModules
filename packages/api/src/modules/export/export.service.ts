import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { ExportJob, ExportJobType, ExportJobStatus, ExportJobFormat } from '../../entities/export-job.entity';
import { Order } from '../../entities/order.entity';
import { Booking } from '../../entities/booking.entity';
import { Product } from '../../entities/product.entity';
import { Resource } from '../../entities/resource.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { UsageCounter } from '../../entities/usage-counter.entity';

export interface CreateExportJobDto {
  tenantId: string;
  userId?: string;
  type: ExportJobType;
  format?: ExportJobFormat;
  filters?: any;
  metadata?: any;
}

export interface ExportJobQuery {
  tenantId?: string;
  userId?: string;
  type?: ExportJobType;
  status?: ExportJobStatus;
  page?: number;
  limit?: number;
}

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(ExportJob)
    private exportJobRepository: Repository<ExportJob>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Resource)
    private resourceRepository: Repository<Resource>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(UsageCounter)
    private usageCounterRepository: Repository<UsageCounter>,
  ) {}

  /**
   * 创建导出任务
   */
  async createExportJob(createDto: CreateExportJobDto): Promise<ExportJob> {
    const fileName = this.generateFileName(createDto.type, createDto.format || ExportJobFormat.CSV);
    
    const exportJob = this.exportJobRepository.create({
      ...createDto,
      fileName,
      format: createDto.format || ExportJobFormat.CSV,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后过期
    });

    const savedJob = await this.exportJobRepository.save(exportJob);

    // 异步处理导出任务
    this.processExportJob(savedJob.id).catch(error => {
      console.error(`Export job ${savedJob.id} failed:`, error);
    });

    return savedJob;
  }

  /**
   * 处理导出任务
   */
  async processExportJob(jobId: string): Promise<void> {
    const job = await this.exportJobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException(`Export job with ID ${jobId} not found`);
    }

    try {
      // 更新状态为处理中
      await this.exportJobRepository.update(jobId, {
        status: ExportJobStatus.PROCESSING,
        startedAt: new Date(),
      });

      // 根据类型获取数据
      const data = await this.getExportData(job);
      
      // 生成文件
      const fileContent = await this.generateFile(data, job.format);
      
      // 模拟文件上传到对象存储（实际应该上传到S3等）
      const fileUrl = await this.uploadFile(job.fileName, fileContent);
      
      // 更新任务状态
      await this.exportJobRepository.update(jobId, {
        status: ExportJobStatus.COMPLETED,
        fileUrl,
        downloadUrl: fileUrl, // 简化处理，实际应该有下载链接
        fileSize: Buffer.byteLength(fileContent),
        recordCount: data.length,
        completedAt: new Date(),
      });

    } catch (error) {
      // 更新任务状态为失败
      await this.exportJobRepository.update(jobId, {
        status: ExportJobStatus.FAILED,
        errorMessage: error.message,
        completedAt: new Date(),
      });
      throw error;
    }
  }

  /**
   * 获取导出数据
   */
  private async getExportData(job: ExportJob): Promise<any[]> {
    const { tenantId, type, filters } = job;

    switch (type) {
      case ExportJobType.ORDERS:
        return this.getOrdersData(tenantId, filters);
      
      case ExportJobType.BOOKINGS:
        return this.getBookingsData(tenantId, filters);
      
      case ExportJobType.PRODUCTS:
        return this.getProductsData(tenantId, filters);
      
      case ExportJobType.RESOURCES:
        return this.getResourcesData(tenantId, filters);
      
      case ExportJobType.AUDIT_LOGS:
        return this.getAuditLogsData(tenantId, filters);
      
      case ExportJobType.USAGE_STATS:
        return this.getUsageStatsData(tenantId, filters);
      
      default:
        throw new BadRequestException(`Unsupported export type: ${type}`);
    }
  }

  /**
   * 获取订单数据
   */
  private async getOrdersData(tenantId: string, filters?: any): Promise<any[]> {
    const where: any = { tenantId };
    
    if (filters?.startDate && filters?.endDate) {
      where.createdAt = Between(filters.startDate, filters.endDate);
    }

    const orders = await this.orderRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return orders.map(order => ({
      id: order.id,
      orderNumber: (order as any).orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      customerName: (order as any).customerName,
      customerPhone: (order as any).customerPhone,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));
  }

  /**
   * 获取预约数据
   */
  private async getBookingsData(tenantId: string, filters?: any): Promise<any[]> {
    const where: any = { tenantId };
    
    if (filters?.startDate && filters?.endDate) {
      where.createdAt = Between(filters.startDate, filters.endDate);
    }

    const bookings = await this.bookingRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return bookings.map(booking => ({
      id: booking.id,
      bookingNumber: (booking as any).bookingNumber,
      status: booking.status,
      resourceName: (booking as any).resourceName,
      startTime: booking.startTime,
      endTime: booking.endTime,
      customerName: (booking as any).customerName,
      customerPhone: (booking as any).customerPhone,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    }));
  }

  /**
   * 获取商品数据
   */
  private async getProductsData(tenantId: string, filters?: any): Promise<any[]> {
    const where: any = { tenantId };
    
    if (filters?.category) {
      where.category = filters.category;
    }

    const products = await this.productRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return products.map(product => ({
      id: product.id,
      name: product.name,
      category: product.category,
      type: product.type,
      status: product.status,
      basePrice: product.basePrice,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));
  }

  /**
   * 获取资源数据
   */
  private async getResourcesData(tenantId: string, filters?: any): Promise<any[]> {
    const where: any = { tenantId };
    
    if (filters?.type) {
      where.type = filters.type;
    }

    const resources = await this.resourceRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return resources.map(resource => ({
      id: resource.id,
      name: resource.name,
      type: resource.type,
      capacity: resource.capacity,
      status: resource.status,
      basePrice: resource.basePrice,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
    }));
  }

  /**
   * 获取审计日志数据
   */
  private async getAuditLogsData(tenantId: string, filters?: any): Promise<any[]> {
    const where: any = { tenantId };
    
    if (filters?.startDate && filters?.endDate) {
      where.createdAt = Between(filters.startDate, filters.endDate);
    }

    const logs = await this.auditLogRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return logs.map(log => ({
      id: log.id,
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      description: log.description,
      result: log.result,
      userEmail: log.userEmail,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
    }));
  }

  /**
   * 获取用量统计数据
   */
  private async getUsageStatsData(tenantId: string, filters?: any): Promise<any[]> {
    const where: any = { tenantId };
    
    if (filters?.startDate && filters?.endDate) {
      where.periodDate = Between(filters.startDate, filters.endDate);
    }

    const counters = await this.usageCounterRepository.find({
      where,
      order: { periodDate: 'DESC' },
    });

    return counters.map(counter => ({
      id: counter.id,
      metric: counter.metric,
      period: counter.period,
      periodDate: counter.periodDate,
      value: counter.value,
      createdAt: counter.createdAt,
    }));
  }

  /**
   * 生成文件内容
   */
  private async generateFile(data: any[], format: ExportJobFormat): Promise<string> {
    switch (format) {
      case ExportJobFormat.CSV:
        return this.generateCSV(data);
      
      case ExportJobFormat.JSON:
        return JSON.stringify(data, null, 2);
      
      default:
        throw new BadRequestException(`Unsupported format: ${format}`);
    }
  }

  /**
   * 生成CSV内容
   */
  private generateCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * 模拟文件上传
   */
  private async uploadFile(fileName: string, content: string): Promise<string> {
    // 实际应该上传到对象存储服务
    // 这里返回一个模拟的URL
    return `https://storage.example.com/exports/${fileName}`;
  }

  /**
   * 生成文件名
   */
  private generateFileName(type: ExportJobType, format: ExportJobFormat): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = format === ExportJobFormat.CSV ? 'csv' : 'json';
    return `${type}_${timestamp}.${extension}`;
  }

  /**
   * 获取导出任务列表
   */
  async getExportJobs(query: ExportJobQuery): Promise<{
    jobs: ExportJob[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      tenantId,
      userId,
      type,
      status,
      page = 1,
      limit = 20,
    } = query;

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (status) where.status = status;

    const [jobs, total] = await this.exportJobRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      jobs,
      total,
      page,
      limit,
    };
  }

  /**
   * 获取单个导出任务
   */
  async getExportJob(id: string): Promise<ExportJob> {
    const job = await this.exportJobRepository.findOne({ where: { id } });
    if (!job) {
      throw new NotFoundException(`Export job with ID ${id} not found`);
    }
    return job;
  }

  /**
   * 取消导出任务
   */
  async cancelExportJob(id: string): Promise<void> {
    const job = await this.exportJobRepository.findOne({ where: { id } });
    if (!job) {
      throw new NotFoundException(`Export job with ID ${id} not found`);
    }

    if (job.status === ExportJobStatus.COMPLETED || job.status === ExportJobStatus.FAILED) {
      throw new BadRequestException('Cannot cancel completed or failed job');
    }

    await this.exportJobRepository.update(id, {
      status: ExportJobStatus.CANCELLED,
      completedAt: new Date(),
    });
  }

  /**
   * 删除导出任务
   */
  async deleteExportJob(id: string): Promise<void> {
    const result = await this.exportJobRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Export job with ID ${id} not found`);
    }
  }

  /**
   * 清理过期任务
   */
  async cleanupExpiredJobs(): Promise<number> {
    const result = await this.exportJobRepository.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected || 0;
  }
}
