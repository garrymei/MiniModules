import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Resource } from './resource.entity'

@Entity({ name: 'time_slot_rules' })
export class TimeSlotRule {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'resource_id', type: 'uuid' })
  resourceId!: string

  @ManyToOne(() => Resource, resource => resource.rules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'resource_id' })
  resource!: Resource

  @Column({ name: 'slot_minutes', type: 'integer', default: 30 })
  slotMinutes!: number

  @Column({ name: 'open_hours', type: 'jsonb' })
  openHours!: Record<string, unknown>

  @Column({ name: 'max_book_days', type: 'integer', default: 30 })
  maxBookDays!: number

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date
}
