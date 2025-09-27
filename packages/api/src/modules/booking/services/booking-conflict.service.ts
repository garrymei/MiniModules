import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Booking } from '../../../entities/booking.entity';
import { Resource } from '../../../entities/resource.entity';
import { BusinessException, BusinessErrorCode } from '../../../common/errors/business.exception';

export interface BookingConflictCheck {
  hasConflict: boolean;
  conflictingBookings: Booking[];
  availableSlots: string[];
}

@Injectable()
export class BookingConflictService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Resource)
    private resourceRepository: Repository<Resource>,
    private dataSource: DataSource,
  ) {}

  /**
   * 检查预约时间冲突
   */
  async checkBookingConflict(
    resourceId: string,
    bookingDate: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string,
  ): Promise<BookingConflictCheck> {
    const query = this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.resourceId = :resourceId', { resourceId })
      .andWhere('booking.bookingDate = :bookingDate', { bookingDate })
      .andWhere('booking.status IN (:...statuses)', { 
        statuses: ['confirmed', 'checked_in'] 
      })
      .andWhere(
        '(booking.startTime < :endTime AND booking.endTime > :startTime)',
        { startTime, endTime }
      );

    if (excludeBookingId) {
      query.andWhere('booking.id != :excludeBookingId', { excludeBookingId });
    }

    const conflictingBookings = await query.getMany();

    return {
      hasConflict: conflictingBookings.length > 0,
      conflictingBookings,
      availableSlots: await this.getAvailableSlots(resourceId, bookingDate),
    };
  }

  /**
   * 使用事务创建预约，防止并发冲突
   */
  async createBookingWithConflictCheck(
    tenantId: string,
    resourceId: string,
    bookingDate: string,
    startTime: string,
    endTime: string,
    peopleCount: number,
    userId?: string,
    metadata?: any,
  ): Promise<Booking> {
    return await this.dataSource.transaction(async (manager) => {
      // 1. 锁定资源记录
      const resource = await manager.findOne(Resource, {
        where: { id: resourceId, tenantId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!resource) {
        throw new BusinessException(
          BusinessErrorCode.RESOURCE_NOT_FOUND,
          'Resource not found',
        );
      }

      if (!resource.isBookable) {
        throw new BusinessException(
          BusinessErrorCode.BOOKING_SLOT_UNAVAILABLE,
          'Resource is not bookable',
        );
      }

      // 检查资源容量
      if (resource.capacity && peopleCount > resource.capacity) {
        throw new BusinessException(
          BusinessErrorCode.RESOURCE_CAPACITY_EXCEEDED,
          `Resource capacity exceeded. Max: ${resource.capacity}, Requested: ${peopleCount}`,
        );
      }

      // 2. 检查时间冲突（在事务中）
      const conflictCheck = await this.checkBookingConflictInTransaction(
        manager,
        resourceId,
        bookingDate,
        startTime,
        endTime,
      );

      if (conflictCheck.hasConflict) {
        throw new BusinessException(
          BusinessErrorCode.CONFLICT_SLOT,
          `Time slot conflicts with existing booking: ${conflictCheck.conflictingBookings.map(b => `${b.startTime}-${b.endTime}`).join(', ')}`,
        );
      }

      // 3. 验证时间格式和逻辑
      this.validateTimeSlot(startTime, endTime);

      // 4. 生成核销码
      const verificationCode = this.generateVerificationCode();

      // 5. 创建预约
      const booking = manager.create(Booking, {
        tenantId,
        resourceId,
        bookingDate: new Date(bookingDate),
        startTime,
        endTime,
        peopleCount,
        userId,
        metadata,
        status: 'confirmed',
        verificationCode,
      });

      try {
        return await manager.save(booking);
      } catch (error) {
        // 处理唯一约束冲突
        if (error.code === '23505' && error.constraint === 'unique_booking_slot') {
          throw new BusinessException(
            BusinessErrorCode.CONFLICT_SLOT,
            'This time slot is already booked',
          );
        }
        throw error;
      }
    });
  }

  /**
   * 在事务中检查预约冲突
   */
  private async checkBookingConflictInTransaction(
    manager: any,
    resourceId: string,
    bookingDate: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string,
  ): Promise<BookingConflictCheck> {
    // 使用数据库级别的唯一约束检查
    const conflictingBookings = await manager
      .createQueryBuilder(Booking, 'booking')
      .where('booking.resourceId = :resourceId', { resourceId })
      .andWhere('booking.bookingDate = :bookingDate', { bookingDate })
      .andWhere('booking.status IN (:...statuses)', { 
        statuses: ['confirmed', 'checked_in'] 
      })
      .andWhere(
        '(booking.startTime < :endTime AND booking.endTime > :startTime)',
        { startTime, endTime }
      );

    if (excludeBookingId) {
      conflictingBookings.andWhere('booking.id != :excludeBookingId', { excludeBookingId });
    }

    const conflicts = await conflictingBookings.getMany();

    // 额外的重叠检查
    const overlappingBookings = conflicts.filter(booking => {
      const bookingStart = this.timeToMinutes(booking.startTime);
      const bookingEnd = this.timeToMinutes(booking.endTime);
      const requestStart = this.timeToMinutes(startTime);
      const requestEnd = this.timeToMinutes(endTime);

      // 检查时间重叠
      return (bookingStart < requestEnd && bookingEnd > requestStart);
    });

    return {
      hasConflict: overlappingBookings.length > 0,
      conflictingBookings: overlappingBookings,
      availableSlots: [], // 在事务中不计算可用时段
    };
  }

  /**
   * 检查资源容量冲突
   */
  async checkCapacityConflict(
    resourceId: string,
    bookingDate: string,
    startTime: string,
    endTime: string,
    peopleCount: number,
    excludeBookingId?: string,
  ): Promise<{ hasCapacityConflict: boolean; currentCapacity: number; maxCapacity: number }> {
    const resource = await this.resourceRepository.findOne({
      where: { id: resourceId },
    });

    if (!resource || !resource.capacity) {
      return { hasCapacityConflict: false, currentCapacity: 0, maxCapacity: 0 };
    }

    // 计算同时段的总人数
    const overlappingBookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.resourceId = :resourceId', { resourceId })
      .andWhere('booking.bookingDate = :bookingDate', { bookingDate })
      .andWhere('booking.status IN (:...statuses)', { 
        statuses: ['confirmed', 'checked_in'] 
      })
      .andWhere(
        '(booking.startTime < :endTime AND booking.endTime > :startTime)',
        { startTime, endTime }
      );

    if (excludeBookingId) {
      overlappingBookings.andWhere('booking.id != :excludeBookingId', { excludeBookingId });
    }

    const bookings = await overlappingBookings.getMany();
    const currentCapacity = bookings.reduce((total, booking) => total + booking.peopleCount, 0);

    return {
      hasCapacityConflict: currentCapacity + peopleCount > resource.capacity,
      currentCapacity,
      maxCapacity: resource.capacity,
    };
  }

  /**
   * 批量检查预约冲突
   */
  async batchCheckConflicts(
    requests: Array<{
      resourceId: string;
      bookingDate: string;
      startTime: string;
      endTime: string;
      peopleCount: number;
    }>,
  ): Promise<Array<{
    index: number;
    hasConflict: boolean;
    conflictingBookings: Booking[];
    capacityConflict?: { hasCapacityConflict: boolean; currentCapacity: number; maxCapacity: number };
  }>> {
    const results = [];

    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      
      const conflictCheck = await this.checkBookingConflict(
        request.resourceId,
        request.bookingDate,
        request.startTime,
        request.endTime,
      );

      const capacityCheck = await this.checkCapacityConflict(
        request.resourceId,
        request.bookingDate,
        request.startTime,
        request.endTime,
        request.peopleCount,
      );

      results.push({
        index: i,
        hasConflict: conflictCheck.hasConflict || capacityCheck.hasCapacityConflict,
        conflictingBookings: conflictCheck.conflictingBookings,
        capacityConflict: capacityCheck,
      });
    }

    return results;
  }

  /**
   * 获取可用时段
   */
  async getAvailableSlots(resourceId: string, bookingDate: string): Promise<string[]> {
    const resource = await this.resourceRepository.findOne({
      where: { id: resourceId },
    });

    if (!resource) {
      return [];
    }

    // 获取已预约的时段
    const existingBookings = await this.bookingRepository.find({
      where: {
        resourceId,
        bookingDate: new Date(bookingDate),
        status: 'confirmed',
      },
    });

    // 生成可用时段（简化实现）
    const allSlots = this.generateTimeSlots('09:00', '22:00', 60); // 1小时时段
    const bookedSlots = existingBookings.map(booking => booking.startTime);
    
    return allSlots.filter(slot => !bookedSlots.includes(slot));
  }

  /**
   * 生成时间段
   */
  private generateTimeSlots(startTime: string, endTime: string, durationMinutes: number): string[] {
    const slots: string[] = [];
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    
    for (let time = start; time < end; time += durationMinutes) {
      slots.push(this.minutesToTime(time));
    }
    
    return slots;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * 验证时间槽格式和逻辑
   */
  private validateTimeSlot(startTime: string, endTime: string): void {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    if (start >= end) {
      throw new BusinessException(
        BusinessErrorCode.INVALID_PARAMS,
        'Start time must be before end time',
      );
    }

    if (end - start < 30) { // 最少30分钟
      throw new BusinessException(
        BusinessErrorCode.INVALID_PARAMS,
        'Booking duration must be at least 30 minutes',
      );
    }

    if (end - start > 480) { // 最多8小时
      throw new BusinessException(
        BusinessErrorCode.INVALID_PARAMS,
        'Booking duration cannot exceed 8 hours',
      );
    }
  }

  /**
   * 生成核销码
   */
  private generateVerificationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
