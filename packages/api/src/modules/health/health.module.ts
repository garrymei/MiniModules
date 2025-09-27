import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { CacheService } from '../../common/services/cache.service';

@Module({
  controllers: [HealthController],
  providers: [HealthService, CacheService],
  exports: [HealthService],
})
export class HealthModule {}