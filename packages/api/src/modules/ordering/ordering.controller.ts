import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OrderingService, CreateOrderDto, UpdateOrderDto } from './ordering.service';
import { Order } from '../../entities/order.entity';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RequireModule } from '../../decorators/require-module.decorator';

@ApiTags('ordering')
@Controller('ordering')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderingController {
  constructor(private readonly orderingService: OrderingService) {}

  @Post('orders')
  @RequireModule('ordering')
  @ApiOperation({ summary: '创建订单' })
  @ApiResponse({ status: 201, description: '订单创建成功', type: Order })
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<Order> {
    return this.orderingService.createOrder(createOrderDto);
  }

  @Get('orders')
  @RequireModule('ordering')
  @ApiOperation({ summary: '获取订单列表' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: '偏移量' })
  @ApiResponse({ status: 200, description: '订单列表', type: [Order] })
  async getOrders(
    @Query('tenantId') tenantId: string,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ): Promise<Order[]> {
    return this.orderingService.getOrdersByTenant(tenantId, limit, offset);
  }

  @Get('orders/:id')
  @RequireModule('ordering')
  @ApiOperation({ summary: '获取订单详情' })
  @ApiParam({ name: 'id', description: '订单ID' })
  @ApiResponse({ status: 200, description: '订单详情', type: Order })
  @ApiResponse({ status: 404, description: '订单未找到' })
  async getOrderById(@Param('id') id: string): Promise<Order> {
    return this.orderingService.getOrderById(id);
  }

  @Get('orders/user/:userId')
  @RequireModule('ordering')
  @ApiOperation({ summary: '获取用户订单列表' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiResponse({ status: 200, description: '用户订单列表', type: [Order] })
  async getOrdersByUserId(
    @Param('userId') userId: string,
    @Query('tenantId') tenantId: string,
  ): Promise<Order[]> {
    return this.orderingService.getOrdersByUserId(tenantId, userId);
  }

  @Put('orders/:id')
  @RequireModule('ordering')
  @ApiOperation({ summary: '更新订单' })
  @ApiParam({ name: 'id', description: '订单ID' })
  @ApiResponse({ status: 200, description: '订单更新成功', type: Order })
  @ApiResponse({ status: 404, description: '订单未找到' })
  async updateOrder(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<Order> {
    return this.orderingService.updateOrder(id, updateOrderDto);
  }

  @Delete('orders/:id')
  @RequireModule('ordering')
  @ApiOperation({ summary: '删除订单' })
  @ApiParam({ name: 'id', description: '订单ID' })
  @ApiResponse({ status: 200, description: '订单删除成功' })
  @ApiResponse({ status: 404, description: '订单未找到' })
  async deleteOrder(@Param('id') id: string): Promise<void> {
    return this.orderingService.deleteOrder(id);
  }
}