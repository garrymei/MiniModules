import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { addMinutes, differenceInCalendarDays, isBefore } from 'date-fns'
import { DataSource, Repository } from 'typeorm'
import { Booking, BookingStatus } from '../entities/booking.entity'
import { Resource } from '../entities/resource.entity'
import { TimeSlotRule } from '../entities/time-slot-rule.entity'
import { CreateBookingDto } from './dto/create-booking.dto'
import { CreateResourceDto } from './dto/create-resource.dto'
import { CreateTimeSlotRuleDto } from './dto/create-rule.dto'

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

const parseDateInput = (date: string) => {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException('Invalid date input')
  }
  return parsed
}

const buildDate = (date: string, time: string) => {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  if (
    [year, month, day, hour, minute].some(v => Number.isNaN(v)) ||
    hour > 23 ||
    minute > 59
  ) {
    throw new BadRequestException('Invalid slot time definition')
  }
  return new Date(Date.UTC(year, month - 1, day, hour, minute))
}

const isOverlap = (startA: Date, endA: Date, startB: Date, endB: Date) => {
  return startA < endB && startB < endA
}

@Injectable()
export class BookingService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
    @InjectRepository(TimeSlotRule)
    private readonly ruleRepository: Repository<TimeSlotRule>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async createResource(dto: CreateResourceDto) {
    if (!dto.tenantId || !dto.name || !dto.type) {
      throw new BadRequestException('tenantId, name and type are required')
    }

    const resource = this.resourceRepository.create({
      tenantId: dto.tenantId,
      name: dto.name,
      type: dto.type,
      meta: dto.meta ?? null,
    })

    return this.resourceRepository.save(resource)
  }

  async createRule(dto: CreateTimeSlotRuleDto) {
    const resource = await this.resourceRepository.findOne({
      where: { id: dto.resourceId },
    })

    if (!resource) {
      throw new NotFoundException('Resource not found')
    }

    if (dto.slotMinutes <= 0) {
      throw new BadRequestException('slotMinutes must be positive')
    }

    if (dto.maxBookDays <= 0) {
      throw new BadRequestException('maxBookDays must be positive')
    }

    const rule = this.ruleRepository.create({
      resourceId: dto.resourceId,
      slotMinutes: dto.slotMinutes,
      openHours: dto.openHours,
      maxBookDays: dto.maxBookDays,
    })

    return this.ruleRepository.save(rule)
  }

  async listSlots(resourceId: string, date: string) {
    if (!resourceId || !date) {
      throw new BadRequestException('resourceId and date are required')
    }

    const resource = await this.resourceRepository.findOne({
      where: { id: resourceId },
      relations: { rules: true },
    })

    if (!resource) {
      throw new NotFoundException('Resource not found')
    }

    if (!resource.rules.length) {
      throw new NotFoundException('No slot rule configured for resource')
    }

    const rule = resource.rules.sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    )[0]

    const targetDate = date.split('T')[0]
    const dateObj = parseDateInput(`${targetDate}T00:00:00Z`)

    const diffDays = Math.abs(differenceInCalendarDays(dateObj, new Date()))
    if (diffDays > rule.maxBookDays) {
      throw new BadRequestException('Requested date exceeds booking window')
    }

    const dayKey = DAY_KEYS[dateObj.getUTCDay()]
    const intervals = (rule.openHours[dayKey] as [string, string][]) ?? []

    if (!intervals.length) {
      return { resourceId, date: targetDate, slots: [] }
    }

    const dayStart = buildDate(targetDate, '00:00')
    const dayEnd = addMinutes(dayStart, 24 * 60)

    const bookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.resourceId = :resourceId', { resourceId })
      .andWhere('booking.status != :cancelled', {
        cancelled: BookingStatus.Cancelled,
      })
      .andWhere('booking.start < :dayEnd', { dayEnd })
      .andWhere('booking.end > :dayStart', { dayStart })
      .getMany()

    const slots: Array<{ start: string; end: string; available: boolean }> = []

    for (const [startTime, endTime] of intervals) {
      const slotStart = buildDate(targetDate, startTime)
      const slotEnd = buildDate(targetDate, endTime)

      let current = slotStart
      while (isBefore(current, slotEnd)) {
        const next = addMinutes(current, rule.slotMinutes)
        if (next > slotEnd) {
          break
        }
        const overlap = bookings.some(booking =>
          booking.status !== BookingStatus.Cancelled &&
          isOverlap(current, next, booking.start, booking.end),
        )
        const isPast = current.getTime() <= Date.now()

        slots.push({
          start: current.toISOString(),
          end: next.toISOString(),
          available: !overlap && !isPast,
        })

        current = next
      }
    }

    return { resourceId, date: targetDate, slots }
  }

  async createBooking(dto: CreateBookingDto) {
    const resource = await this.resourceRepository.findOne({
      where: { id: dto.resourceId },
      relations: { rules: true },
    })

    if (!resource) {
      throw new NotFoundException('Resource not found')
    }

    if (!resource.rules.length) {
      throw new BadRequestException('Resource missing booking rule')
    }

    if (resource.tenantId !== dto.tenantId) {
      throw new BadRequestException('Tenant mismatch')
    }

    const rule = resource.rules.sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    )[0]

    const start = new Date(dto.start)
    const end = new Date(dto.end)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid start or end time')
    }

    if (!(start < end)) {
      throw new BadRequestException('Start time must be before end time')
    }

    if (start.getTime() < Date.now()) {
      throw new BadRequestException('Cannot book past time slots')
    }

    const durationMinutes = (end.getTime() - start.getTime()) / 60000
    if (durationMinutes % rule.slotMinutes !== 0) {
      throw new BadRequestException('Booking must align to slot duration')
    }

    const dateKey = start.toISOString().split('T')[0]
    const dayKey = DAY_KEYS[start.getUTCDay()]
    const intervals = (rule.openHours[dayKey] as [string, string][]) ?? []

    const isWithinInterval = intervals.some(([from, to]) => {
      const intervalStart = buildDate(dateKey, from)
      const intervalEnd = buildDate(dateKey, to)

      if (!(start >= intervalStart && end <= intervalEnd)) {
        return false
      }

      const offsetMinutes = (start.getTime() - intervalStart.getTime()) / 60000
      return offsetMinutes % rule.slotMinutes === 0
    })

    if (!isWithinInterval) {
      throw new BadRequestException('Booking outside of open hours')
    }

    const diffDays = differenceInCalendarDays(start, new Date())
    if (diffDays > rule.maxBookDays) {
      throw new BadRequestException('Booking exceeds maxBookDays')
    }

    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const bookingRepo = queryRunner.manager.getRepository(Booking)

      const conflicts = await bookingRepo
        .createQueryBuilder('booking')
        .where('booking.resourceId = :resourceId', { resourceId: dto.resourceId })
        .andWhere('booking.status != :cancelled', {
          cancelled: BookingStatus.Cancelled,
        })
        .andWhere('booking.start < :end', { end })
        .andWhere('booking.end > :start', { start })
        .setLock('pessimistic_write')
        .getMany()

      if (conflicts.length) {
        throw new BadRequestException('Time slot already booked')
      }

      const booking = bookingRepo.create({
        resourceId: dto.resourceId,
        tenantId: dto.tenantId,
        userId: dto.userId,
        start,
        end,
        status: BookingStatus.Confirmed,
        metadata: dto.metadata ?? null,
      })

      const saved = await bookingRepo.save(booking)
      await queryRunner.commitTransaction()
      return saved
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }
  }
}
