import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum ExportJobType {
  ORDERS = 'orders',
  BOOKINGS = 'bookings',
  USERS = 'users',
  PRODUCTS = 'products',
  RESOURCES = 'resources',
  AUDIT_LOGS = 'audit_logs',
  USAGE_STATS = 'usage_stats'
}

export enum ExportJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum ExportJobFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  JSON = 'json'
}

@Entity('export_jobs')
export class ExportJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  userId: string;

  @Column({ 
    type: 'enum', 
    enum: ExportJobType 
  })
  @Index()
  type: ExportJobType;

  @Column({ 
    type: 'enum', 
    enum: ExportJobFormat,
    default: ExportJobFormat.CSV 
  })
  format: ExportJobFormat;

  @Column({ 
    type: 'enum', 
    enum: ExportJobStatus,
    default: ExportJobStatus.PENDING 
  })
  @Index()
  status: ExportJobStatus;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  fileUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  downloadUrl: string;

  @Column({ type: 'bigint', default: 0 })
  fileSize: number;

  @Column({ type: 'int', default: 0 })
  recordCount: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  filters: any;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
