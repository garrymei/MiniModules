import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { Order, OrderStatus } from '../../entities/order.entity';
import { UsageService } from '../usage/usage.service';
import { UsageMetric } from '../../entities/usage-counter.entity';
import { NotifyService } from '../notify/notify.service';
import { InventoryService } from './services/inventory.service';
import { OrderVerificationService } from './services/order-verification.service';
import { BusinessException } from '../../common/errors/business.exception';
import { BusinessErrorCode } from '../../common/errors/business-codes.enum';
import { Audit, AUDIT_ACTIONS } from '../../common/decorators/audit.decorator';

export interface CreateOrderDto {
  tenantId: string;
  userId?: string;
  orderType: 'dine_in' | 'takeout';
  items: Array<{
    skuId: string;
    quantity: number;
    price: number;
    productId?: string;
    attributes?: Record<string, any>;
  }>;
  idempotencyKey?: string;
  totalAmount: number;
  metadata?: any;
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  remark?: string;
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
    private readonly inventoryService: InventoryService,
    private readonly orderVerificationService: OrderVerificationService,
    private readonly usageService: UsageService,
    private readonly notifyService: NotifyService,
    private readonly dataSource: DataSource,
  ) {}

  @Audit({
    action: AUDIT_ACTIONS.CREATE,
    resourceType: 'ORDER',
    description: '创建订单',
    includeRequestData: true,
    sensitiveFields: ['customerPhone', 'customerName'],
  })
  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    await this.usageService.enforceQuota(createOrderDto.tenantId, UsageMetric.ORDERS);

    const normalizedItems = createOrderDto.items.map((item) => ({
      skuId: item.skuId,
      quantity: item.quantity,
      price: Number(item.price),
      attributes: item.attributes,
    }));

    if (normalizedItems.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const calculatedTotal = normalizedItems.reduce((total, current) => total + current.price * current.quantity, 0);
    if (Math.abs(calculatedTotal - Number(createOrderDto.totalAmount)) > 0.01) {
      throw new BusinessException(
        BusinessErrorCode.INVALID_PARAMS,
        `Total amount mismatch. Expected ${calculatedTotal.toFixed(2)}, received ${createOrderDto.totalAmount}`,
      );
    }

    // 幂等性检查 - 在事务外先检查
    if (createOrderDto.idempotencyKey) {
      const existing = await this.orderRepository.findOne({
        where: {
          tenantId: createOrderDto.tenantId,
          idempotencyKey: createOrderDto.idempotencyKey,
        },
      });

      if (existing) {
        this.logger.log(`Returning existing order for idempotency key: ${createOrderDto.idempotencyKey}`);
        return existing;
      }
    }

    // 预检查库存可用性（避免在事务中失败）
    const stockCheck = await this.inventoryService.checkStockAvailability(
      createOrderDto.tenantId,
      normalizedItems.map(item => ({ skuId: item.skuId, quantity: item.quantity }))
    );

    if (!stockCheck.available) {
      throw new BusinessException(
        BusinessErrorCode.OUT_OF_STOCK,
        `Insufficient stock: ${stockCheck.insufficientItems.map(item => `${item.skuName} (need ${item.requested}, have ${item.available})`).join(', ')}`,
      );
    }

    try {
      const { order, isNew } = await this.dataSource.transaction(async (manager) => {
        if (createOrderDto.idempotencyKey) {
          const dup = await manager.findOne(Order, {
            where: {
              tenantId: createOrderDto.tenantId,
              idempotencyKey: createOrderDto.idempotencyKey,
            },
          });
          if (dup) {
            return { order: dup, isNew: false };
          }
        }

        const orderNumber = this.generateOrderNumber();
        const orderEntity = manager.create(Order, {
          tenantId: createOrderDto.tenantId,
          userId: createOrderDto.userId,
          totalAmount: calculatedTotal,
          orderType: createOrderDto.orderType,
          status: OrderStatus.PENDING,
          items: normalizedItems,
          metadata: {
            ...createOrderDto.metadata,
            tableNumber: createOrderDto.tableNumber,
            customerName: createOrderDto.customerName,
            customerPhone: createOrderDto.customerPhone,
            remark: createOrderDto.remark,
          },
          orderNumber,
          idempotencyKey: createOrderDto.idempotencyKey,
        });

        const savedOrder = await manager.save(orderEntity);

        await this.inventoryService.deductStock(
          manager,
          createOrderDto.tenantId,
          savedOrder.id,
          normalizedItems,
        );

        return { order: savedOrder, isNew: true };
      });

      if (isNew) {
        await this.usageService.incrementUsage(createOrderDto.tenantId, UsageMetric.ORDERS, 1, {
          orderId: order.id,
          orderNumber: order.orderNumber,
        });

        this.dispatchOrderCreatedNotification(order).catch((error) => {
          this.logger.warn(
            `Failed to dispatch order created notification`,
            error instanceof Error ? error.message : error,
          );
        });
      }

      return order;
    } catch (error) {
      if (error instanceof QueryFailedError && (error as any).code === '23505' && createOrderDto.idempotencyKey) {
        const existing = await this.orderRepository.findOne({
          where: {
            tenantId: createOrderDto.tenantId,
            idempotencyKey: createOrderDto.idempotencyKey,
          },
        });
        if (existing) {
          return existing;
        }
      }

      throw error;
    }
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

  @Audit({
    action: AUDIT_ACTIONS.UPDATE,
    resourceType: 'ORDER',
    description: '更新订单',
    includeRequestData: true,
  })
  async updateOrder(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.getOrderById(id);
    Object.assign(order, updateOrderDto);
    return this.orderRepository.save(order);
  }

  @Audit({
    action: AUDIT_ACTIONS.DELETE,
    resourceType: 'ORDER',
    description: '删除订单',
  })
  async deleteOrder(id: string): Promise<void> {
    const order = await this.getOrderById(id);
    await this.orderRepository.remove(order);
  }

  /**
   * 更新订单状态（支持幂等操作）
   */
  @Audit({
    action: AUDIT_ACTIONS.UPDATE,
    resourceType: 'ORDER',
    description: '更新订单状态',
    includeRequestData: true,
  })
  async updateOrderStatus(
    id: string, 
    status: OrderStatus, 
    options?: { 
      idempotent?: boolean;
      metadata?: Record<string, any>;
    }
  ): Promise<Order> {
    const order = await this.getOrderById(id);
    
    // 如果启用了幂等性检查且状态相同，则直接返回
    if (options?.idempotent && order.status === status) {
      return order;
    }
    
    // 验证状态转换是否合法
    if (!this.isValidStatusTransition(order.status, status)) {
      throw new BadRequestException(
        `Invalid status transition from ${order.status} to ${status}`
      );
    }
    
    order.status = status;
    
    if (options?.metadata) {
      order.metadata = {
        ...order.metadata,
        ...options.metadata
      };
    }
    
    const updatedOrder = await this.orderRepository.save(order);
    
    // 触发状态变更通知
    this.dispatchOrderStatusChangeNotification(updatedOrder, order.status).catch((error) => {
      this.logger.warn(
        `Failed to dispatch order status change notification`,
        error instanceof Error ? error.message : error,
      );
    });
    
    return updatedOrder;
  }

  /**
   * 验证订单状态转换是否合法
   */
  private isValidStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
    // 定义合法的状态转换
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.USED, OrderStatus.REFUNDING, OrderStatus.CANCELLED],
      [OrderStatus.CANCELLED]: [], // 终止状态，不能转换到其他状态
      [OrderStatus.USED]: [OrderStatus.REFUNDING], // 已使用的订单可以申请退款
      [OrderStatus.REFUNDING]: [OrderStatus.REFUNDED, OrderStatus.PAID], // 退款失败可以回到已支付状态
      [OrderStatus.REFUNDED]: [] // 终止状态，不能转换到其他状态
    };
    
    // 允许相同状态的转换（幂等操作）
    if (from === to) {
      return true;
    }
    
    return validTransitions[from].includes(to);
  }

  /**
   * 获取订单核销信息
   */
  async getOrderVerificationInfo(orderId: string): Promise<{
    order: Order;
    qrCodeData: string;
    verificationCode: string;
  }> {
    return this.orderVerificationService.getOrderVerificationInfo(orderId);
  }

  /**
   * 验证订单核销码
   */
  @Audit({
    action: AUDIT_ACTIONS.VERIFY,
    resourceType: 'ORDER',
    description: '核销订单',
    includeRequestData: false,
  })
  async verifyOrderCode(code: string, tenantId: string, verifiedBy?: string): Promise<{
    success: boolean;
    message: string;
    order?: Order;
  }> {
    return this.orderVerificationService.verifyOrderCode(code, tenantId, verifiedBy);
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

  private async dispatchOrderStatusChangeNotification(order: Order, previousStatus: OrderStatus) {
    await this.notifyService.sendTemplateMessage({
      tenantId: order.tenantId,
      templateKey: 'order_status_changed',
      toUser: order.userId,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        previousStatus,
        newStatus: order.status,
      },
    });

    await this.notifyService.triggerEvent(order.tenantId, 'order.status.changed', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      previousStatus,
      newStatus: order.status,
      updatedAt: order.updatedAt,
    });
  }
}