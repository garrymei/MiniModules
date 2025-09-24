import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum UsageMetric {
  ORDERS = 'orders',
  BOOKINGS = 'bookings',
  USERS = 'users',
  STORAGE = 'storage',
  API_CALLS = 'api_calls'
}

export enum UsagePeriod {
  DAILY = 'daily',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

@Entity('usage_counters')
export class UsageCounter {
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
    enum: UsagePeriod 
  })
  @Index()
  period: UsagePeriod;

  @Column({ type: 'date' })
  @Index()
  periodDate: string;

  @Column({ type: 'int', default: 0 })
  value: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 复合唯一索引：tenantId + metric + period + periodDate
  @Index(['tenantId', 'metric', 'period', 'periodDate'], { unique: true })
  uniqueUsage: string;
}
