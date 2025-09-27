import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { SKU } from '../../../entities/sku.entity';
import { OrderItem } from '../../../entities/order-item.entity';
import { BusinessException } from '../../../common/errors/business.exception';
import { BusinessErrorCode } from '../../../common/errors/business-codes.enum';

export interface InventoryReservation {
  skuId: string;
  quantity: number;
  reservedUntil: Date;
}

export interface StockCheckResult {
  available: boolean;
  insufficientItems: Array<{
    skuId: string;
    skuName: string;
    requested: number;
    available: number;
  }>;
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(SKU)
    private skuRepository: Repository<SKU>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    private dataSource: DataSource,
  ) {}

  /**
   * 检查库存可用性
   */
  async checkStockAvailability(
    tenantId: string,
    items: Array<{ skuId: string; quantity: number }>,
  ): Promise<StockCheckResult> {
    if (items.length === 0) {
      return { available: true, insufficientItems: [] };
    }

    const skuIds = items.map(item => item.skuId);
    
    // 批量查询SKU信息，避免N+1查询问题
    const skus = await this.skuRepository
      .createQueryBuilder('sku')
      .select([
        'sku.id',
        'sku.name',
        'sku.stock',
        'sku.status',
        'product.id',
        'product.tenantId',
        'product.status'
      ])
      .leftJoin('sku.product', 'product')
      .where('sku.id IN (:...skuIds)', { skuIds })
      .andWhere('product.tenantId = :tenantId', { tenantId })
      .andWhere('sku.status = :status', { status: 'active' })
      .andWhere('product.status = :productStatus', { productStatus: 'active' })
      .getMany();

    if (skus.length !== skuIds.length) {
      throw new BusinessException(
        BusinessErrorCode.RESOURCE_NOT_FOUND,
        'Some SKUs not found or inactive',
      );
    }

    const skuMap = new Map(skus.map(sku => [sku.id, sku]));
    const insufficientItems: Array<{
      skuId: string;
      skuName: string;
      requested: number;
      available: number;
    }> = [];

    // 检查库存
    for (const item of items) {
      const sku = skuMap.get(item.skuId);
      if (!sku) {
        throw new BusinessException(
          BusinessErrorCode.SKU_NOT_FOUND,
          `SKU ${item.skuId} not found`,
        );
      }

      if (sku.stock < item.quantity) {
        insufficientItems.push({
          skuId: item.skuId,
          skuName: sku.name,
          requested: item.quantity,
          available: sku.stock,
        });
      }
    }

    return {
      available: insufficientItems.length === 0,
      insufficientItems,
    };
  }

  /**
   * 使用事务扣减库存，防止并发问题
   */
  async deductStock(
    manager: EntityManager,
    tenantId: string,
    orderId: string,
    items: Array<{ skuId: string; quantity: number; price: number; attributes?: any }>,
  ): Promise<void> {
    // 使用悲观锁来避免死锁，提高并发性能
    const skuIds = items.map(item => item.skuId);
    
    // 批量锁定SKU
    const skus = await manager
      .createQueryBuilder(SKU, 'sku')
      .leftJoinAndSelect('sku.product', 'product')
      .where('sku.id IN (:...skuIds)', { skuIds })
      .andWhere('product.tenantId = :tenantId', { tenantId })
      .setLock('pessimistic_write')
      .getMany();

    if (skus.length !== skuIds.length) {
      throw new BusinessException(
        BusinessErrorCode.RESOURCE_NOT_FOUND,
        'Some SKUs not found or locked by other transactions',
      );
    }

    // 创建SKU映射
    const skuMap = new Map(skus.map(sku => [sku.id, sku]));

    // 验证库存并扣减
    for (const item of items) {
      const sku = skuMap.get(item.skuId);
      
      if (!sku) {
        throw new BusinessException(
          BusinessErrorCode.RESOURCE_NOT_FOUND,
          `SKU ${item.skuId} not found`,
        );
      }

      if (sku.status !== 'active') {
        throw new BusinessException(
          BusinessErrorCode.SKU_INACTIVE,
          `SKU ${sku.name} is not active`,
        );
      }

      if (sku.stock < item.quantity) {
        throw new BusinessException(
          BusinessErrorCode.INSUFFICIENT_STOCK,
          `Insufficient stock for ${sku.name}. Available: ${sku.stock}, Requested: ${item.quantity}`,
        );
      }

      // 使用原子操作更新库存
      await manager
        .createQueryBuilder()
        .update(SKU)
        .set({ 
          stock: () => `stock - ${item.quantity}`,
          updatedAt: new Date()
        })
        .where('id = :skuId', { skuId: item.skuId })
        .andWhere('stock >= :quantity', { quantity: item.quantity })
        .execute();

      // 检查更新是否成功
      const updatedRows = await manager
        .createQueryBuilder()
        .select('1')
        .from(SKU, 'sku')
        .where('sku.id = :skuId', { skuId: item.skuId })
        .andWhere('sku.stock >= 0')
        .getCount();

      if (updatedRows === 0) {
        throw new BusinessException(
          BusinessErrorCode.INSUFFICIENT_STOCK,
          `Stock update failed for ${sku.name}. Concurrent modification detected.`,
        );
      }

      // 创建订单项
      const orderItem = manager.create(OrderItem, {
        orderId,
        skuId: item.skuId,
        productName: sku.product?.name || sku.name,
        skuName: sku.name,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
        attributes: item.attributes ?? sku.attributes,
      });

      await manager.save(orderItem);
    }
  }

  /**
   * 恢复库存（取消订单时）
   */
  async restoreStock(
    tenantId: string,
    orderId: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      // 获取订单项
      const orderItems = await manager.find(OrderItem, {
        where: { orderId },
        relations: ['sku'],
      });

      // 恢复每个SKU的库存
      for (const item of orderItems) {
        if (item.sku) {
          await manager
            .createQueryBuilder()
            .update(SKU)
            .set({
              stock: () => `stock + ${item.quantity}`,
              updatedAt: new Date()
            })
            .where('id = :skuId', { skuId: item.skuId })
            .execute();
        }
      }
    });
  }
}