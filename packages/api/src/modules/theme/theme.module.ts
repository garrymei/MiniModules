import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThemeController, PublicThemeController } from './theme.controller';
import { ThemeService } from './theme.service';
import { TenantModuleConfig } from '../../entities/tenant-module-config.entity';
import { ConfigVersioningService } from '../tenant-config/services/config-versioning.service';

@Module({
  imports: [TypeOrmModule.forFeature([TenantModuleConfig])],
  controllers: [ThemeController, PublicThemeController],
  providers: [ThemeService, ConfigVersioningService],
  exports: [ThemeService],
})
export class ThemeModule {}
