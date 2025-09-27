import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentCallbackLog } from '../../entities/payment-callback-log.entity';
import { Order } from '../../entities/order.entity';
import { OrderStateMachineService } from '../ordering/services/order-state-machine.service';
import * as crypto from 'crypto';

export interface PaymentCallbackData {
  orderId: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'pending';
  paymentMethod: string;
  gateway: string;
  timestamp: Date;
  signature?: string;
  metadata?: Record<string, any>;
}

export interface PaymentGatewayConfig {
  name: string;
  secretKey: string;
  publicKey?: string;
  webhookUrl?: string;
  signatureMethod: 'hmac-sha256' | 'rsa-sha256' | 'md5';
}

@Injectable()
export class PaymentCallbackService {
  private readonly logger = new Logger(PaymentCallbackService.name);
  private readonly gatewayConfigs: Map<string, PaymentGatewayConfig> = new Map();

  constructor(
    @InjectRepository(PaymentCallbackLog)
    private paymentCallbackLogRepository: Repository<PaymentCallbackLog>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private orderStateMachineService: OrderStateMachineService,
  ) {
    this.initializeGatewayConfigs();
  }

  /**
   * 处理支付回调
   */
  async handlePaymentCallback(
    gateway: string,
    callbackData: any,
    signature?: string,
    requestHeaders?: Record<string, string>,
  ): Promise<{ success: boolean; message: string; orderId?: string }> {
    const requestId = this.generateRequestId();
    
    try {
      // 记录回调日志
      const logEntry = await this.logCallback(
        gateway,
        callbackData,
        signature,
        requestHeaders,
        requestId,
      );

      // 验证签名
      const isValidSignature = await this.verifySignature(
        gateway,
        callbackData,
        signature,
        requestHeaders,
      );

      if (!isValidSignature) {
        await this.updateCallbackLog(logEntry.id, 'failed', 'Invalid signature');
        throw new BadRequestException('Invalid signature');
      }

      // 解析回调数据
      const paymentData = this.parseCallbackData(gateway, callbackData);
      
      // 验证订单
      const order = await this.validateOrder(paymentData.orderId, paymentData.amount);
      
      if (!order) {
        await this.updateCallbackLog(logEntry.id, 'failed', 'Order not found or amount mismatch');
        throw new BadRequestException('Order not found or amount mismatch');
      }

      // 处理支付状态
      const result = await this.processPaymentStatus(order, paymentData, requestId);
      
      // 更新回调日志
      await this.updateCallbackLog(
        logEntry.id,
        result.success ? 'success' : 'failed',
        result.message,
        paymentData,
      );

      return result;
    } catch (error) {
      this.logger.error(`Payment callback failed for gateway ${gateway}:`, error);
      return {
        success: false,
        message: error.message || 'Payment callback processing failed',
      };
    }
  }

  /**
   * 记录回调日志
   */
  private async logCallback(
    gateway: string,
    callbackData: any,
    signature?: string,
    requestHeaders?: Record<string, string>,
    requestId?: string,
  ): Promise<PaymentCallbackLog> {
    const logEntry = this.paymentCallbackLogRepository.create({
      gateway,
      requestId: requestId || this.generateRequestId(),
      rawData: callbackData,
      signature,
      headers: requestHeaders,
      status: 'processing',
      createdAt: new Date(),
    });

    return await this.paymentCallbackLogRepository.save(logEntry);
  }

  /**
   * 更新回调日志
   */
  private async updateCallbackLog(
    logId: string,
    status: 'success' | 'failed' | 'processing',
    message?: string,
    processedData?: PaymentCallbackData,
  ): Promise<void> {
    await this.paymentCallbackLogRepository.update(logId, {
      status,
      message,
      processedData,
      updatedAt: new Date(),
    });
  }

  /**
   * 验证签名
   */
  private async verifySignature(
    gateway: string,
    callbackData: any,
    signature?: string,
    requestHeaders?: Record<string, string>,
  ): Promise<boolean> {
    const config = this.gatewayConfigs.get(gateway);
    if (!config) {
      this.logger.warn(`No configuration found for gateway: ${gateway}`);
      return false;
    }

    if (!signature) {
      this.logger.warn(`No signature provided for gateway: ${gateway}`);
      return false;
    }

    try {
      switch (config.signatureMethod) {
        case 'hmac-sha256':
          return this.verifyHmacSignature(callbackData, signature, config.secretKey);
        case 'rsa-sha256':
          return this.verifyRsaSignature(callbackData, signature, config.publicKey);
        case 'md5':
          return this.verifyMd5Signature(callbackData, signature, config.secretKey);
        default:
          this.logger.warn(`Unsupported signature method: ${config.signatureMethod}`);
          return false;
      }
    } catch (error) {
      this.logger.error(`Signature verification failed for gateway ${gateway}:`, error);
      return false;
    }
  }

