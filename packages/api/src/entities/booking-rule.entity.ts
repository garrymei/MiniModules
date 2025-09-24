import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Resource } from './resource.entity';

export enum BookingRuleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

@Entity('booking_rules')
export class BookingRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  resourceId: string;

  @Column({ type: 'int', default: 60 })
  slotMinutes: number;

  @Column({ type: 'jsonb' })
  openHours: any;

  @Column({ type: 'int', default: 7 })
  maxBookableDays: number;

  @Column({ type: 'int', default: 1 })
  minBookableHours: number;

  @Column({ type: 'int', default: 0 })
  maxBookableHours: number;

  @Column({ type: 'jsonb', nullable: true })
  blackoutDates: string[];

  @Column({ type: 'jsonb', nullable: true })
  specialRules: any;

  @Column({ 
    type: 'enum', 
    enum: BookingRuleStatus, 
    default: BookingRuleStatus.ACTIVE 
  })
  status: BookingRuleStatus;

  @Column({ type: 'boolean', default: true })
  allowSameDayBooking: boolean;

  @Column({ type: 'boolean', default: false })
  requireApproval: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Resource, resource => resource.id)
  @JoinColumn({ name: 'resourceId' })
  resource: Resource;
}
