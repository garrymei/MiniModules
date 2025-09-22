import { Body, Controller, Post } from '@nestjs/common'
import { CreatePayDto } from './dto/create-pay.dto'
import { PayService } from './pay.service'

@Controller('api/pay')
export class PayController {
  constructor(private readonly payService: PayService) {}

  @Post('create')
  create(@Body() body: CreatePayDto) {
    return this.payService.createPrepay(body.orderId)
  }

  @Post('notify')
  notify(@Body() body: unknown) {
    return this.payService.handleNotify(body)
  }
}
