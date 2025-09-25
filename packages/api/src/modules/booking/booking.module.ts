import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { Booking } from '../../entities/booking.entity';
import { UsageModule } from '../usage/usage.module';
import { NotifyModule } from '../notify/notify.module';

@Module({
  imports: [TypeOrmModule.forFeature([Booking]), UsageModule, NotifyModule],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
