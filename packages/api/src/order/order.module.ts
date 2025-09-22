import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Order } from '../entities/order.entity'
import { OrderItem } from '../entities/order-item.entity'
import { Product } from '../entities/product.entity'
import { Sku } from '../entities/sku.entity'
import { OrderController } from './order.controller'
import { OrderService } from './order.service'

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Sku, Product])],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
