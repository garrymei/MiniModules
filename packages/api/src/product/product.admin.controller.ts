import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { Request } from 'express'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { Role } from '../auth/roles.enum'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { ProductService } from './product.service'

interface AuthenticatedRequest extends Request {
  user?: {
    role: Role
  }
}

@Controller('admin/products')
@UseGuards(JwtAuthGuard)
export class ProductAdminController {
  constructor(private readonly productService: ProductService) {}

  private assertAdmin(req: AuthenticatedRequest) {
    if (req.user?.role !== Role.Admin) {
      throw new ForbiddenException('Admin role required')
    }
  }

  @Post()
  async create(
    @Body() body: CreateProductDto,
    @Req() req: AuthenticatedRequest,
  ) {
    this.assertAdmin(req)
    return this.productService.create(body)
  }

  @Get()
  async list(
    @Query('tenantId') tenantId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    this.assertAdmin(req)
    return this.productService.listByTenant(tenantId)
  }

  @Get(':id')
  async get(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    this.assertAdmin(req)
    return this.productService.findById(id)
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
    @Req() req: AuthenticatedRequest,
  ) {
    this.assertAdmin(req)
    return this.productService.update(id, body)
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    this.assertAdmin(req)
    await this.productService.delete(id)
    return { success: true }
  }
}
