import { Controller, Get, Param, Query } from '@nestjs/common'
import { ProductService } from './product.service'

@Controller('api/products')
export class ProductPublicController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  list(@Query('tenantId') tenantId: string) {
    return this.productService.listByTenant(tenantId)
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.productService.findById(id)
  }
}
