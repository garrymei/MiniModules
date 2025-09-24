import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft'
}

export enum ProductType {
  FOOD = 'food',
  GOODS = 'goods',
  SERVICE = 'service'
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'jsonb', nullable: true })
  images: string[];

  @Column({ 
    type: 'enum', 
    enum: ProductType, 
    default: ProductType.GOODS 
  })
  type: ProductType;

  @Column({ 
    type: 'enum', 
    enum: ProductStatus, 
    default: ProductStatus.ACTIVE 
  })
  status: ProductStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  basePrice: number;

  @Column({ type: 'jsonb', nullable: true })
  attributes: any;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
