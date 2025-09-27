import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderingController } from './ordering.controller';
import { OrderingService } from './ordering.service';
import { InventoryService } from './services/inventory.service';
import { OrderStateMachineService } from './services/order-state-machine.service';
import { Order } from '../../entities/order.entity';
import { SKU } from '../../entities/sku.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { UsageModule } from '../usage/usage.module';
import { NotifyModule } from '../notify/notify.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, SKU, OrderItem, AuditLog]), UsageModule, NotifyModule],
  controllers: [OrderingController],
  providers: [OrderingService, InventoryService, OrderStateMachineService],
  exports: [OrderingService, InventoryService, OrderStateMachineService],
})
export class OrderingModule {}
