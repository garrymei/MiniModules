import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './modules/health/health.controller';

@Module({
  imports: [
    // 暂时不导入 TypeORM，专注于基础功能
  ],
  controllers: [HealthController],
})
export class AppMinimalModule {}
