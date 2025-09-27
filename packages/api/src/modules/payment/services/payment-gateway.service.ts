import { Injectable, Logger } from '@nestjs/common';
import { CreatePaymentDto, PaymentResponseDto, PaymentNotifyDto, PaymentMethod, PaymentStatus } from '../dto/payment.dto';
import * as crypto from 'crypto';

@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);

  /**
   * 创建支付订单
   */
  async createPayment(createDto: CreatePaymentDto): Promise<PaymentResponseDto> {
    const paymentId = this.generatePaymentId();
    const prepayId = this.generatePrepayId();
    
    this.logger.log(`Creating payment ${paymentId} for order ${createDto.orderId}`);

    // 根据支付方式生成不同的支付参数
    switch (createDto.method) {
      case PaymentMethod.WECHAT_JSAPI:
        return this.createWechatJSAPIPayment(paymentId, prepayId, createDto);
      case PaymentMethod.WECHAT_H5:
        return this.createWechatH5Payment(paymentId, prepayId, createDto);
      case PaymentMethod.WECHAT_NATIVE:
        return this.createWechatNativePayment(paymentId, prepayId, createDto);
      case PaymentMethod.ALIPAY_JSAPI:
        return this.createAlipayJSAPIPayment(paymentId, prepayId, createDto);
      case PaymentMethod.ALIPAY_H5:
        return this.createAlipayH5Payment(paymentId, prepayId, createDto);
      default:
        throw new Error(`Unsupported payment method: ${createDto.method}`);
    }
  }

  /**
   * 微信JSAPI支付
   */
  private async createWechatJSAPIPayment(
    paymentId: string,
    prepayId: string,
    createDto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    const timeStamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = this.generateNonceStr();
    const packageStr = `prepay_id=${prepayId}`;
    const signType = 'MD5';

    // 生成支付签名
    const paySign = this.generateWechatPaySign({
      appId: 'wx1234567890abcdef', // 实际应用中从配置获取
      timeStamp,
      nonceStr,
      package: packageStr,
      signType,
    });

    return {
      paymentId,
      prepayId,
      status: PaymentStatus.PENDING,
      jsapiParams: {
        appId: 'wx1234567890abcdef',
        timeStamp,
        nonceStr,
        package: packageStr,
        signType,
        paySign,
      },
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30分钟过期
    };
  }

  /**
   * 微信H5支付
   */
  private async createWechatH5Payment(
    paymentId: string,
    prepayId: string,
    createDto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    const paymentUrl = `https://wx.tenpay.com/cgi-bin/mmpayweb-bin/checkmweb?prepay_id=${prepayId}&package=Sign=WXPay`;

    return {
      paymentId,
      prepayId,
      status: PaymentStatus.PENDING,
      paymentUrl,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };
  }

  /**
   * 微信Native支付
   */
  private async createWechatNativePayment(
    paymentId: string,
    prepayId: string,
    createDto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    const qrCodeUrl = `weixin://wxpay/bizpayurl?pr=${prepayId}`;

    return {
      paymentId,
      prepayId,
      status: PaymentStatus.PENDING,
      qrCodeUrl,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };
  }

  /**
   * 支付宝JSAPI支付
   */
  private async createAlipayJSAPIPayment(
    paymentId: string,
    prepayId: string,
    createDto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    const timeStamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = this.generateNonceStr();
    const packageStr = `prepay_id=${prepayId}`;
    const signType = 'RSA2';

    // 生成支付宝支付签名
    const paySign = this.generateAlipayPaySign({
      appId: '2021001234567890', // 实际应用中从配置获取
      timeStamp,
      nonceStr,
      package: packageStr,
      signType,
    });

    return {
      paymentId,
      prepayId,
      status: PaymentStatus.PENDING,
      jsapiParams: {
        appId: '2021001234567890',
        timeStamp,
        nonceStr,
        package: packageStr,
        signType,
        paySign,
      },
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };
  }

  /**
   * 支付宝H5支付
   */
  private async createAlipayH5Payment(
    paymentId: string,
    prepayId: string,
    createDto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    const paymentUrl = `https://openapi.alipay.com/gateway.do?prepay_id=${prepayId}`;

    return {
      paymentId,
      prepayId,
      status: PaymentStatus.PENDING,
      paymentUrl,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };
  }

  /**
   * 处理支付通知
   */
  async handlePaymentNotify(notifyDto: PaymentNotifyDto): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Processing payment notify for payment ${notifyDto.paymentId}`);

    // 验证签名
    const isValid = this.verifyPaymentSign(notifyDto);
    if (!isValid) {
      this.logger.error(`Invalid payment signature for payment ${notifyDto.paymentId}`);
      return { success: false, message: 'Invalid signature' };
    }

    // 处理支付结果
    if (notifyDto.status === PaymentStatus.PAID) {
      this.logger.log(`Payment ${notifyDto.paymentId} completed successfully`);
      // 这里应该更新订单状态、发送通知等
      return { success: true, message: 'Payment processed successfully' };
    } else {
      this.logger.warn(`Payment ${notifyDto.paymentId} failed`);
      return { success: true, message: 'Payment failed' };
    }
  }

  /**
   * 查询支付状态
   */
  async queryPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    this.logger.log(`Querying payment status for ${paymentId}`);
    
    // 模拟查询支付状态
    // 实际应用中应该调用第三方支付API
    return PaymentStatus.PENDING;
  }

  /**
   * 申请退款
   */
  async refundPayment(
    paymentId: string,
    refundAmount: number,
    reason: string,
  ): Promise<{ success: boolean; refundId: string; message: string }> {
    this.logger.log(`Processing refund for payment ${paymentId}, amount: ${refundAmount}`);

    const refundId = this.generateRefundId();

    // 模拟退款处理
    // 实际应用中应该调用第三方支付API
    return {
      success: true,
      refundId,
      message: 'Refund processed successfully',
    };
  }

  /**
   * 生成支付ID
   */
  private generatePaymentId(): string {
    return `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成预支付ID
   */
  private generatePrepayId(): string {
    return `prepay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成退款ID
   */
  private generateRefundId(): string {
    return `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成随机字符串
   */
  private generateNonceStr(): string {
    return Math.random().toString(36).substr(2, 15);
  }

  /**
   * 生成微信支付签名
   */
  private generateWechatPaySign(params: Record<string, string>): string {
    // 微信支付签名算法
    const sortedKeys = Object.keys(params).sort();
    const stringA = sortedKeys
      .map(key => `${key}=${params[key]}`)
      .join('&');
    const stringSignTemp = `${stringA}&key=your_wechat_pay_key`; // 实际应用中从配置获取
    
    return crypto.createHash('md5').update(stringSignTemp).digest('hex').toUpperCase();
  }

  /**
   * 生成支付宝支付签名
   */
  private generateAlipayPaySign(params: Record<string, string>): string {
    // 支付宝签名算法（简化版）
    const sortedKeys = Object.keys(params).sort();
    const stringA = sortedKeys
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    // 实际应用中应该使用RSA私钥签名
    return crypto.createHash('sha256').update(stringA).digest('hex');
  }

  /**
   * 验证支付签名
   */
  private verifyPaymentSign(notifyDto: PaymentNotifyDto): boolean {
    // 实际应用中应该验证第三方支付平台的签名
    // 这里简化处理
    return notifyDto.sign && notifyDto.sign.length > 0;
  }
}
