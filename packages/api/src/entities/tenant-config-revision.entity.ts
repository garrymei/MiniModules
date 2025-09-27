
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';

export enum ConfigRevisionStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
}

@Entity('tenant_config_revisions')
@Index(['tenantId', 'version'], { unique: true })
@Index(['tenantId', 'status'])
export class TenantConfigRevision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'int' })
  version: number;

  @Column({
    type: 'enum',
    enum: ConfigRevisionStatus,
    default: ConfigRevisionStatus.DRAFT,
  })
  status: ConfigRevisionStatus;

  @Column({ type: 'jsonb' })
  configJson: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  changeReason?: string;

  @Column({ type: 'uuid', nullable: true })
  submittedBy?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'submittedBy' })
  submitter: User;

  @Column({ type: 'uuid', nullable: true })
  approvedBy?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approvedBy' })
  approver: User;

  @Column({ type: 'text', nullable: true })
  reviewNote?: string;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
