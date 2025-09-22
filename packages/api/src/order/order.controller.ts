import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { CreateOrderDto } from './dto/create-order.dto'
import { OrderService } from './order.service'

@Controller('api/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@Body() body: CreateOrderDto) {
    return this.orderService.createOrder(body)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.getOrderById(id)
  }

  @Get()
  list(@Query('tenantId') tenantId: string, @Query('userId') userId?: string) {
    return this.orderService.listOrders(tenantId, userId)
  }
}
