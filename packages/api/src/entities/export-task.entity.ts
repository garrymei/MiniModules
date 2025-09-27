import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum ExportTaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ExportTaskType {
  ORDERS = 'orders',
  BOOKINGS = 'bookings',
  CMS_CONTENT = 'cms_content',
  USERS = 'users',
  ANALYTICS = 'analytics',
  REPORTS = 'reports',
}

@Entity('export_tasks')
@Index(['userId', 'tenantId'])
@Index(['status', 'createdAt'])
@Index(['type', 'createdAt'])
export class ExportTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({
    type: 'enum',
    enum: ExportTaskType,
  })
  type: ExportTaskType;

  @Column({
    type: 'enum',
    enum: ExportTaskStatus,
    default: ExportTaskStatus.PENDING,
  })
  status: ExportTaskStatus;

  @Column({ type: 'jsonb' })
  options: {
    format: 'excel' | 'csv' | 'json';
    filters?: Record<string, any>;
    columns?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
  };

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  filePath?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fileName?: string;

  @Column({ type: 'bigint', nullable: true })
  fileSize?: number;

  @Column({ type: 'text', nullable: true })
  error?: string;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
