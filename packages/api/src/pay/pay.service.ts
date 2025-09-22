import { randomBytes } from 'crypto'
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Order, OrderStatus } from '../entities/order.entity'

const createNonce = () => randomBytes(16).toString('hex')

@Injectable()
export class PayService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async createPrepay(orderId: string) {
    if (!orderId) {
      throw new BadRequestException('orderId is required')
    }

    const order = await this.orderRepository.findOne({ where: { id: orderId } })

    if (!order) {
      throw new NotFoundException('Order not found')
    }

    if (order.status === OrderStatus.Cancelled) {
      throw new BadRequestException('Order already cancelled')
    }

    const amount = Number(order.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Invalid order amount')
    }

    const nonceStr = createNonce()
    const timeStamp = Math.floor(Date.now() / 1000).toString()

    return {
      prepayId: `mock_${order.id}`,
      nonceStr,
      timeStamp,
      paySign: 'mock',
      amount: order.amount,
    }
  }

  async handleNotify(payload: unknown) {
    // placeholder: persist or process notification later
    // eslint-disable-next-line no-console
    console.log('Received pay notify payload', payload)
    return { received: true }
  }
}
