import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../../entities/order.entity';
import { Booking, BookingStatus } from '../../entities/booking.entity';

export interface CreatePaymentDto {
  orderId?: string;
  bookingId?: string;
  amount: number;
  paymentMethod: 'wechat' | 'alipay';
  description?: string;
}

export interface PaymentResult {
  prepayId: string;
  nonceStr: string;
  timeStamp: string;
  paySign: string;
  orderId: string;
  amount: number;
}

export interface PaymentNotifyDto {
  orderId: string;
  transactionId: string;
  status: 'success' | 'failed';
  amount: number;
  timestamp: string;
}

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
  ) {}

  async createPayment(createPaymentDto: CreatePaymentDto): Promise<PaymentResult> {
    const { orderId, bookingId, amount, paymentMethod, description } = createPaymentDto;

    // 验证订单或预约是否存在
    let entity: Order | Booking | null = null;
    let entityType: 'order' | 'booking' = 'order';

    if (orderId) {
      entity = await this.orderRepository.findOne({ where: { id: orderId } });
      if (!entity) {
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }
      if (entity.status !== OrderStatus.PENDING) {
        throw new BadRequestException('Order is not in pending status');
      }
    } else if (bookingId) {
      entity = await this.bookingRepository.findOne({ where: { id: bookingId } });
      entityType = 'booking';
      if (!entity) {
        throw new NotFoundException(`Booking with ID ${bookingId} not found`);
      }
      if (entity.status !== BookingStatus.PENDING) {
        throw new BadRequestException('Booking is not in pending status');
      }
    } else {
      throw new BadRequestException('Either orderId or bookingId is required');
    }

    // 生成模拟的支付信息
    const prepayId = `mock_prepay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const nonceStr = Math.random().toString(36).substr(2, 32);
    const timeStamp = Date.now().toString();
    const paySign = this.generatePaySign(prepayId, nonceStr, timeStamp);

    return {
      prepayId,
      nonceStr,
      timeStamp,
      paySign,
      orderId: orderId || bookingId,
      amount,
    };
  }

  async handlePaymentNotify(notifyDto: PaymentNotifyDto): Promise<{ success: boolean; message: string }> {
    const { orderId, status, amount } = notifyDto;

    try {
      // 查找订单
      const order = await this.orderRepository.findOne({ where: { id: orderId } });
      if (order) {
        if (status === 'success') {
          order.status = OrderStatus.CONFIRMED;
          await this.orderRepository.save(order);
          return { success: true, message: 'Order payment processed successfully' };
        } else {
          order.status = OrderStatus.CANCELLED;
          await this.orderRepository.save(order);
          return { success: true, message: 'Order payment failed' };
        }
      }

      // 查找预约
      const booking = await this.bookingRepository.findOne({ where: { id: orderId } });
      if (booking) {
        if (status === 'success') {
          booking.status = BookingStatus.CONFIRMED;
          await this.bookingRepository.save(booking);
          return { success: true, message: 'Booking payment processed successfully' };
        } else {
          booking.status = BookingStatus.CANCELLED;
          await this.bookingRepository.save(booking);
          return { success: true, message: 'Booking payment failed' };
        }
      }

      throw new NotFoundException(`Order or booking with ID ${orderId} not found`);
    } catch (error) {
      return { success: false, message: error.message };
    }
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

    // 查找预约
    const booking = await this.bookingRepository.findOne({ where: { id: orderId } });
    if (booking) {
      return { 
        status: booking.status, 
        amount: 0 // 预约可能没有金额
      };
    }

    throw new NotFoundException(`Order or booking with ID ${orderId} not found`);
  }
}
