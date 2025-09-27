import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  name: string;

  @Column({ type: 'varchar', length: 50, default: 'custom' })
  type: 'custom' | 'system';

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Index(['tenantId', 'name'], { unique: true })
  uniqueRole: string;
}
