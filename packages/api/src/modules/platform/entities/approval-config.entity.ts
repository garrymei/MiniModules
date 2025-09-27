import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ApprovalScope {
  GLOBAL = 'global', // 全局审批
  MODULE = 'module', // 模块级审批
  TENANT = 'tenant', // 租户级审批
}

export enum ApprovalType {
  CONFIG_PUBLISH = 'config_publish', // 配置发布审批
  MODULE_ENABLE = 'module_enable', // 模块启用审批
  PAYMENT_REFUND = 'payment_refund', // 支付退款审批
  USER_DELETE = 'user_delete', // 用户删除审批
  DATA_EXPORT = 'data_export', // 数据导出审批
}

export enum ApprovalStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  GRADUAL_ROLLOUT = 'gradual_rollout', // 灰度发布
}

@Entity('approval_configs')
export class ApprovalConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  scope: ApprovalScope;

  @Column({ type: 'varchar', length: 50 })
  type: ApprovalType;

  @Column({ type: 'varchar', length: 50, nullable: true })
  moduleKey?: string; // 模块级审批时指定模块

  @Column({ type: 'varchar', length: 50, nullable: true })
  tenantId?: string; // 租户级审批时指定租户

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.DISABLED,
  })
  status: ApprovalStatus;

  @Column({ type: 'jsonb', nullable: true })
  approvalRoles: string[]; // 审批角色列表

  @Column({ type: 'jsonb', nullable: true })
  approvalUsers: string[]; // 审批用户列表

  @Column({ type: 'int', default: 1 })
  requiredApprovals: number; // 需要的审批数量

  @Column({ type: 'int', default: 0 })
  rolloutPercentage: number; // 灰度发布百分比 (0-100)

  @Column({ type: 'jsonb', nullable: true })
  rolloutConditions: {
    tenantIds?: string[]; // 指定租户
    moduleKeys?: string[]; // 指定模块
    userRoles?: string[]; // 指定用户角色
    customConditions?: Record<string, any>; // 自定义条件
  };

  @Column({ type: 'jsonb', nullable: true })
  notificationSettings: {
    notifyApprovers: boolean; // 是否通知审批人
    notifyApplicants: boolean; // 是否通知申请人
    notifyChannels: string[]; // 通知渠道 ['email', 'sms', 'webhook']
    templateIds: Record<string, string>; // 模板ID
  };

  @Column({ type: 'jsonb', nullable: true })
  escalationSettings: {
    enabled: boolean; // 是否启用升级
    escalationTime: number; // 升级时间（小时）
    escalationRoles: string[]; // 升级后的审批角色
    escalationUsers: string[]; // 升级后的审批用户
  };

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  createdBy: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
