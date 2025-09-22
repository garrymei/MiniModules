import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Sku } from './sku.entity'

export enum ProductStatus {
  Draft = 'draft',
  Active = 'active',
  Archived = 'archived',
}

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index('IDX_products_tenant_id')
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string

  @Column({ type: 'varchar', length: 255 })
  title!: string

  @Column({ type: 'text', nullable: true })
  description: string | null = null

  @Column({ type: 'text', array: true, default: '{}' })
  images!: string[]

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.Draft,
  })
  status!: ProductStatus

  @Column({ type: 'jsonb', nullable: true })
  attrs: Record<string, unknown> | null = null

  @OneToMany(() => Sku, sku => sku.product, { cascade: true })
  skus!: Sku[]

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date
}
