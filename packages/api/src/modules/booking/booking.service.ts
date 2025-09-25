import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../../entities/booking.entity';
import { UsageService } from '../usage/usage.service';
import { UsageMetric } from '../../entities/usage-counter.entity';
import { NotifyService } from '../notify/notify.service';

export interface CreateBookingDto {
  tenantId: string;
  userId?: string;
  bookingDate: Date;
  startTime: string;
  endTime: string;
  peopleCount: number;
  metadata?: any;
}

export interface UpdateBookingDto {
  status?: BookingStatus;
  metadata?: any;
}

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    private readonly usageService: UsageService,
    private readonly notifyService: NotifyService,
  ) {}

  async createBooking(createBookingDto: CreateBookingDto): Promise<Booking> {
    await this.usageService.enforceQuota(createBookingDto.tenantId, UsageMetric.BOOKINGS);

    const booking = this.bookingRepository.create(createBookingDto);
    const saved = await this.bookingRepository.save(booking);

    await this.usageService.incrementUsage(createBookingDto.tenantId, UsageMetric.BOOKINGS, 1, {
      bookingId: saved.id,
      bookingDate: saved.bookingDate,
    });

    this.dispatchBookingCreated(saved).catch((error) => {
      this.logger.warn(`Failed to dispatch booking created notification`, error instanceof Error ? error.message : error);
    });

    return saved;
  }

  async getBookingsByTenant(tenantId: string, limit = 20, offset = 0): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getBookingById(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }
    return booking;
  }

  async getBookingsByUserId(tenantId: string, userId: string): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { tenantId, userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getBookingsByDate(tenantId: string, date: Date): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { tenantId, bookingDate: date },
      order: { startTime: 'ASC' },
    });
  }

  async updateBooking(id: string, updateBookingDto: UpdateBookingDto): Promise<Booking> {
    const booking = await this.getBookingById(id);
    Object.assign(booking, updateBookingDto);
    return this.bookingRepository.save(booking);
  }

  async deleteBooking(id: string): Promise<void> {
    const booking = await this.getBookingById(id);
    await this.bookingRepository.remove(booking);
  }

  private async dispatchBookingCreated(booking: Booking) {
    await this.notifyService.sendTemplateMessage({
      tenantId: booking.tenantId,
      templateKey: 'booking_created',
      toUser: booking.userId,
      data: {
        bookingId: booking.id,
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        peopleCount: booking.peopleCount,
        status: booking.status,
      },
    });

    await this.notifyService.triggerEvent(booking.tenantId, 'booking.created', {
      bookingId: booking.id,
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      peopleCount: booking.peopleCount,
      status: booking.status,
      createdAt: booking.createdAt,
    });
  }
}
