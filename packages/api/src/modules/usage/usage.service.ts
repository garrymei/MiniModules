import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { UsageCounter, UsageMetric, UsagePeriod } from '../../entities/usage-counter.entity';
import { TenantQuota, QuotaType } from '../../entities/tenant-quota.entity';
import { BusinessException } from '../../common/errors/business.exception';
import { BusinessErrorCode } from '../../common/errors/business-codes.enum';

export interface UsageStats {
  metric: UsageMetric;
  period: UsagePeriod;
  current: number;
  limit?: number;
  type?: QuotaType;
  percentage?: number;
  isOverLimit: boolean;
}

export interface QuotaCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  type: QuotaType;
  message?: string;
}

@Injectable()
export class UsageService {
  constructor(
    @InjectRepository(UsageCounter)
    private usageCounterRepository: Repository<UsageCounter>,
    @InjectRepository(TenantQuota)
    private tenantQuotaRepository: Repository<TenantQuota>,
  ) {}

  /**
   * 增加用量计数
   */
  async incrementUsage(
    tenantId: string,
    metric: UsageMetric,
    amount: number = 1,
    metadata?: any
  ): Promise<UsageCounter> {
    const periodDate = this.getCurrentPeriodDate();
    const period = UsagePeriod.DAILY; // 默认按日统计

    // 查找现有记录
    let counter = await this.usageCounterRepository.findOne({
      where: {
        tenantId,
        metric,
        period,
        periodDate,
      },
    });

    if (counter) {
      // 更新现有记录
      counter.value += amount;
      if (metadata) {
        counter.metadata = { ...counter.metadata, ...metadata };
      }
    } else {
      // 创建新记录
      counter = this.usageCounterRepository.create({
        tenantId,
        metric,
        period,
        periodDate,
        value: amount,
        metadata,
      });
    }

    return this.usageCounterRepository.save(counter);
  }

  /**
   * 获取租户用量统计
   */
  async getTenantUsage(
    tenantId: string,
    metric?: UsageMetric,
    period?: UsagePeriod,
    startDate?: string,
    endDate?: string
  ): Promise<UsageStats[]> {
    const where: any = { tenantId };
    
    if (metric) {
      where.metric = metric;
    }
    
    if (period) {
      where.period = period;
    }

    if (startDate && endDate) {
      where.periodDate = Between(startDate, endDate);
    }

    const counters = await this.usageCounterRepository.find({
      where,
      order: { periodDate: 'DESC' },
    });

    // 获取配额信息
    const quotas = await this.tenantQuotaRepository.find({
      where: { tenantId, isActive: true },
    });

    // 按指标分组统计
    const statsMap = new Map<string, UsageStats>();

    for (const counter of counters) {
      const key = `${counter.metric}_${counter.period}`;
      
      if (!statsMap.has(key)) {
        const quota = quotas.find(q => q.metric === counter.metric);
        
        statsMap.set(key, {
          metric: counter.metric,
          period: counter.period,
          current: 0,
          limit: quota?.limit,
          type: quota?.type,
          percentage: 0,
          isOverLimit: false,
        });
      }

      const stats = statsMap.get(key)!;
      stats.current += counter.value;
    }

    // 计算百分比和超限状态
    for (const stats of statsMap.values()) {
      if (stats.limit) {
        stats.percentage = Math.round((stats.current / stats.limit) * 100);
        stats.isOverLimit = stats.current > stats.limit;
      }
    }

    return Array.from(statsMap.values());
  }

  /**
   * 检查配额限制
   */
  async checkQuota(
    tenantId: string,
    metric: UsageMetric,
    amount: number = 1
  ): Promise<QuotaCheckResult> {
    const currentStats = await this.getTenantUsage(tenantId, metric, UsagePeriod.DAILY);
    const current = currentStats.length > 0 ? currentStats[0].current : 0;
    
    const quota = await this.tenantQuotaRepository.findOne({
      where: {
        tenantId,
        metric,
        isActive: true,
      },
    });

    if (!quota) {
      // 没有配额限制，允许通过
      return {
        allowed: true,
        current,
        limit: 0,
        type: QuotaType.WARNING,
      };
    }

    const newUsage = current + amount;
    const isOverLimit = newUsage > quota.limit;

    let allowed = true;
    let message: string | undefined;

    if (isOverLimit) {
      if (quota.type === QuotaType.HARD_LIMIT) {
        allowed = false;
        message = `Quota exceeded for ${metric}. Current: ${current}, Limit: ${quota.limit}`;
      } else if (quota.type === QuotaType.SOFT_LIMIT) {
        allowed = true;
        message = `Warning: Approaching quota limit for ${metric}. Current: ${current}, Limit: ${quota.limit}`;
      }
    }

    return {
      allowed,
      current,
      limit: quota.limit,
      type: quota.type,
      message,
    };
  }

  /**
   * 设置租户配额
   */
  async setQuota(
    tenantId: string,
    metric: UsageMetric,
    type: QuotaType,
    limit: number,
    description?: string
  ): Promise<TenantQuota> {
    // 查找现有配额
    let quota = await this.tenantQuotaRepository.findOne({
      where: {
        tenantId,
        metric,
        type,
      },
    });

    if (quota) {
      // 更新现有配额
      quota.limit = limit;
      quota.description = description;
    } else {
      // 创建新配额
      quota = this.tenantQuotaRepository.create({
        tenantId,
        metric,
        type,
        limit,
        description,
      });
    }

    return this.tenantQuotaRepository.save(quota);
  }

  /**
   * 获取租户所有配额
   */
  async getTenantQuotas(tenantId: string): Promise<TenantQuota[]> {
    return this.tenantQuotaRepository.find({
      where: { tenantId, isActive: true },
      order: { metric: 'ASC', type: 'ASC' },
    });
  }

  /**
   * 删除配额
   */
  async deleteQuota(quotaId: string): Promise<void> {
    await this.tenantQuotaRepository.delete(quotaId);
  }

  /**
   * 获取当前周期日期
   */
  private getCurrentPeriodDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * 获取月度用量统计
   */
  async getMonthlyUsage(
    tenantId: string,
    metric: UsageMetric,
    year: number,
    month: number
  ): Promise<number> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const counters = await this.usageCounterRepository.find({
      where: {
        tenantId,
        metric,
        period: UsagePeriod.DAILY,
        periodDate: Between(startDate, endDate),
      },
    });

    return counters.reduce((total, counter) => total + counter.value, 0);
  }
}
