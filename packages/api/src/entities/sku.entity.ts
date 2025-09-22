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
import { Product } from './product.entity'
import { OrderItem } from './order-item.entity'
import { OneToMany } from 'typeorm'

@Entity({ name: 'skus' })
export class Sku {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index('IDX_skus_product_id')
  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string

  @ManyToOne(() => Product, product => product.skus, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product!: Product

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  price!: string

  @Column({ type: 'integer', default: 0 })
  stock!: number

  @Column({ type: 'jsonb', nullable: true })
  spec: Record<string, unknown> | null = null

  @OneToMany(() => OrderItem, item => item.sku)
  orderItems!: OrderItem[]

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date
}
