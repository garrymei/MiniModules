import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { BookingService } from './booking.service'
import { CreateBookingDto } from './dto/create-booking.dto'

@Controller('api')
export class BookingPublicController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('booking/slots')
  getSlots(@Query('resourceId') resourceId: string, @Query('date') date: string) {
    return this.bookingService.listSlots(resourceId, date)
  }

  @Post('bookings')
  createBooking(@Body() body: CreateBookingDto) {
    return this.bookingService.createBooking(body)
  }
}
