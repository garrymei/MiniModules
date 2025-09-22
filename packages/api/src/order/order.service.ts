import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, In, Repository } from 'typeorm'
import { Order, OrderStatus } from '../entities/order.entity'
import { OrderItem } from '../entities/order-item.entity'
import { Sku } from '../entities/sku.entity'
import { CreateOrderDto } from './dto/create-order.dto'

const toCents = (value: string | number): number => {
  const num = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(num)) {
    throw new BadRequestException('Invalid numeric value')
  }
  return Math.round(num * 100)
}

const fromCents = (cents: number): string => {
  return (cents / 100).toFixed(2)
}

@Injectable()
export class OrderService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Sku)
    private readonly skuRepository: Repository<Sku>,
  ) {}

  async createOrder(dto: CreateOrderDto) {
    if (!dto.items?.length) {
      throw new BadRequestException('Order must contain at least one item')
    }

    const skuIds = dto.items.map(item => item.skuId)
    const uniqueSkuIds = Array.from(new Set(skuIds))

    const productsWithSkus = await this.skuRepository.find({
      where: { id: In(uniqueSkuIds) },
      relations: { product: true },
    })

    if (productsWithSkus.length !== uniqueSkuIds.length) {
      throw new NotFoundException('One or more SKUs not found')
    }

    for (const item of dto.items) {
      if (item.quantity <= 0) {
        throw new BadRequestException('Quantity must be positive')
      }
    }

    const tenantMismatch = productsWithSkus.some(
      sku => sku.product.tenantId !== dto.tenantId,
    )
    if (tenantMismatch) {
      throw new BadRequestException('SKUs do not belong to tenant')
    }

    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const skuRepo = queryRunner.manager.getRepository(Sku)
      const orderRepo = queryRunner.manager.getRepository(Order)
      const orderItemRepo = queryRunner.manager.getRepository(OrderItem)

      const lockedSkus = await skuRepo
        .createQueryBuilder('sku')
        .where('sku.id IN (:...ids)', { ids: uniqueSkuIds })
        .setLock('pessimistic_write')
        .getMany()

      if (lockedSkus.length !== uniqueSkuIds.length) {
        throw new NotFoundException('One or more SKUs not found')
      }

      const skuById = new Map(lockedSkus.map(sku => [sku.id, sku]))
      let amountCents = 0

      for (const item of dto.items) {
        const sku = skuById.get(item.skuId)
        if (!sku) {
          throw new NotFoundException(`SKU ${item.skuId} not found`)
        }
        if (sku.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for SKU ${item.skuId}`,
          )
        }
        sku.stock -= item.quantity
        amountCents += toCents(sku.price) * item.quantity
      }

      await skuRepo.save(Array.from(skuById.values()))

      const order = orderRepo.create({
        tenantId: dto.tenantId,
        userId: dto.userId,
        amount: fromCents(amountCents),
        status: OrderStatus.Pending,
        metadata: dto.metadata ?? null,
      })

      await orderRepo.save(order)

      const orderItems = dto.items.map(item => {
        const sku = skuById.get(item.skuId)!
        const unitPriceCents = toCents(sku.price)
        const totalCents = unitPriceCents * item.quantity
        return orderItemRepo.create({
          orderId: order.id,
          skuId: sku.id,
          quantity: item.quantity,
          unitPrice: fromCents(unitPriceCents),
          totalPrice: fromCents(totalCents),
        })
      })

      await orderItemRepo.save(orderItems)

      await queryRunner.commitTransaction()

      const persisted = await this.orderRepository.findOne({
        where: { id: order.id },
        relations: { items: true },
      })

      return persisted
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }
  }

  async getOrderById(id: string) {
    return this.orderRepository.findOne({
      where: { id },
      relations: { items: true },
    })
  }

  async listOrders(tenantId: string, userId?: string) {
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .where('order.tenantId = :tenantId', { tenantId })
      .orderBy('order.createdAt', 'DESC')

    if (userId) {
      qb.andWhere('order.userId = :userId', { userId })
    }

    return qb.getMany()
  }
}
