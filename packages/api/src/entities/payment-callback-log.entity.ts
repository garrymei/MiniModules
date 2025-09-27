import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('payment_callback_logs')
@Index(['gateway', 'createdAt'])
@Index(['status', 'createdAt'])
@Index(['requestId'], { unique: true })
export class PaymentCallbackLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  gateway: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  requestId: string;

  @Column({ type: 'jsonb' })
  rawData: any;

  @Column({ type: 'text', nullable: true })
  signature?: string;

  @Column({ type: 'jsonb', nullable: true })
  headers?: Record<string, string>;

  @Column({ type: 'varchar', length: 20, default: 'processing' })
  status: 'processing' | 'success' | 'failed';

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ type: 'jsonb', nullable: true })
  processedData?: {
    orderId: string;
    transactionId: string;
    amount: number;
    currency: string;
    status: 'success' | 'failed' | 'pending';
    paymentMethod: string;
    gateway: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
