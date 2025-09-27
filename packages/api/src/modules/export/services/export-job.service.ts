import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExportJob, ExportJobStatus, ExportJobType } from '../../../entities/export-job.entity';
import { Order } from '../../../entities/order.entity';
import { Booking } from '../../../entities/booking.entity';
import { User } from '../../../entities/user.entity';
import * as csv from 'csv-writer';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

@Injectable()
export class ExportJobService {
  private readonly logger = new Logger(ExportJobService.name);
  private readonly exportDir = path.join(process.cwd(), 'exports');

  constructor(
    @InjectRepository(ExportJob)
    private exportJobRepository: Repository<ExportJob>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    // 确保导出目录存在
    this.ensureExportDir();
  }

  /**
   * 创建导出任务
   */
  async createExportJob(
    tenantId: string,
    type: ExportJobType,
    filters: any,
    requestedBy: string,
  ): Promise<ExportJob> {
    const job = this.exportJobRepository.create({
      tenantId,
      type,
      filters,
      status: ExportJobStatus.PENDING,
      requestedBy,
    });

    const saved = await this.exportJobRepository.save(job);
    
    // 异步执行导出任务
    this.processExportJob(saved.id).catch(error => {
      this.logger.error(`Export job ${saved.id} failed:`, error);
    });

    return saved;
  }

  /**
   * 处理导出任务
   */
  async processExportJob(jobId: string): Promise<void> {
    const job = await this.exportJobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException(`Export job ${jobId} not found`);
    }

