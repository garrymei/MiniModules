import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../../entities/order.entity';

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
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    // 生成订单号
    const orderNumber = this.generateOrderNumber();
    
    const order = this.orderRepository.create({
      ...createOrderDto,
      orderNumber,
    });

    return this.orderRepository.save(order);
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
}