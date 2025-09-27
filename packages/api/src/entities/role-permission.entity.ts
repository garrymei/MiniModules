import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('role_permissions')
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index()
  roleId: string;

  @Column({ type: 'varchar', length: 120 })
  resource: string;

  @Column({ type: 'varchar', length: 120 })
  action: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  module?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Index(['tenantId', 'roleId', 'resource', 'action', 'module'], { unique: true })
  uniqueRolePermission: string;
}
