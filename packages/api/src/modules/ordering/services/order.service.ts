import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../../entities/order.entity';
import { OrderItem } from '../../../entities/order-item.entity';
import { SKU } from '../../../entities/sku.entity';
import { CreateOrderDto, UpdateOrderDto, OrderDto } from '../dto/order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(SKU)
    private skuRepository: Repository<SKU>,
  ) {}

  async create(tenantId: string, createDto: CreateOrderDto): Promise<OrderDto> {
    // 验证库存
    for (const item of createDto.items) {
      const sku = await this.skuRepository.findOne({
        where: { id: item.skuId, tenantId }
      });

      if (!sku) {
        throw new NotFoundException(`SKU ${item.skuId} not found`);
      }

      if (sku.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${sku.name}`);
      }
    }

    // 创建订单
    const order = this.orderRepository.create({
      tenantId,
      orderNumber: this.generateOrderNumber(),
      orderType: createDto.orderType,
      tableNumber: createDto.tableNumber,
      customerName: createDto.customerName,
      customerPhone: createDto.customerPhone,
      remark: createDto.remark,
      totalAmount: createDto.totalAmount,
      status: 'PENDING',
    });

    const savedOrder = await this.orderRepository.save(order);

    // 创建订单项并扣减库存
    for (const item of createDto.items) {
      const sku = await this.skuRepository.findOne({
        where: { id: item.skuId }
      });

      const orderItem = this.orderItemRepository.create({
        orderId: savedOrder.id,
        skuId: item.skuId,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.price * item.quantity,
      });

      await this.orderItemRepository.save(orderItem);

      // 扣减库存
      await this.skuRepository.update(
        { id: item.skuId },
        { stock: sku.stock - item.quantity }
      );
    }

    return this.mapToDto(savedOrder);
  }

  async findAll(tenantId: string, status?: string): Promise<OrderDto[]> {
    const where: any = { tenantId };
    if (status) {
      where.status = status;
    }

    const orders = await this.orderRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return orders.map(this.mapToDto);
  }

  async findOne(id: string, tenantId: string): Promise<OrderDto> {
    const order = await this.orderRepository.findOne({
      where: { id, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.mapToDto(order);
  }

  async update(id: string, tenantId: string, updateDto: UpdateOrderDto): Promise<OrderDto> {
    const order = await this.orderRepository.findOne({
      where: { id, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    Object.assign(order, updateDto);
    const saved = await this.orderRepository.save(order);
    return this.mapToDto(saved);
  }

  async cancel(id: string, tenantId: string): Promise<OrderDto> {
    const order = await this.orderRepository.findOne({
      where: { id, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    order.status = 'CANCELLED';
    const saved = await this.orderRepository.save(order);

    // 恢复库存
    const orderItems = await this.orderItemRepository.find({
      where: { orderId: id }
    });

    for (const item of orderItems) {
      const sku = await this.skuRepository.findOne({
        where: { id: item.skuId }
      });

      if (sku) {
        await this.skuRepository.update(
          { id: item.skuId },
          { stock: sku.stock + item.quantity }
        );
      }
    }

    return this.mapToDto(saved);
  }

  async markAsPaid(id: string, tenantId: string): Promise<OrderDto> {
    const order = await this.orderRepository.findOne({
      where: { id, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Only pending orders can be marked as paid');
    }

    order.status = 'PAID';
    const saved = await this.orderRepository.save(order);
    return this.mapToDto(saved);
  }

  private generateOrderNumber(): string {
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD${timestamp}${random}`;
  }

  private mapToDto(order: Order): OrderDto {
    return {
      id: order.id,
      tenantId: order.tenantId,
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      tableNumber: order.tableNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      remark: order.remark,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }
}
