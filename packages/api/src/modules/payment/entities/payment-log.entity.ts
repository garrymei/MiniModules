import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('payment_logs')
@Index(['tenantId', 'createdAt'])
@Index(['paymentId'])
@Index(['transactionId'])
export class PaymentLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  paymentId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  transactionId: string;

  @Column({ type: 'varchar', length: 50 })
  type: 'request' | 'response' | 'callback' | 'notify';

  @Column({ type: 'varchar', length: 20 })
  method: 'wechat_jsapi' | 'wechat_h5' | 'wechat_native' | 'alipay_jsapi' | 'alipay_h5';

  @Column({ type: 'varchar', length: 20 })
  status: 'pending' | 'success' | 'failed' | 'cancelled';

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount: number;

  @Column({ type: 'varchar', length: 3, nullable: true })
  currency: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  clientIp: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nonceStr: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  timeStamp: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  package: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  paySign: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  signType: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  appId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  openId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  prepayId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  codeUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  paymentUrl: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  qrCodeUrl: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bankType: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  feeType: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  isSubscribe: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mchId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  outTradeNo: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  resultCode: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  returnCode: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  returnMsg: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  errCode: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  errCodeDes: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tradeType: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tradeState: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tradeStateDesc: string;

  @Column({ type: 'timestamp', nullable: true })
  timeEnd: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  refundId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundFee: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  refundDesc: string;

  @Column({ type: 'timestamp', nullable: true })
  refundedAt: Date;

  @Column({ type: 'text', nullable: true })
  rawData: string;

  @Column({ type: 'text', nullable: true })
  signature: string;

  @Column({ type: 'boolean', default: false })
  signatureVerified: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
