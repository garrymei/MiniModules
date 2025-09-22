import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Resource } from './resource.entity'

export enum BookingStatus {
  Pending = 'PENDING',
  Confirmed = 'CONFIRMED',
  Cancelled = 'CANCELLED',
}

@Entity({ name: 'bookings' })
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index('IDX_bookings_resource_id')
  @Column({ name: 'resource_id', type: 'uuid' })
  resourceId!: string

  @ManyToOne(() => Resource, resource => resource.bookings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'resource_id' })
  resource!: Resource

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string

  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  userId!: string

  @Column({ type: 'timestamptz' })
  start!: Date

  @Column({ type: 'timestamptz' })
  end!: Date

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.Confirmed })
  status!: BookingStatus

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null = null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date
}
