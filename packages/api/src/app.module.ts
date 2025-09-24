import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { HealthController } from './modules/health/health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/auth.guard';
import { TenantConfigModule } from './modules/tenant-config/tenant-config.module';
import { PlatformModule } from './modules/platform/platform.module';
import { UserPermissionsModule } from './modules/user-permissions/user-permissions.module';
import { OrderingModule } from './modules/ordering/ordering.module';
import { BookingModule } from './modules/booking/booking.module';
import { Tenant } from './entities/tenant.entity';
import { ModulesCatalog } from './entities/modules-catalog.entity';
import { TenantModuleConfig } from './entities/tenant-module-config.entity';
import { TenantEntitlement } from './entities/tenant-entitlement.entity';
import { Order } from './entities/order.entity';
import { Booking } from './entities/booking.entity';

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
        entities: [Tenant, ModulesCatalog, TenantModuleConfig, TenantEntitlement, Order, Booking],
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
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}