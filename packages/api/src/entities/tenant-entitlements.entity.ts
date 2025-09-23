import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('tenant_entitlements')
export class TenantEntitlements {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  moduleKey: string;

  @Column({ 
    type: 'varchar', 
    length: 20, 
    default: 'enabled',
    enum: ['enabled', 'disabled']
  })
  status: 'enabled' | 'disabled';

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
