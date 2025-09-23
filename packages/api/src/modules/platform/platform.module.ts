import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { TenantEntitlements } from '../../entities/tenant-entitlements.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TenantEntitlements])],
  controllers: [PlatformController],
  providers: [PlatformService],
  exports: [PlatformService],
})
export class PlatformModule {}
