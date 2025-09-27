import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('tenant_module_config')
export class TenantModuleConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'jsonb' })
  configJson!: Record<string, any>;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column({ 
    type: 'varchar', 
    length: 50, 
    default: 'draft',
    comment: 'draft, submitted, approved, published, rejected'
  })
  status!: 'draft' | 'submitted' | 'approved' | 'published' | 'rejected';

  @Column({ type: 'uuid', nullable: true })
  approvedBy?: string | null;

  @Column({ type: 'text', nullable: true })
  reviewNote?: string;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
