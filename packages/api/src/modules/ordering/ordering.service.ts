import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../../entities/order.entity';
import { UsageService } from '../usage/usage.service';
import { UsageMetric } from '../../entities/usage-counter.entity';
import { NotifyService } from '../notify/notify.service';

export interface CreateOrderDto {
  tenantId: string;
  userId?: string;
  totalAmount: number;
  orderType: 'dine_in' | 'takeout';
  items: any[];
  metadata?: any;
}

export interface UpdateOrderDto {
  status?: OrderStatus;
  metadata?: any;
}

@Injectable()
export class OrderingService {
  private readonly logger = new Logger(OrderingService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private readonly usageService: UsageService,
    private readonly notifyService: NotifyService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    await this.usageService.enforceQuota(createOrderDto.tenantId, UsageMetric.ORDERS);

    // 生成订单号
    const orderNumber = this.generateOrderNumber();
    
    const order = this.orderRepository.create({
      ...createOrderDto,
      orderNumber,
    });

    const saved = await this.orderRepository.save(order);

    await this.usageService.incrementUsage(createOrderDto.tenantId, UsageMetric.ORDERS, 1, {
      orderId: saved.id,
      orderNumber: saved.orderNumber,
    });

    this.dispatchOrderCreatedNotification(saved).catch((error) => {
      this.logger.warn(`Failed to dispatch order created notification`, error instanceof Error ? error.message : error);
    });

    return saved;
  }

  async getOrdersByTenant(tenantId: string, limit = 20, offset = 0): Promise<Order[]> {
    return this.orderRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getOrderById(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async getOrdersByUserId(tenantId: string, userId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { tenantId, userId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateOrder(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.getOrderById(id);
    Object.assign(order, updateOrderDto);
    return this.orderRepository.save(order);
  }

  async deleteOrder(id: string): Promise<void> {
    const order = await this.getOrderById(id);
    await this.orderRepository.remove(order);
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD${timestamp}${random}`;
  }

  private async dispatchOrderCreatedNotification(order: Order) {
    await this.notifyService.sendTemplateMessage({
      tenantId: order.tenantId,
      templateKey: 'order_created',
      toUser: order.userId,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmount: Number(order.totalAmount),
        status: order.status,
      },
    });

    await this.notifyService.triggerEvent(order.tenantId, 'order.created', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount: Number(order.totalAmount),
      status: order.status,
      createdAt: order.createdAt,
    });
  }
}
