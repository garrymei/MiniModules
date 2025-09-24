import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { HealthController } from './modules/health/health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/auth.guard';
import { TenantConfigModule } from './modules/tenant-config/tenant-config.module';
import { PlatformModule } from './modules/platform/platform.module';
import { UserPermissionsModule } from './modules/user-permissions/user-permissions.module';
import { OrderingModule } from './modules/ordering/ordering.module';
import { BookingModule } from './modules/booking/booking.module';
import { PaymentModule } from './modules/payment/payment.module';
import { UsageModule } from './modules/usage/usage.module';
import { AuditModule } from './modules/audit/audit.module';
import { CMSModule } from './modules/cms/cms.module';
import { ExportModule } from './modules/export/export.module';
import { Tenant } from './entities/tenant.entity';
import { ModulesCatalog } from './entities/modules-catalog.entity';
import { TenantModuleConfig } from './entities/tenant-module-config.entity';
import { TenantEntitlement } from './entities/tenant-entitlement.entity';
import { Order } from './entities/order.entity';
import { Booking } from './entities/booking.entity';
import { Product } from './entities/product.entity';
import { SKU } from './entities/sku.entity';
import { OrderItem } from './entities/order-item.entity';
import { Resource } from './entities/resource.entity';
import { BookingRule } from './entities/booking-rule.entity';
import { UsageCounter } from './entities/usage-counter.entity';
import { TenantQuota } from './entities/tenant-quota.entity';
import { AuditLog } from './entities/audit-log.entity';
import { CMSContent } from './entities/cms-content.entity';
import { ExportJob } from './entities/export-job.entity';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_URL || 'postgresql://minimodules:password@localhost:5432/minimodules',
        entities: [
          Tenant, 
          ModulesCatalog, 
          TenantModuleConfig, 
          TenantEntitlement, 
          Order, 
          Booking,
          Product,
          SKU,
          OrderItem,
          Resource,
          BookingRule,
          UsageCounter,
          TenantQuota,
          AuditLog,
          CMSContent,
          ExportJob
        ],
        synchronize: false,
        logging: process.env.TYPEORM_LOGGING === 'true',
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      }),
    }),
    AuthModule,
    TenantConfigModule,
    PlatformModule,
    UserPermissionsModule,
    OrderingModule,
    BookingModule,
    PaymentModule,
    UsageModule,
    AuditModule,
    CMSModule,
    ExportModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}