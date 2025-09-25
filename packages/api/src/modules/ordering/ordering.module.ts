import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderingController } from './ordering.controller';
import { OrderingService } from './ordering.service';
import { Order } from '../../entities/order.entity';
import { UsageModule } from '../usage/usage.module';
import { NotifyModule } from '../notify/notify.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), UsageModule, NotifyModule],
  controllers: [OrderingController],
  providers: [OrderingService],
  exports: [OrderingService],
})
export class OrderingModule {}
