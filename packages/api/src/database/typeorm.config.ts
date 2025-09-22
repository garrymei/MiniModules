import { config as loadEnv } from 'dotenv'
import { join } from 'path'
import { DataSource, DataSourceOptions } from 'typeorm'
import { Booking } from '../entities/booking.entity'
import { ModuleEntity } from '../entities/module.entity'
import { Order } from '../entities/order.entity'
import { OrderItem } from '../entities/order-item.entity'
import { Product } from '../entities/product.entity'
import { Resource } from '../entities/resource.entity'
import { Sku } from '../entities/sku.entity'
import { TenantModuleConfig } from '../entities/tenant-module-config.entity'
import { Tenant } from '../entities/tenant.entity'
import { TimeSlotRule } from '../entities/time-slot-rule.entity'

loadEnv()

const migrationsPath = join(__dirname, '..', 'migrations', '*{.ts,.js}')

const defaultDatabaseUrl =
  'postgres://postgres:postgres@localhost:5432/minimodules'

const databaseUrl = process.env.DB_URL ?? defaultDatabaseUrl

export const entities = [
  Tenant,
  ModuleEntity,
  TenantModuleConfig,
  Product,
  Sku,
  Order,
  OrderItem,
  Resource,
  TimeSlotRule,
  Booking,
]

export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  url: databaseUrl,
  entities,
  migrations: [migrationsPath],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
}

export const appDataSource = new DataSource(typeOrmConfig)
