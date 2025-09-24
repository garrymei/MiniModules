import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { UsageMetric } from './usage-counter.entity';

export enum QuotaType {
  HARD_LIMIT = 'hard_limit',    // 硬限制，超限直接拒绝
  SOFT_LIMIT = 'soft_limit',    // 软限制，超限警告但允许
  WARNING = 'warning'           // 警告阈值
}

@Entity('tenant_quotas')
export class TenantQuota {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ 
    type: 'enum', 
    enum: UsageMetric 
  })
  @Index()
  metric: UsageMetric;

  @Column({ 
    type: 'enum', 
    enum: QuotaType 
  })
  type: QuotaType;

  @Column({ type: 'int' })
  limit: number;

  @Column({ type: 'varchar', length: 50, default: 'monthly' })
  period: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 复合唯一索引：tenantId + metric + type
  @Index(['tenantId', 'metric', 'type'], { unique: true })
  uniqueQuota: string;
}
