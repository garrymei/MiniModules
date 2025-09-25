import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Order } from '../../entities/order.entity';
import { Booking } from '../../entities/booking.entity';
import { NotifyModule } from '../notify/notify.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Booking]), NotifyModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
