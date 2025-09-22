import type { ModuleConfigMap } from '@minimodules/libs/config-schema'
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm'
import { ModuleEntity } from './module.entity'
import { Tenant } from './tenant.entity'

@Entity({ name: 'tenant_module_configs' })
@Unique(['tenantId', 'moduleId'])
export class TenantModuleConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string

  @ManyToOne(() => Tenant, tenant => tenant.moduleConfigs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant

  @Column({ name: 'module_id', type: 'varchar', length: 100 })
  moduleId!: string

  @ManyToOne(() => ModuleEntity, module => module.tenantConfigs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'module_id' })
  module!: ModuleEntity

  @Column({ name: 'config_json', type: 'jsonb', default: () => "'{}'::jsonb" })
  configJson!: ModuleConfigMap

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date
}
