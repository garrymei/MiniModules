import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { OrderItem } from './order-item.entity'

export enum OrderStatus {
  Pending = 'PENDING',
  Paid = 'PAID',
  Cancelled = 'CANCELLED',
}

@Entity({ name: 'orders' })
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index('IDX_orders_tenant_id')
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string

  @Index('IDX_orders_user_id')
  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  userId!: string

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount!: string

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.Pending })
  status!: OrderStatus

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null = null

  @OneToMany(() => OrderItem, item => item.order, { cascade: true })
  items!: OrderItem[]

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date
}
