import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsageController } from './usage.controller';
import { UsageService } from './usage.service';
import { UsageCounter } from '../../entities/usage-counter.entity';
import { TenantQuota } from '../../entities/tenant-quota.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UsageCounter, TenantQuota])],
  controllers: [UsageController],
  providers: [UsageService],
  exports: [UsageService],
})
export class UsageModule {}
