import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentLog } from '../entities/payment-log.entity';
import * as crypto from 'crypto';

export interface PaymentRequestData {
  tenantId: string;
  paymentId?: string;
  transactionId?: string;
  type: 'request' | 'response' | 'callback' | 'notify';
  method: string;
  status: string;
  amount?: number;
  currency?: string;
  clientIp?: string;
  userAgent?: string;
  nonceStr?: string;
  timeStamp?: string;
  package?: string;
  paySign?: string;
  signType?: string;
  appId?: string;
  openId?: string;
  prepayId?: string;
  codeUrl?: string;
  paymentUrl?: string;
  qrCodeUrl?: string;
  rawData?: any;
  signature?: string;
  errorMessage?: string;
  metadata?: any;
}

@Injectable()
export class PaymentSecurityService {
  private readonly logger = new Logger(PaymentSecurityService.name);

  constructor(
    @InjectRepository(PaymentLog)
    private paymentLogRepository: Repository<PaymentLog>,
  ) {}

  /**
   * 记录支付请求日志
   */
  async logPaymentRequest(data: PaymentRequestData): Promise<PaymentLog> {
    const log = this.paymentLogRepository.create({
      tenantId: data.tenantId,
      paymentId: data.paymentId,
      transactionId: data.transactionId,
      type: data.type,
      method: data.method as any,
      status: data.status as any,
      amount: data.amount,
      currency: data.currency,
      clientIp: data.clientIp,
      userAgent: data.userAgent,
      nonceStr: data.nonceStr,
      timeStamp: data.timeStamp,
      package: data.package,
      paySign: data.paySign,
      signType: data.signType,
      appId: data.appId,
      openId: data.openId,
      prepayId: data.prepayId,
      codeUrl: data.codeUrl,
      paymentUrl: data.paymentUrl,
      qrCodeUrl: data.qrCodeUrl,
      rawData: data.rawData ? JSON.stringify(data.rawData) : null,
      signature: data.signature,
      signatureVerified: data.signature ? this.verifySignature(data) : false,
      errorMessage: data.errorMessage,
      metadata: data.metadata,
    });

    const saved = await this.paymentLogRepository.save(log);
    
    this.logger.log(`Payment ${data.type} logged for tenant ${data.tenantId}, payment ${data.paymentId}`);
    
    return saved;
  }

  /**
   * 验证微信支付签名
   */
  verifyWechatPaySignature(params: Record<string, string>, key: string): boolean {
    try {
      // 1. 参数排序
      const sortedKeys = Object.keys(params).sort();
      
      // 2. 拼接字符串
      const stringA = sortedKeys
        .filter(key => key !== 'sign' && params[key] !== '' && params[key] != null)
        .map(key => `${key}=${params[key]}`)
        .join('&');
      
      const stringSignTemp = `${stringA}&key=${key}`;
      
      // 3. MD5加密并转大写
      const sign = crypto.createHash('md5').update(stringSignTemp).digest('hex').toUpperCase();
      
      // 4. 验证签名
      return sign === params.sign;
    } catch (error) {
      this.logger.error('Wechat pay signature verification failed:', error);
      return false;
    }
  }

  /**
   * 验证支付宝签名
   */
  verifyAlipaySignature(params: Record<string, string>, publicKey: string): boolean {
    try {
      // 1. 参数排序
      const sortedKeys = Object.keys(params).sort();
      
      // 2. 拼接字符串
      const stringA = sortedKeys
        .filter(key => key !== 'sign' && key !== 'sign_type' && params[key] !== '' && params[key] != null)
        .map(key => `${key}=${params[key]}`)
        .join('&');
      
      // 3. RSA验证签名
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(stringA);
      
      return verify.verify(publicKey, params.sign, 'base64');
    } catch (error) {
      this.logger.error('Alipay signature verification failed:', error);
      return false;
    }
  }

  /**
   * 生成微信支付签名
   */
  generateWechatPaySignature(params: Record<string, string>, key: string): string {
    // 1. 参数排序
    const sortedKeys = Object.keys(params).sort();
    
    // 2. 拼接字符串
    const stringA = sortedKeys
      .filter(key => key !== 'sign' && params[key] !== '' && params[key] != null)
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    const stringSignTemp = `${stringA}&key=${key}`;
    
    // 3. MD5加密并转大写
    return crypto.createHash('md5').update(stringSignTemp).digest('hex').toUpperCase();
  }

  /**
   * 生成支付宝签名
   */
  generateAlipaySignature(params: Record<string, string>, privateKey: string): string {
    // 1. 参数排序
    const sortedKeys = Object.keys(params).sort();
    
    // 2. 拼接字符串
    const stringA = sortedKeys
      .filter(key => key !== 'sign' && key !== 'sign_type' && params[key] !== '' && params[key] != null)
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    // 3. RSA签名
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(stringA);
    
    return sign.sign(privateKey, 'base64');
  }