  /**
   * 验证HMAC-SHA256签名
   */
  private verifyHmacSignature(data: any, signature: string, secretKey: string): boolean {
    const sortedData = this.sortObjectKeys(data);
    const dataString = this.objectToQueryString(sortedData);
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(dataString)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex'),
    );
  }

  /**
   * 验证RSA-SHA256签名
   */
  private verifyRsaSignature(data: any, signature: string, publicKey?: string): boolean {
    if (!publicKey) {
      this.logger.warn('RSA public key not provided');
      return false;
    }

    try {
      const sortedData = this.sortObjectKeys(data);
      const dataString = this.objectToQueryString(sortedData);
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(dataString);
      return verify.verify(publicKey, signature, 'base64');
    } catch (error) {
      this.logger.error('RSA signature verification failed:', error);
      return false;
    }
  }

  /**
   * 验证MD5签名
   */
  private verifyMd5Signature(data: any, signature: string, secretKey: string): boolean {
    const sortedData = this.sortObjectKeys(data);
    const dataString = this.objectToQueryString(sortedData) + secretKey;
    const expectedSignature = crypto
      .createHash('md5')
      .update(dataString)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex'),
    );
  }

  /**
   * 解析回调数据
   */
  private parseCallbackData(gateway: string, callbackData: any): PaymentCallbackData {
    switch (gateway) {
      case 'alipay':
        return this.parseAlipayCallback(callbackData);
      case 'wechat':
        return this.parseWechatCallback(callbackData);
      case 'stripe':
        return this.parseStripeCallback(callbackData);
      case 'paypal':
        return this.parsePaypalCallback(callbackData);
      default:
        throw new BadRequestException(`Unsupported payment gateway: ${gateway}`);
    }
  }

  /**
   * 解析支付宝回调
   */
  private parseAlipayCallback(data: any): PaymentCallbackData {
    return {
      orderId: data.out_trade_no,
      transactionId: data.trade_no,
      amount: parseFloat(data.total_amount) * 100, // 转换为分
      currency: 'CNY',
      status: data.trade_status === 'TRADE_SUCCESS' ? 'success' : 'failed',
      paymentMethod: 'alipay',
      gateway: 'alipay',
      timestamp: new Date(),
      metadata: data,
    };
  }

  /**
   * 解析微信支付回调
   */
  private parseWechatCallback(data: any): PaymentCallbackData {
    return {
      orderId: data.out_trade_no,
      transactionId: data.transaction_id,
      amount: parseInt(data.total_fee),
      currency: 'CNY',
      status: data.result_code === 'SUCCESS' ? 'success' : 'failed',
      paymentMethod: 'wechat',
      gateway: 'wechat',
      timestamp: new Date(),
      metadata: data,
    };
  }

  /**
   * 解析Stripe回调
   */
  private parseStripeCallback(data: any): PaymentCallbackData {
    return {
      orderId: data.metadata?.orderId || data.id,
      transactionId: data.id,
      amount: data.amount,
      currency: data.currency.toUpperCase(),
      status: data.status === 'succeeded' ? 'success' : 'failed',
      paymentMethod: data.payment_method_types?.[0] || 'card',
      gateway: 'stripe',
      timestamp: new Date(data.created * 1000),
      metadata: data,
    };
  }

  /**
   * 解析PayPal回调
   */
  private parsePaypalCallback(data: any): PaymentCallbackData {
    return {
      orderId: data.custom || data.id,
      transactionId: data.id,
      amount: parseFloat(data.amount) * 100, // 转换为分
      currency: data.currency_code,
      status: data.state === 'approved' ? 'success' : 'failed',
      paymentMethod: 'paypal',
      gateway: 'paypal',
      timestamp: new Date(data.create_time),
      metadata: data,
    };
  }

  /**
   * 验证订单
   */
  private async validateOrder(orderId: string, amount: number): Promise<Order | null> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      return null;
    }

    // 验证金额（允许1分的误差）
    if (Math.abs(order.totalAmount - amount) > 1) {
      this.logger.warn(`Amount mismatch for order ${orderId}: expected ${order.totalAmount}, got ${amount}`);
      return null;
    }

    return order;
  }

  /**
   * 处理支付状态
   */
  private async processPaymentStatus(
    order: Order,
    paymentData: PaymentCallbackData,
    requestId: string,
  ): Promise<{ success: boolean; message: string; orderId?: string }> {
    try {
      if (paymentData.status === 'success') {
        // 支付成功，更新订单状态
        await this.orderStateMachineService.transitionOrder(
          order.id,
          'CONFIRMED' as any,
          {
            userId: 'system',
            reason: 'Payment confirmed',
            paymentMethod: paymentData.paymentMethod,
            transactionId: paymentData.transactionId,
          },
        );

        this.logger.log(`Order ${order.id} payment confirmed via ${paymentData.gateway}`);
        
        return {
          success: true,
          message: 'Payment processed successfully',
          orderId: order.id,
        };
      } else {
        // 支付失败，更新订单状态
        await this.orderStateMachineService.transitionOrder(
          order.id,
          'CANCELLED' as any,
          {
            userId: 'system',
            reason: 'Payment failed',
            paymentMethod: paymentData.paymentMethod,
            transactionId: paymentData.transactionId,
          },
        );

        this.logger.log(`Order ${order.id} payment failed via ${paymentData.gateway}`);
        
        return {
          success: true,
          message: 'Payment failure processed',
          orderId: order.id,
        };
      }
    } catch (error) {
      this.logger.error(`Failed to process payment status for order ${order.id}:`, error);
      return {
        success: false,
        message: 'Failed to update order status',
        orderId: order.id,
      };
    }
  }

  /**
   * 获取回调日志
   */
  async getCallbackLogs(
    gateway?: string,
    status?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    logs: PaymentCallbackLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.paymentCallbackLogRepository.createQueryBuilder('log');

    if (gateway) {
      queryBuilder.andWhere('log.gateway = :gateway', { gateway });
    }

    if (status) {
      queryBuilder.andWhere('log.status = :status', { status });
    }

    const [logs, total] = await queryBuilder
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      logs,
      total,
      page,
      limit,
    };
  }

  /**
   * 获取回调统计信息
   */
  async getCallbackStats(): Promise<{
    totalCallbacks: number;
    successRate: number;
    byGateway: Record<string, { total: number; success: number; failed: number }>;
    recentActivity: Array<{
      gateway: string;
      status: string;
      timestamp: Date;
    }>;
  }> {
    const logs = await this.paymentCallbackLogRepository.find({
      order: { createdAt: 'DESC' },
    });

    const totalCallbacks = logs.length;
    const successfulCallbacks = logs.filter(log => log.status === 'success').length;
    const successRate = totalCallbacks > 0 ? (successfulCallbacks / totalCallbacks) * 100 : 0;

    const byGateway: Record<string, { total: number; success: number; failed: number }> = {};
    logs.forEach(log => {
      if (!byGateway[log.gateway]) {
        byGateway[log.gateway] = { total: 0, success: 0, failed: 0 };
      }
      byGateway[log.gateway].total++;
      if (log.status === 'success') {
        byGateway[log.gateway].success++;
      } else if (log.status === 'failed') {
        byGateway[log.gateway].failed++;
      }
    });

    const recentActivity = logs.slice(0, 10).map(log => ({
      gateway: log.gateway,
      status: log.status,
      timestamp: log.createdAt,
    }));

    return {
      totalCallbacks,
      successRate,
      byGateway,
      recentActivity,
    };
  }

  /**
   * 初始化支付网关配置
   */
  private initializeGatewayConfigs(): void {
    // 支付宝配置
    this.gatewayConfigs.set('alipay', {
      name: 'Alipay',
      secretKey: process.env.ALIPAY_SECRET_KEY || '',
      signatureMethod: 'hmac-sha256',
    });

    // 微信支付配置
    this.gatewayConfigs.set('wechat', {
      name: 'WeChat Pay',
      secretKey: process.env.WECHAT_PAY_SECRET_KEY || '',
      signatureMethod: 'hmac-sha256',
    });

    // Stripe配置
    this.gatewayConfigs.set('stripe', {
      name: 'Stripe',
      secretKey: process.env.STRIPE_WEBHOOK_SECRET || '',
      signatureMethod: 'hmac-sha256',
    });

    // PayPal配置
    this.gatewayConfigs.set('paypal', {
      name: 'PayPal',
      secretKey: process.env.PAYPAL_CLIENT_SECRET || '',
      signatureMethod: 'hmac-sha256',
    });
  }

  /**
   * 排序对象键
   */
  private sortObjectKeys(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    }

    const sortedKeys = Object.keys(obj).sort();
    const sortedObj: any = {};
    
    sortedKeys.forEach(key => {
      sortedObj[key] = this.sortObjectKeys(obj[key]);
    });

    return sortedObj;
  }

  /**
   * 对象转查询字符串
   */
  private objectToQueryString(obj: any): string {
    const pairs: string[] = [];
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (value !== null && value !== undefined) {
          pairs.push(`${key}=${encodeURIComponent(String(value))}`);
        }
      }
    }
    
    return pairs.join('&');
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
