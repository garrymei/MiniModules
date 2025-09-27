import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from '../../../entities/order.entity';
import { AuditLog, AuditAction, AuditResourceType } from '../../../entities/audit-log.entity';
import { BusinessException, BusinessErrorCode } from '../../../common/errors/business.exception';

@Injectable()
export class OrderStateMachineService {
  private readonly logger = new Logger(OrderStateMachineService.name);

  // Aligned state transition rules based on the OrderStatus enum
  private readonly stateTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
    [OrderStatus.PAID]: [OrderStatus.USED, OrderStatus.REFUNDING, OrderStatus.CANCELLED],
    [OrderStatus.USED]: [OrderStatus.REFUNDING], // Allow refund after use
    [OrderStatus.REFUNDING]: [OrderStatus.REFUNDED, OrderStatus.PAID], // Can revert to PAID if refund fails
    [OrderStatus.CANCELLED]: [], // Terminal state
    [OrderStatus.REFUNDED]: [], // Terminal state
  };

  // Aligned transition actions
  private readonly transitionActions: Record<string, (order: Order, context?: any) => Promise<void>> = {
    'PENDING_TO_PAID': async (order, context) => {
      order.metadata = {
        ...order.metadata,
        paidAt: new Date().toISOString(),
        paymentMethod: context?.paymentMethod,
        transactionId: context?.transactionId,
      };
    },
    'PAID_TO_USED': async (order, context) => {
      order.metadata = {
        ...order.metadata,
        usedAt: new Date().toISOString(),
        verifiedBy: context?.verifiedBy,
        verificationMethod: context?.verificationMethod, // e.g., 'scan', 'manual'
      };
    },
    'ANY_TO_CANCELLED': async (order, context) => {
      order.metadata = {
        ...order.metadata,
        cancelledAt: new Date().toISOString(),
        cancellationReason: context?.reason,
        cancelledBy: context?.cancelledBy,
      };
    },
    'PAID_TO_REFUNDING': async (order, context) => {
        order.metadata = {
            ...order.metadata,
            refundRequestedAt: new Date().toISOString(),
            refundReason: context?.reason,
        };
    },
    'REFUNDING_TO_REFUNDED': async (order, context) => {
        order.metadata = {
            ...order.metadata,
            refundedAt: new Date().toISOString(),
            refundTransactionId: context?.refundTransactionId,
        };
    },
  };

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private dataSource: DataSource,
  ) {}

  canTransition(from: OrderStatus, to: OrderStatus): boolean {
    const allowedTransitions = this.stateTransitions[from] || [];
    return allowedTransitions.includes(to);
  }

  getAllowedTransitions(currentStatus: OrderStatus): OrderStatus[] {
    return this.stateTransitions[currentStatus] || [];
  }

  async transitionOrder(
    orderId: string,
    newStatus: OrderStatus,
    context?: { [key: string]: any; },
  ): Promise<Order> {
    return await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) {
        throw new BusinessException(BusinessErrorCode.ORDER_NOT_FOUND, `Order with ID ${orderId} not found`);
      }

      const currentStatus = order.status;
      if (currentStatus === newStatus) {
          this.logger.log(`Order ${orderId} is already in status ${newStatus}, skipping transition.`);
          return order; // Idempotency
      }

      if (!this.canTransition(currentStatus, newStatus)) {
        throw new BusinessException(BusinessErrorCode.ORDER_STATUS_INVALID, `Invalid status transition from ${currentStatus} to ${newStatus}`);
      }

      const transitionKey = `${currentStatus.toUpperCase()}_TO_${newStatus.toUpperCase()}`;
      const actionKey = [OrderStatus.PENDING, OrderStatus.PAID].includes(currentStatus) && newStatus === OrderStatus.CANCELLED ? 'ANY_TO_CANCELLED' : transitionKey;
      const action = this.transitionActions[actionKey];
      
      if (action) {
        await action(order, context);
      }

      order.status = newStatus;
      const savedOrder = await manager.save(order);

      await this.logStateTransition(manager, order, currentStatus, newStatus, context);

      this.logger.log(`Order ${orderId} status changed from ${currentStatus} to ${newStatus}`);

      return savedOrder;
    });
  }

  private async logStateTransition(manager: any, order: Order, from: OrderStatus, to: OrderStatus, context: any) {
      const auditLog = manager.create(AuditLog, {
        tenantId: order.tenantId,
        resourceType: AuditResourceType.ORDER,
        resourceId: order.id,
        action: AuditAction.UPDATE,
        description: `Status changed from ${from} to ${to}`,
        userId: context?.userId || 'system',
        oldValues: { status: from },
        newValues: { status: to },
        metadata: context,
      });
      await manager.save(auditLog);
  }
  
  // Other methods like batchTransitionOrders, getOrderStatusHistory etc. would also use this corrected logic.
}