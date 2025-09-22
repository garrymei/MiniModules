import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { ModuleEntity } from '../entities/module.entity'
import { TenantModuleConfig } from '../entities/tenant-module-config.entity'
import { Tenant } from '../entities/tenant.entity'
import { TenantConfigAdminController } from './tenant-config.admin.controller'
import { TenantConfigController } from './tenant-config.controller'
import { TenantConfigService } from './tenant-config.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, ModuleEntity, TenantModuleConfig]),
    AuthModule,
  ],
  controllers: [TenantConfigController, TenantConfigAdminController],
  providers: [TenantConfigService],
})
export class TenantConfigModule {}
