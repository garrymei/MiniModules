import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantConfigController } from './tenant-config.controller';
import { TenantConfigService } from './tenant-config.service';
import { ConfigVersioningController, PlatformConfigController, PublicConfigController } from './controllers/config-versioning.controller';
import { ConfigVersioningService } from './services/config-versioning.service';
import { IndustryTemplateController } from './controllers/industry-template.controller';
import { IndustryTemplateService } from './services/industry-template.service';
import { TenantModuleConfig } from '../../entities/tenant-module-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TenantModuleConfig])],
  controllers: [
    TenantConfigController,
    ConfigVersioningController,
    PlatformConfigController,
    PublicConfigController,
    IndustryTemplateController,
  ],
  providers: [TenantConfigService, ConfigVersioningService, IndustryTemplateService],
  exports: [TenantConfigService, ConfigVersioningService, IndustryTemplateService],
})
export class TenantConfigModule {}
