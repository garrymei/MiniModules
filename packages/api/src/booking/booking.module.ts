import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { Booking } from '../entities/booking.entity'
import { Resource } from '../entities/resource.entity'
import { TimeSlotRule } from '../entities/time-slot-rule.entity'
import { BookingAdminController } from './booking.admin.controller'
import { BookingPublicController } from './booking.public.controller'
import { BookingService } from './booking.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([Resource, TimeSlotRule, Booking]),
    AuthModule,
  ],
  controllers: [BookingAdminController, BookingPublicController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
