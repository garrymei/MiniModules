import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  USED = 'used',
  EXPIRED = 'expired'
}

@Entity('bookings')
@Unique('unique_booking_slot', ['resourceId', 'bookingDate', 'startTime', 'endTime'])
@Unique('unique_booking_slot_with_status', ['resourceId', 'bookingDate', 'startTime', 'endTime', 'status'], {
  where: '"status" IN (\'confirmed\', \'checked_in\')'
})
@Index(['tenantId', 'resourceId', 'bookingDate'])
@Index(['tenantId', 'userId'])
@Index(['tenantId', 'bookingDate', 'status'])
@Index(['verificationCode'], { unique: true, where: '"verificationCode" IS NOT NULL' })
@Index(['resourceId', 'bookingDate', 'startTime', 'endTime', 'status'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  resourceId: string;

  @Column({ type: 'date' })
  bookingDate: Date;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column()
  peopleCount: number;

  @Column({ 
    type: 'enum', 
    enum: BookingStatus, 
    default: BookingStatus.CONFIRMED 
  })
  status: BookingStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ type: 'varchar', length: 100, nullable: true })
  verificationCode: string;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}