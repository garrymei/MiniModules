import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Order } from '../entities/order.entity'
import { PayController } from './pay.controller'
import { PayService } from './pay.service'

@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  controllers: [PayController],
  providers: [PayService],
})
export class PayModule {}
