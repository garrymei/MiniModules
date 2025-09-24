import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantEntitlement } from '../../entities/tenant-entitlement.entity';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { ModuleSpecService } from './module-spec.service';
import { ModuleDependencyService } from './module-dependency.service';

@Module({
  imports: [TypeOrmModule.forFeature([TenantEntitlement])],
  controllers: [PlatformController],
  providers: [PlatformService, ModuleSpecService, ModuleDependencyService],
  exports: [PlatformService, ModuleSpecService, ModuleDependencyService],
})
export class PlatformModule {}