  /**
   * 验证支付回调签名
   */
  async verifyPaymentCallback(
    tenantId: string,
    rawData: any,
    signature: string,
    method: string,
  ): Promise<{ valid: boolean; log: PaymentLog }> {
    let signatureVerified = false;

    try {
      // 根据支付方式验证签名
      switch (method) {
        case 'wechat_jsapi':
        case 'wechat_h5':
        case 'wechat_native':
          signatureVerified = this.verifyWechatPaySignature(rawData, this.getWechatPayKey(tenantId));
          break;
        case 'alipay_jsapi':
        case 'alipay_h5':
          signatureVerified = this.verifyAlipaySignature(rawData, this.getAlipayPublicKey(tenantId));
          break;
        default:
          this.logger.warn(`Unknown payment method for signature verification: ${method}`);
      }
    } catch (error) {
      this.logger.error('Payment callback signature verification failed:', error);
    }

    // 记录回调日志
    const log = await this.logPaymentRequest({
      tenantId,
      transactionId: rawData.transaction_id || rawData.trade_no,
      type: 'callback',
      method,
      status: signatureVerified ? 'success' : 'failed',
      amount: rawData.total_fee || rawData.total_amount,
      currency: rawData.fee_type || 'CNY',
      nonceStr: rawData.nonce_str,
      timeStamp: rawData.time_end,
      package: rawData.prepay_id,
      paySign: rawData.sign,
      signType: rawData.sign_type,
      appId: rawData.appid,
      openId: rawData.openid,
      prepayId: rawData.prepay_id,
      bankType: rawData.bank_type,
      feeType: rawData.fee_type,
      isSubscribe: rawData.is_subscribe,
      mchId: rawData.mch_id,
      outTradeNo: rawData.out_trade_no,
      resultCode: rawData.result_code,
      returnCode: rawData.return_code,
      returnMsg: rawData.return_msg,
      errCode: rawData.err_code,
      errCodeDes: rawData.err_code_des,
      tradeType: rawData.trade_type,
      tradeState: rawData.trade_state,
      tradeStateDesc: rawData.trade_state_desc,
      timeEnd: rawData.time_end ? new Date(rawData.time_end) : null,
      paidAt: rawData.time_end ? new Date(rawData.time_end) : null,
      rawData,
      signature,
      errorMessage: signatureVerified ? null : 'Signature verification failed',
    });

    return { valid: signatureVerified, log };
  }

  /**
   * 获取支付日志
   */
  async getPaymentLogs(
    tenantId: string,
    filters: {
      paymentId?: string;
      transactionId?: string;
      type?: string;
      method?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    },
    page: number = 1,
    limit: number = 20,
  ): Promise<{ logs: PaymentLog[]; total: number }> {
    const queryBuilder = this.paymentLogRepository
      .createQueryBuilder('log')
      .where('log.tenantId = :tenantId', { tenantId });

    if (filters.paymentId) {
      queryBuilder.andWhere('log.paymentId = :paymentId', { paymentId: filters.paymentId });
    }
    if (filters.transactionId) {
      queryBuilder.andWhere('log.transactionId = :transactionId', { transactionId: filters.transactionId });
    }
    if (filters.type) {
      queryBuilder.andWhere('log.type = :type', { type: filters.type });
    }
    if (filters.method) {
      queryBuilder.andWhere('log.method = :method', { method: filters.method });
    }
    if (filters.status) {
      queryBuilder.andWhere('log.status = :status', { status: filters.status });
    }
    if (filters.startDate) {
      queryBuilder.andWhere('log.createdAt >= :startDate', { startDate: filters.startDate });
    }
    if (filters.endDate) {
      queryBuilder.andWhere('log.createdAt <= :endDate', { endDate: filters.endDate });
    }

    const [logs, total] = await queryBuilder
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { logs, total };
  }

  /**
   * 获取支付统计
   */
  async getPaymentStats(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalRequests: number;
    successfulPayments: number;
    failedPayments: number;
    totalAmount: number;
    methodStats: Record<string, { count: number; amount: number }>;
  }> {
    const logs = await this.paymentLogRepository
      .createQueryBuilder('log')
      .where('log.tenantId = :tenantId', { tenantId })
      .andWhere('log.createdAt >= :startDate', { startDate })
      .andWhere('log.createdAt <= :endDate', { endDate })
      .getMany();

    const stats = {
      totalRequests: logs.length,
      successfulPayments: logs.filter(log => log.status === 'success').length,
      failedPayments: logs.filter(log => log.status === 'failed').length,
      totalAmount: logs.reduce((sum, log) => sum + (log.amount || 0), 0),
      methodStats: {} as Record<string, { count: number; amount: number }>,
    };

    // 按支付方式统计
    logs.forEach(log => {
      if (!stats.methodStats[log.method]) {
        stats.methodStats[log.method] = { count: 0, amount: 0 };
      }
      stats.methodStats[log.method].count++;
      stats.methodStats[log.method].amount += log.amount || 0;
    });

    return stats;
  }

  /**
   * 验证签名（通用方法）
   */
  private verifySignature(data: PaymentRequestData): boolean {
    if (!data.signature || !data.rawData) {
      return false;
    }

    try {
      switch (data.method) {
        case 'wechat_jsapi':
        case 'wechat_h5':
        case 'wechat_native':
          return this.verifyWechatPaySignature(data.rawData, this.getWechatPayKey(data.tenantId));
        case 'alipay_jsapi':
        case 'alipay_h5':
          return this.verifyAlipaySignature(data.rawData, this.getAlipayPublicKey(data.tenantId));
        default:
          return false;
      }
    } catch (error) {
      this.logger.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * 获取微信支付密钥
   */
  private getWechatPayKey(tenantId: string): string {
    // 实际应用中应该从配置或数据库获取
    return process.env.WECHAT_PAY_KEY || 'your_wechat_pay_key';
  }

  /**
   * 获取支付宝公钥
   */
  private getAlipayPublicKey(tenantId: string): string {
    // 实际应用中应该从配置或数据库获取
    return process.env.ALIPAY_PUBLIC_KEY || 'your_alipay_public_key';
  }
}
