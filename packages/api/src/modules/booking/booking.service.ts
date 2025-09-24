import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../../entities/booking.entity';

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
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
  ) {}

  async createBooking(createBookingDto: CreateBookingDto): Promise<Booking> {
    const booking = this.bookingRepository.create(createBookingDto);
    return this.bookingRepository.save(booking);
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
}