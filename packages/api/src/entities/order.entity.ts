import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  USED = 'used',
  REFUNDING = 'refunding',
  REFUNDED = 'refunded'
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({ unique: true })
  orderNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ 
    type: 'enum', 
    enum: OrderStatus, 
    default: OrderStatus.PENDING 
  })
  status: OrderStatus;

  @Column({ 
    type: 'enum', 
    enum: ['dine_in', 'takeout'], 
    default: 'dine_in' 
  })
  orderType: 'dine_in' | 'takeout';

  @Column({ type: 'jsonb', nullable: true })
  items: any;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ type: 'varchar', length: 120, nullable: true })
  @Index({ unique: true, where: '"idempotencyKey" IS NOT NULL' })
  idempotencyKey?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}