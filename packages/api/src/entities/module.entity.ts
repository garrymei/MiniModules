import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm'
import { TenantModuleConfig } from './tenant-module-config.entity'

@Entity({ name: 'modules' })
export class ModuleEntity {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  id!: string

  @Column({ type: 'varchar', length: 255 })
  name!: string

  @OneToMany(() => TenantModuleConfig, config => config.module)
  tenantConfigs!: TenantModuleConfig[]
}
