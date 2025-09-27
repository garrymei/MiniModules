import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../../../entities/order.entity';
import { BusinessException } from '../../../common/errors/business.exception';
import { BusinessErrorCode } from '../../../common/errors/business-codes.enum';
import * as crypto from 'crypto';

export interface OrderVerificationResult {
  success: boolean;
  message: string;
  order?: Order;
}

@Injectable()
export class OrderVerificationService {
  private readonly VERIFICATION_CODE_EXPIRATION_MINUTES = 30;
  private readonly MAX_VERIFICATION_ATTEMPTS = 3;
  private readonly SECRET_KEY = process.env.VERIFICATION_SECRET_KEY || 'default_secret_key';

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  /**
   * 为订单生成核销码
   */
  async generateOrderVerificationCode(orderId: string): Promise<string> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.USED) {
      throw new BusinessException(
        BusinessErrorCode.ORDER_CANNOT_CANCEL,
        `Order ${orderId} is already ${order.status}`,
      );
    }

    // 生成一次性随机数
    const nonce = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    
    // 构建验证码载荷
    const payload = {
      orderId: order.id,
      timestamp,
      nonce,
      tenantId: order.tenantId,
      orderNumber: order.orderNumber,
    };

    // 生成签名防止篡改
    const signature = this.generateSignature(payload);
    const code = Buffer.from(JSON.stringify({ ...payload, signature })).toString('base64url');

    // 将核销码存储到 order 的 metadata 中
    const expiresAt = new Date(Date.now() + this.VERIFICATION_CODE_EXPIRATION_MINUTES * 60 * 1000);
    
    order.metadata = {
      ...order.metadata,
      verificationCode: code,
      verificationCodeExpiresAt: expiresAt.toISOString(),
      verificationCodeUsed: false,
      verificationAttempts: 0,
      verificationNonce: nonce,
    };
    
    await this.orderRepository.save(order);

    return code;
  }

  /**
   * 验证并核销订单码
   */
  async verifyOrderCode(code: string, tenantId: string, verifiedBy?: string): Promise<OrderVerificationResult> {
    let payload: any;
    
    try {
      // 解码验证码
      const decoded = Buffer.from(code, 'base64url').toString('utf8');
      payload = JSON.parse(decoded);
    } catch (e) {
      return {
        success: false,
        message: 'Invalid verification code format',
      };
    }

    // 验证签名
    if (!this.verifySignature(payload)) {
      return {
        success: false,
        message: 'Invalid verification code signature',
      };
    }

    const order = await this.orderRepository.findOne({ 
      where: { id: payload.orderId, tenantId } 
    });
    
    if (!order) {
      return {
        success: false,
        message: 'Order not found',
      };
    }

    // 检查是否已核销
    if (order.metadata?.verificationCodeUsed) {
      return {
        success: false,
        message: 'Verification code already used',
      };
    }

    // 检查验证尝试次数
    const attempts = order.metadata?.verificationAttempts || 0;
    if (attempts >= this.MAX_VERIFICATION_ATTEMPTS) {
      return {
        success: false,
        message: 'Too many verification attempts',
      };
    }

    // 检查是否过期
    const expiresAt = order.metadata?.verificationCodeExpiresAt 
      ? new Date(order.metadata.verificationCodeExpiresAt) 
      : null;
    if (!expiresAt || expiresAt < new Date()) {
      return {
        success: false,
        message: 'Verification code has expired',
      };
    }

    // 检查码是否匹配
    if (order.metadata?.verificationCode !== code) {
      // 增加验证尝试次数
      order.metadata = {
        ...order.metadata,
        verificationAttempts: attempts + 1,
      };
      await this.orderRepository.save(order);
      
      return {
        success: false,
        message: 'Verification code mismatch',
      };
    }

    // 检查nonce是否匹配（防重放）
    if (order.metadata?.verificationNonce !== payload.nonce) {
      return {
        success: false,
        message: 'Verification code has been used or tampered with',
      };
    }

    // 核销成功，更新订单状态
    order.status = OrderStatus.USED;
    order.metadata = {
      ...order.metadata,
      verificationCodeUsed: true,
      verifiedAt: new Date().toISOString(),
      verifiedBy: verifiedBy || 'system',
    };
    
    await this.orderRepository.save(order);

    return {
      success: true,
      message: 'Order verification successful',
      order,
    };
  }

  /**
   * 获取订单验证信息
   */
  async getOrderVerificationInfo(orderId: string): Promise<{
    order: Order;
    qrCodeData: string;
    verificationCode: string;
  }> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // 生成或获取验证码
    let verificationCode = order.metadata?.verificationCode;
    if (!verificationCode || order.metadata?.verificationCodeUsed) {
      verificationCode = await this.generateOrderVerificationCode(orderId);
    }

    // 构建二维码数据
    const qrCodeData = JSON.stringify({
      type: 'order_verification',
      orderId: order.id,
      orderNumber: order.orderNumber,
      code: verificationCode,
      timestamp: Date.now(),
    });

    return {
      order,
      qrCodeData,
      verificationCode,
    };
  }

  /**
   * 撤销核销（管理员操作）
   */
  async revokeOrderVerification(orderId: string, reason: string, revokedBy: string): Promise<void> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.status !== OrderStatus.USED) {
      throw new BadRequestException('Only used orders can be revoked');
    }

    order.status = OrderStatus.PAID;
    order.metadata = {
      ...order.metadata,
      verificationCodeUsed: false,
      revokedAt: new Date().toISOString(),
      revokedBy,
      revokeReason: reason,
    };
    
    await this.orderRepository.save(order);
  }

  private generateSignature(payload: any): string {
    const data = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', this.SECRET_KEY)
      .update(data)
      .digest('hex');
  }

  private verifySignature(payload: any): boolean {
    const { signature, ...data } = payload;
    const expectedSignature = this.generateSignature(data);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex'),
    );
  }
}