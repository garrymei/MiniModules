
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ApprovalConfig, ApprovalScope, ApprovalType } from './approval-config.entity';
import { User } from './user.entity';

export enum ApprovalRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Entity('approval_requests')
@Index(['tenantId', 'status'])
export class ApprovalRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  tenantId?: string;

  @Column({ type: 'uuid' })
  configId: string;

  @ManyToOne(() => ApprovalConfig)
  @JoinColumn({ name: 'configId' })
  config: ApprovalConfig;

  @Column({ type: 'enum', enum: ApprovalRequestStatus, default: ApprovalRequestStatus.PENDING })
  status: ApprovalRequestStatus;

  @Column({ type: 'uuid' })
  applicantId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'applicantId' })
  applicant: User;

  @Column({ type: 'jsonb', comment: 'Data of the resource that requires approval' })
  resourceData: any;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column('simple-json', { nullable: true, comment: 'Decisions made by approvers' })
  decisions: Array<{
    approverId: string;
    decision: 'approve' | 'reject';
    comment?: string;
    timestamp: Date;
  }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date;
}
