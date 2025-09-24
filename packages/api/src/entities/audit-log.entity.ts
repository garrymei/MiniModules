import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  GRANT = 'grant',
  REVOKE = 'revoke',
  PUBLISH = 'publish',
  ROLLBACK = 'rollback',
  EXPORT = 'export',
  IMPORT = 'import'
}

export enum AuditResourceType {
  TENANT = 'tenant',
  USER = 'user',
  MODULE = 'module',
  CONFIG = 'config',
  ORDER = 'order',
  BOOKING = 'booking',
  PRODUCT = 'product',
  RESOURCE = 'resource',
  QUOTA = 'quota',
  ENTITLEMENT = 'entitlement'
}

export enum AuditResult {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PARTIAL = 'partial'
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  tenantId: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  userId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  userEmail: string;

  @Column({ 
    type: 'enum', 
    enum: AuditAction 
  })
  @Index()
  action: AuditAction;

  @Column({ 
    type: 'enum', 
    enum: AuditResourceType 
  })
  @Index()
  resourceType: AuditResourceType;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  resourceId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resourceName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValues: any;

  @Column({ type: 'jsonb', nullable: true })
  newValues: any;

  @Column({ 
    type: 'enum', 
    enum: AuditResult,
    default: AuditResult.SUCCESS 
  })
  result: AuditResult;

  @Column({ type: 'varchar', length: 45, nullable: true })
  @Index()
  ipAddress: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  requestId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
