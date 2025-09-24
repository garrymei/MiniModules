import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { BookingService, CreateBookingDto, UpdateBookingDto } from './booking.service';
import { Booking } from '../../entities/booking.entity';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RequireModule } from '../../decorators/require-module.decorator';

@ApiTags('booking')
@Controller('booking')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post('bookings')
  @RequireModule('booking')
  @ApiOperation({ summary: '创建预约' })
  @ApiResponse({ status: 201, description: '预约创建成功', type: Booking })
  async createBooking(@Body() createBookingDto: CreateBookingDto): Promise<Booking> {
    return this.bookingService.createBooking(createBookingDto);
  }

  @Get('bookings')
  @RequireModule('booking')
  @ApiOperation({ summary: '获取预约列表' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: '偏移量' })
  @ApiResponse({ status: 200, description: '预约列表', type: [Booking] })
  async getBookings(
    @Query('tenantId') tenantId: string,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ): Promise<Booking[]> {
    return this.bookingService.getBookingsByTenant(tenantId, limit, offset);
  }

  @Get('bookings/:id')
  @RequireModule('booking')
  @ApiOperation({ summary: '获取预约详情' })
  @ApiParam({ name: 'id', description: '预约ID' })
  @ApiResponse({ status: 200, description: '预约详情', type: Booking })
  @ApiResponse({ status: 404, description: '预约未找到' })
  async getBookingById(@Param('id') id: string): Promise<Booking> {
    return this.bookingService.getBookingById(id);
  }

  @Get('bookings/user/:userId')
  @RequireModule('booking')
  @ApiOperation({ summary: '获取用户预约列表' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiResponse({ status: 200, description: '用户预约列表', type: [Booking] })
  async getBookingsByUserId(
    @Param('userId') userId: string,
    @Query('tenantId') tenantId: string,
  ): Promise<Booking[]> {
    return this.bookingService.getBookingsByUserId(tenantId, userId);
  }

  @Get('bookings/date/:date')
  @RequireModule('booking')
  @ApiOperation({ summary: '按日期获取预约列表' })
  @ApiParam({ name: 'date', description: '预约日期' })
  @ApiResponse({ status: 200, description: '指定日期的预约列表', type: [Booking] })
  async getBookingsByDate(
    @Param('date') date: string,
    @Query('tenantId') tenantId: string,
  ): Promise<Booking[]> {
    return this.bookingService.getBookingsByDate(tenantId, new Date(date));
  }

  @Put('bookings/:id')
  @RequireModule('booking')
  @ApiOperation({ summary: '更新预约' })
  @ApiParam({ name: 'id', description: '预约ID' })
  @ApiResponse({ status: 200, description: '预约更新成功', type: Booking })
  @ApiResponse({ status: 404, description: '预约未找到' })
  async updateBooking(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
  ): Promise<Booking> {
    return this.bookingService.updateBooking(id, updateBookingDto);
  }

  @Delete('bookings/:id')
  @RequireModule('booking')
  @ApiOperation({ summary: '删除预约' })
  @ApiParam({ name: 'id', description: '预约ID' })
  @ApiResponse({ status: 200, description: '预约删除成功' })
  @ApiResponse({ status: 404, description: '预约未找到' })
  async deleteBooking(@Param('id') id: string): Promise<void> {
    return this.bookingService.deleteBooking(id);
  }
}