    try {
      // 更新状态为处理中
      await this.exportJobRepository.update(jobId, {
        status: ExportJobStatus.PROCESSING,
        startedAt: new Date(),
      });

      let filePath: string;
      let recordCount: number;

      switch (job.type) {
        case ExportJobType.ORDERS:
          ({ filePath, recordCount } = await this.exportOrders(job));
          break;
        case ExportJobType.BOOKINGS:
          ({ filePath, recordCount } = await this.exportBookings(job));
          break;
        case ExportJobType.USERS:
          ({ filePath, recordCount } = await this.exportUsers(job));
          break;
        default:
          throw new Error(`Unsupported export type: ${job.type}`);
      }

      // 更新任务状态为完成
      await this.exportJobRepository.update(jobId, {
        status: ExportJobStatus.COMPLETED,
        completedAt: new Date(),
        filePath,
        recordCount,
        downloadUrl: this.generateDownloadUrl(filePath),
      });

      this.logger.log(`Export job ${jobId} completed successfully. Records: ${recordCount}`);

    } catch (error) {
      this.logger.error(`Export job ${jobId} failed:`, error);
      
      // 更新任务状态为失败
      await this.exportJobRepository.update(jobId, {
        status: ExportJobStatus.FAILED,
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * 导出订单
   */
  private async exportOrders(job: ExportJob): Promise<{ filePath: string; recordCount: number }> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.sku', 'sku')
      .where('order.tenantId = :tenantId', { tenantId: job.tenantId });

    // 应用过滤器
    if (job.filters?.startDate) {
      queryBuilder.andWhere('order.createdAt >= :startDate', { startDate: job.filters.startDate });
    }
    if (job.filters?.endDate) {
      queryBuilder.andWhere('order.createdAt <= :endDate', { endDate: job.filters.endDate });
    }
    if (job.filters?.status) {
      queryBuilder.andWhere('order.status = :status', { status: job.filters.status });
    }

    const orders = await queryBuilder.getMany();

    const fileName = `orders_${job.tenantId}_${Date.now()}.csv`;
    const filePath = path.join(this.exportDir, fileName);

    const csvWriter = csv.createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'orderNumber', title: '订单号' },
        { id: 'customerName', title: '客户姓名' },
        { id: 'customerPhone', title: '客户电话' },
        { id: 'totalAmount', title: '总金额' },
        { id: 'status', title: '状态' },
        { id: 'paymentStatus', title: '支付状态' },
        { id: 'itemCount', title: '商品数量' },
        { id: 'createdAt', title: '创建时间' },
        { id: 'updatedAt', title: '更新时间' },
      ],
      encoding: 'utf8',
    });

    const csvData = orders.map(order => ({
      orderNumber: order.orderNumber,
      customerName: order.customerName || '',
      customerPhone: order.customerPhone || '',
      totalAmount: order.totalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus || '',
      itemCount: order.items?.length || 0,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }));

    await csvWriter.writeRecords(csvData);

    return { filePath, recordCount: orders.length };
  }

  /**
   * 导出预约
   */
  private async exportBookings(job: ExportJob): Promise<{ filePath: string; recordCount: number }> {
    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.resource', 'resource')
      .where('booking.tenantId = :tenantId', { tenantId: job.tenantId });

    // 应用过滤器
    if (job.filters?.startDate) {
      queryBuilder.andWhere('booking.bookingDate >= :startDate', { startDate: job.filters.startDate });
    }
    if (job.filters?.endDate) {
      queryBuilder.andWhere('booking.bookingDate <= :endDate', { endDate: job.filters.endDate });
    }
    if (job.filters?.status) {
      queryBuilder.andWhere('booking.status = :status', { status: job.filters.status });
    }
    if (job.filters?.resourceId) {
      queryBuilder.andWhere('booking.resourceId = :resourceId', { resourceId: job.filters.resourceId });
    }

    const bookings = await queryBuilder.getMany();

    const fileName = `bookings_${job.tenantId}_${Date.now()}.csv`;
    const filePath = path.join(this.exportDir, fileName);

    const csvWriter = csv.createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'bookingNumber', title: '预约号' },
        { id: 'customerName', title: '客户姓名' },
        { id: 'customerPhone', title: '客户电话' },
        { id: 'resourceName', title: '场地名称' },
        { id: 'bookingDate', title: '预约日期' },
        { id: 'startTime', title: '开始时间' },
        { id: 'endTime', title: '结束时间' },
        { id: 'peopleCount', title: '人数' },
        { id: 'status', title: '状态' },
        { id: 'totalAmount', title: '总金额' },
        { id: 'createdAt', title: '创建时间' },
        { id: 'updatedAt', title: '更新时间' },
      ],
      encoding: 'utf8',
    });

    const csvData = bookings.map(booking => ({
      bookingNumber: booking.bookingNumber || '',
      customerName: booking.customerName || '',
      customerPhone: booking.customerPhone || '',
      resourceName: booking.resource?.name || '',
      bookingDate: booking.bookingDate.toISOString().split('T')[0],
      startTime: booking.startTime,
      endTime: booking.endTime,
      peopleCount: booking.peopleCount,
      status: booking.status,
      totalAmount: booking.totalAmount || 0,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
    }));

    await csvWriter.writeRecords(csvData);

    return { filePath, recordCount: bookings.length };
  }

  /**
   * 导出用户
   */
  private async exportUsers(job: ExportJob): Promise<{ filePath: string; recordCount: number }> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.tenantId = :tenantId', { tenantId: job.tenantId });

    // 应用过滤器
    if (job.filters?.startDate) {
      queryBuilder.andWhere('user.createdAt >= :startDate', { startDate: job.filters.startDate });
    }
    if (job.filters?.endDate) {
      queryBuilder.andWhere('user.createdAt <= :endDate', { endDate: job.filters.endDate });
    }

    const users = await queryBuilder.getMany();

    const fileName = `users_${job.tenantId}_${Date.now()}.csv`;
    const filePath = path.join(this.exportDir, fileName);

    const csvWriter = csv.createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'nickname', title: '昵称' },
        { id: 'avatar', title: '头像' },
        { id: 'phone', title: '手机号' },
        { id: 'email', title: '邮箱' },
        { id: 'gender', title: '性别' },
        { id: 'birthday', title: '生日' },
        { id: 'city', title: '城市' },
        { id: 'status', title: '状态' },
        { id: 'createdAt', title: '注册时间' },
        { id: 'updatedAt', title: '更新时间' },
      ],
      encoding: 'utf8',
    });

    const csvData = users.map(user => ({
      nickname: user.nickname || '',
      avatar: user.avatar || '',
      phone: user.phone || '',
      email: user.email || '',
      gender: user.gender || '',
      birthday: user.birthday || '',
      city: user.city || '',
      status: user.status || 'active',
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));

    await csvWriter.writeRecords(csvData);

    return { filePath, recordCount: users.length };
  }

  /**
   * 获取导出任务列表
   */
  async getExportJobs(
    tenantId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ jobs: ExportJob[]; total: number }> {
    const [jobs, total] = await this.exportJobRepository.findAndCount({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { jobs, total };
  }

  /**
   * 获取导出任务详情
   */
  async getExportJob(jobId: string): Promise<ExportJob> {
    const job = await this.exportJobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException(`Export job ${jobId} not found`);
    }
    return job;
  }

  /**
   * 删除导出任务
   */
  async deleteExportJob(jobId: string): Promise<void> {
    const job = await this.exportJobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException(`Export job ${jobId} not found`);
    }

    // 删除文件
    if (job.filePath && fs.existsSync(job.filePath)) {
      fs.unlinkSync(job.filePath);
    }

    await this.exportJobRepository.delete(jobId);
  }

  /**
   * 清理过期的导出任务
   */
  async cleanupExpiredJobs(): Promise<void> {
    const expiredDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7天前

    const expiredJobs = await this.exportJobRepository.find({
      where: {
        status: ExportJobStatus.COMPLETED,
        completedAt: { $lt: expiredDate } as any,
      },
    });

    for (const job of expiredJobs) {
      if (job.filePath && fs.existsSync(job.filePath)) {
        fs.unlinkSync(job.filePath);
      }
      await this.exportJobRepository.delete(job.id);
    }

    this.logger.log(`Cleaned up ${expiredJobs.length} expired export jobs`);
  }

  /**
   * 确保导出目录存在
   */
  private async ensureExportDir(): Promise<void> {
    try {
      await mkdir(this.exportDir, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create export directory:', error);
    }
  }

  /**
   * 生成下载URL
   */
  private generateDownloadUrl(filePath: string): string {
    const fileName = path.basename(filePath);
    return `/api/export/download/${fileName}`;
  }
}
