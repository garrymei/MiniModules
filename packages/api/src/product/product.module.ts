import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { Product } from '../entities/product.entity'
import { Sku } from '../entities/sku.entity'
import { ProductAdminController } from './product.admin.controller'
import { ProductPublicController } from './product.public.controller'
import { ProductService } from './product.service'

@Module({
  imports: [TypeOrmModule.forFeature([Product, Sku]), AuthModule],
  controllers: [ProductAdminController, ProductPublicController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
