import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Booking } from './booking.entity'
import { TimeSlotRule } from './time-slot-rule.entity'

@Entity({ name: 'resources' })
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string

  @Column({ type: 'varchar', length: 255 })
  name!: string

  @Column({ type: 'varchar', length: 100 })
  type!: string

  @Column({ type: 'jsonb', nullable: true })
  meta: Record<string, unknown> | null = null

  @OneToMany(() => TimeSlotRule, rule => rule.resource, { cascade: true })
  rules!: TimeSlotRule[]

  @OneToMany(() => Booking, booking => booking.resource)
  bookings!: Booking[]

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date
}
