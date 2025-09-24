import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Order } from '../../entities/order.entity';
import { Booking } from '../../entities/booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Booking])],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
