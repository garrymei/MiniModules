import type { TenantTheme } from '@minimodules/libs/config-schema'
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { TenantModuleConfig } from './tenant-module-config.entity'

@Entity({ name: 'tenants' })
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255 })
  name!: string

  @Column({ type: 'varchar', length: 100 })
  industry!: string

  @Column({ name: 'theme', type: 'jsonb', nullable: true })
  theme: TenantTheme | null = null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date

  @OneToMany(() => TenantModuleConfig, config => config.tenant)
  moduleConfigs!: TenantModuleConfig[]
}
