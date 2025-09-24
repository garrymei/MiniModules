import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ExportJob } from '../../entities/export-job.entity';
import { Order } from '../../entities/order.entity';
import { Booking } from '../../entities/booking.entity';
import { Product } from '../../entities/product.entity';
import { Resource } from '../../entities/resource.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { UsageCounter } from '../../entities/usage-counter.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExportJob,
      Order,
      Booking,
      Product,
      Resource,
      AuditLog,
      UsageCounter,
    ])
  ],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
