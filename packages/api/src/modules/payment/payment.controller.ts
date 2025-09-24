import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PaymentService, CreatePaymentDto, PaymentNotifyDto } from './payment.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { Public } from '../auth/public.decorator';

@ApiTags('payment')
@Controller('pay')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create')
  @ApiOperation({ summary: '创建支付订单' })
  @ApiResponse({ 
    status: 201, 
    description: '支付订单创建成功',
    schema: {
      type: 'object',
      properties: {
        prepayId: { type: 'string', description: '预支付ID' },
        nonceStr: { type: 'string', description: '随机字符串' },
        timeStamp: { type: 'string', description: '时间戳' },
        paySign: { type: 'string', description: '支付签名' },
        orderId: { type: 'string', description: '订单ID' },
        amount: { type: 'number', description: '支付金额' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: '请求参数错误' 
  })
  @ApiResponse({ 
    status: 404, 
    description: '订单或预约不存在' 
  })
  async createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.createPayment(createPaymentDto);
  }

  @Post('notify')
  @Public()
  @ApiOperation({ summary: '支付回调通知' })
  @ApiResponse({ 
    status: 200, 
    description: '支付回调处理成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  async paymentNotify(@Body() notifyDto: PaymentNotifyDto) {
    return this.paymentService.handlePaymentNotify(notifyDto);
  }

  @Get('status/:orderId')
  @ApiOperation({ summary: '查询支付状态' })
  @ApiParam({ name: 'orderId', description: '订单ID或预约ID' })
  @ApiResponse({ 
    status: 200, 
    description: '支付状态查询成功',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: '支付状态' },
        amount: { type: 'number', description: '支付金额' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: '订单或预约不存在' 
  })
  async getPaymentStatus(@Param('orderId') orderId: string) {
    return this.paymentService.getPaymentStatus(orderId);
  }

  @Post('mock-success/:orderId')
  @ApiOperation({ summary: '模拟支付成功（测试用）' })
  @ApiParam({ name: 'orderId', description: '订单ID或预约ID' })
  @ApiResponse({ 
    status: 200, 
    description: '模拟支付成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  async mockPaymentSuccess(@Param('orderId') orderId: string) {
    const mockNotify: PaymentNotifyDto = {
      orderId,
      transactionId: `mock_txn_${Date.now()}`,
      status: 'success',
      amount: 100, // 模拟金额
      timestamp: new Date().toISOString(),
    };
    return this.paymentService.handlePaymentNotify(mockNotify);
  }

  @Post('mock-failed/:orderId')
  @ApiOperation({ summary: '模拟支付失败（测试用）' })
  @ApiParam({ name: 'orderId', description: '订单ID或预约ID' })
  @ApiResponse({ 
    status: 200, 
    description: '模拟支付失败',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  async mockPaymentFailed(@Param('orderId') orderId: string) {
    const mockNotify: PaymentNotifyDto = {
      orderId,
      transactionId: `mock_txn_${Date.now()}`,
      status: 'failed',
      amount: 100,
      timestamp: new Date().toISOString(),
    };
    return this.paymentService.handlePaymentNotify(mockNotify);
  }
}
