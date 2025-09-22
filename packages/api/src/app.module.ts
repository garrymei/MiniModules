import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdminController } from './admin/admin.controller'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import { BookingModule } from './booking/booking.module'
import { typeOrmConfig } from './database/typeorm.config'
import { OrderModule } from './order/order.module'
import { PayModule } from './pay/pay.module'
import { ProductModule } from './product/product.module'
import { TenantConfigModule } from './tenant/tenant-config.module'

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthModule,
    TenantConfigModule,
    ProductModule,
    OrderModule,
    BookingModule,
    PayModule,
  ],
  controllers: [AppController, AdminController],
  providers: [AppService],
})
export class AppModule {}
