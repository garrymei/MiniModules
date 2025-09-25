import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('webhook_deliveries')
export class WebhookDelivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  webhookId: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  event: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ type: 'int', nullable: true })
  statusCode?: number;

  @Column({ type: 'boolean', default: false })
  success: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  errorMessage?: string;

  @Column({ type: 'text', nullable: true })
  responseBody?: string;

  @Column({ type: 'int', default: 0 })
  durationMs: number;

  @Column({ type: 'int', default: 1 })
  attempt: number;

  @CreateDateColumn()
  createdAt: Date;
}
