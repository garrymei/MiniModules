import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('tenant_entitlements')
export class TenantEntitlementsSqlite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  @Index()
  tenantId: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  moduleKey: string;

  @Column({ 
    type: 'varchar', 
    length: 20, 
    default: 'enabled'
  })
  status: 'enabled' | 'disabled';

  @Column({ type: 'datetime', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
