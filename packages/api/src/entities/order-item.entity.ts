import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Order } from './order.entity'
import { Sku } from './sku.entity'

@Entity({ name: 'order_items' })
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string

  @ManyToOne(() => Order, order => order.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order!: Order

  @Column({ name: 'sku_id', type: 'uuid' })
  skuId!: string

  @ManyToOne(() => Sku, sku => sku.orderItems)
  @JoinColumn({ name: 'sku_id' })
  sku!: Sku

  @Column({ type: 'integer' })
  quantity!: number

  @Column({ name: 'unit_price', type: 'numeric', precision: 12, scale: 2 })
  unitPrice!: string

  @Column({ name: 'total_price', type: 'numeric', precision: 12, scale: 2 })
  totalPrice!: string

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date
}
