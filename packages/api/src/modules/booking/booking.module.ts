import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingController } from './booking.controller';
import { VerificationController } from './controllers/verification.controller';
import { BookingService } from './booking.service';
import { BookingConflictService } from './services/booking-conflict.service';
import { VerificationService } from './services/verification.service';
import { Booking } from '../../entities/booking.entity';
import { Resource } from '../../entities/resource.entity';
import { UsageModule } from '../usage/usage.module';
import { NotifyModule } from '../notify/notify.module';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Resource]), UsageModule, NotifyModule],
  controllers: [BookingController, VerificationController],
  providers: [BookingService, BookingConflictService, VerificationService],
  exports: [BookingService, BookingConflictService, VerificationService],
})
export class BookingModule {}
