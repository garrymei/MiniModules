import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../../entities/order.entity';
import { Booking, BookingStatus } from '../../entities/booking.entity';
import { NotifyService } from '../notify/notify.service';
import { CreatePaymentDto, PaymentNotifyDto, PaymentMethod, PaymentStatus } from './dto/payment.dto';
import * as crypto from 'crypto';

export interface PaymentResult {
  package: string;  // Changed from prepayId to package for JSAPI compatibility
  nonceStr: string;
  timeStamp: string;
  paySign: string;
  signType: string; // Added signType for JSAPI compatibility
  orderId: string;
  amount: number;
}

// Export the DTOs so they can be imported directly from the service
export { CreatePaymentDto, PaymentNotifyDto, PaymentMethod, PaymentStatus } from './dto/payment.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    private readonly notifyService: NotifyService,
  ) {}

  async createPayment(createPaymentDto: CreatePaymentDto): Promise<PaymentResult> {
    const { orderId, amount, method, description } = createPaymentDto;

    // 验证订单是否存在
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order is not in pending status');
    }

    // 生成模拟的支付信息
    const prepayId = `mock_prepay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const nonceStr = Math.random().toString(36).substr(2, 32);
    const timeStamp = Date.now().toString();
    const paySign = this.generatePaySign(prepayId, nonceStr, timeStamp);

    return {
      package: `prepay_id=${prepayId}`, // Changed from prepayId to package
      nonceStr,
      timeStamp,
      paySign,
      signType: 'MD5', // Added signType
      orderId: orderId,
      amount,
    };
  }

  async handlePaymentNotify(notifyDto: PaymentNotifyDto): Promise<{ success: boolean; message: string }> {
    const { paymentId, status, transactionId, paidAt } = notifyDto;

    try {
      // 这里应该根据paymentId查找对应的订单
      // 为了简化，我们假设paymentId就是orderId
      const orderId = paymentId;
      
      const order = await this.orderRepository.findOne({ where: { id: orderId } });
      if (order) {
        if (status === PaymentStatus.PAID) {
          // 更新订单状态为已支付
          order.status = OrderStatus.PAID;
          const updatedOrder = await this.orderRepository.save(order);
          this.dispatchPaymentSuccess('order', updatedOrder.tenantId, {
            orderId: updatedOrder.id,
            orderNumber: updatedOrder.orderNumber,
            amount: parseFloat(updatedOrder.totalAmount.toString()),
            status: updatedOrder.status,
          }).catch((error) =>
            this.logger.warn('Order payment notify failed', error instanceof Error ? error.message : error),
          );
          return { success: true, message: 'Order payment processed successfully' };
        }

        if (status === PaymentStatus.FAILED) {
          // 支付失败，取消订单
          order.status = OrderStatus.CANCELLED;
          await this.orderRepository.save(order);
          return { success: true, message: 'Order payment failed' };
        }

        // 其他状态暂不处理
        return { success: true, message: `Payment status ${status} received` };
      }

      throw new NotFoundException(`Order with ID ${orderId} not found`);
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  private async dispatchPaymentSuccess(
    entityType: 'order' | 'booking',
    tenantId: string,
    payload: Record<string, any>,
  ) {
    await this.notifyService.sendTemplateMessage({
      tenantId,
      templateKey: 'payment_success',
      data: {
        ...payload,
        entityType,
      },
    });

    await this.notifyService.triggerEvent(tenantId, 'payment.success', {
      entityType,
      ...payload,
    });
  }

  private generatePaySign(prepayId: string, nonceStr: string, timeStamp: string): string {
    // 模拟微信支付签名生成
    const mockApiKey = 'mock_api_key_for_signature';
    const stringA = `appId=mock_app_id&nonceStr=${nonceStr}&package=prepay_id=${prepayId}&signType=MD5&timeStamp=${timeStamp}&key=${mockApiKey}`;
    
    // 简单的MD5模拟（实际应该使用crypto模块）
    return Buffer.from(stringA).toString('base64').substr(0, 32);
  }

  async getPaymentStatus(orderId: string): Promise<{ status: string; amount?: number }> {
    // 查找订单
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (order) {
      return { 
        status: order.status, 
        amount: parseFloat(order.totalAmount.toString()) 
      };
    }

    throw new NotFoundException(`Order with ID ${orderId} not found`);
  }
}