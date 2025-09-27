import { IsString, IsNumber, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentMethod {
  WECHAT_JSAPI = 'wechat_jsapi',
  WECHAT_H5 = 'wechat_h5',
  WECHAT_NATIVE = 'wechat_native',
  ALIPAY_JSAPI = 'alipay_jsapi',
  ALIPAY_H5 = 'alipay_h5',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDING = 'refunding',
  REFUNDED = 'refunded',
}

export class CreatePaymentDto {
  @ApiProperty({ description: '订单ID' })
  @IsString()
  orderId!: string;

  @ApiProperty({ description: '支付金额（分）' })
  @IsNumber()
  amount!: number;

  @ApiProperty({ description: '支付方式', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiProperty({ description: '支付描述' })
  @IsString()
  description!: string;

  @ApiProperty({ description: '用户IP地址', required: false })
  @IsOptional()
  @IsString()
  clientIp?: string;

  @ApiProperty({ description: '用户OpenID（JSAPI支付必需）', required: false })
  @IsOptional()
  @IsString()
  openId?: string;

  @ApiProperty({ description: '扩展参数', required: false })
  @IsOptional()
  @IsObject()
  extra?: Record<string, any>;
}

export class PaymentResponseDto {
  @ApiProperty({ description: '支付ID' })
  paymentId!: string;

  @ApiProperty({ description: '预支付ID' })
  prepayId!: string;

  @ApiProperty({ description: '支付状态', enum: PaymentStatus })
  status!: PaymentStatus;

  @ApiProperty({ description: '支付参数（JSAPI）', required: false })
  jsapiParams?: {
    appId: string;
    timeStamp: string;
    nonceStr: string;
    package: string;
    signType: string;
    paySign: string;
  };

  @ApiProperty({ description: '支付URL（H5/Native）', required: false })
  paymentUrl?: string;

  @ApiProperty({ description: '二维码URL（Native）', required: false })
  qrCodeUrl?: string;

  @ApiProperty({ description: '过期时间' })
  expiresAt!: Date;
}

export class PaymentNotifyDto {
  @ApiProperty({ description: '支付ID' })
  @IsString()
  paymentId!: string;

  @ApiProperty({ description: '支付状态', enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  status!: PaymentStatus;

  @ApiProperty({ description: '第三方交易号' })
  @IsString()
  transactionId!: string;

  @ApiProperty({ description: '支付完成时间' })
  @IsString()
  paidAt!: string;

  @ApiProperty({ description: '签名' })
  @IsString()
  sign!: string;

  @ApiProperty({ description: '原始通知数据' })
  @IsObject()
  rawData!: Record<string, any>;
}

export class RefundPaymentDto {
  @ApiProperty({ description: '支付ID' })
  @IsString()
  paymentId!: string;

  @ApiProperty({ description: '退款金额（分）' })
  @IsNumber()
  refundAmount!: number;

  @ApiProperty({ description: '退款原因' })
  @IsString()
  reason!: string;

  @ApiProperty({ description: '操作员ID' })
  @IsString()
  operatorId!: string;
}
