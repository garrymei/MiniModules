import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1758618000002 implements MigrationInterface {
  name = 'AddPerformanceIndexes1758618000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 订单表索引优化
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_orders_tenant_status_created" 
      ON "orders" ("tenant_id", "status", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_orders_tenant_user_created" 
      ON "orders" ("tenant_id", "user_id", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_orders_idempotency_key" 
      ON "orders" ("idempotency_key") WHERE "idempotency_key" IS NOT NULL
    `);

    // 预约表索引优化
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_bookings_resource_date_status" 
      ON "bookings" ("resource_id", "booking_date", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_bookings_tenant_user_created" 
      ON "bookings" ("tenant_id", "user_id", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_bookings_time_slot" 
      ON "bookings" ("resource_id", "booking_date", "start_time", "end_time")
    `);

    // 产品表索引优化
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_products_tenant_status_available" 
      ON "products" ("tenant_id", "status", "is_available")
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_products_search" 
      ON "products" USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')))
    `);

    // SKU表索引优化
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_skus_product_tenant" 
      ON "skus" ("product_id", "tenant_id")
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_skus_stock_status" 
      ON "skus" ("stock_quantity", "status") WHERE "status" = 'active'
    `);

    // CMS内容表索引优化
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_cms_content_tenant_status_type" 
      ON "cms_content" ("tenant_id", "status", "type")
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_cms_content_search" 
      ON "cms_content" USING gin(to_tsvector('english', title || ' ' || COALESCE(content, '') || ' ' || COALESCE(summary, '')))
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_cms_content_tags" 
      ON "cms_content" USING gin("tags")
    `);

    // 用户表索引优化
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_users_tenant_status" 
      ON "users" ("tenant_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_users_wechat_openid" 
      ON "users" ("wechat_openid") WHERE "wechat_openid" IS NOT NULL
    `);

    // 租户配置表索引优化
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_tenant_module_config_tenant_module" 
      ON "tenant_module_config" ("tenant_id", "module_key")
    `);

    // 审计日志表索引优化
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_audit_log_tenant_created" 
      ON "audit_log" ("tenant_id", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_audit_log_user_created" 
      ON "audit_log" ("user_id", "created_at" DESC) WHERE "user_id" IS NOT NULL
    `);

    // 使用统计表索引优化
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_usage_counter_tenant_metric_date" 
      ON "usage_counter" ("tenant_id", "metric", "date")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除所有创建的索引
    const indexes = [
      'IDX_orders_tenant_status_created',
      'IDX_orders_tenant_user_created',
      'IDX_orders_idempotency_key',
      'IDX_bookings_resource_date_status',
      'IDX_bookings_tenant_user_created',
      'IDX_bookings_time_slot',
      'IDX_products_tenant_status_available',
      'IDX_products_search',
      'IDX_skus_product_tenant',
      'IDX_skus_stock_status',
      'IDX_cms_content_tenant_status_type',
      'IDX_cms_content_search',
      'IDX_cms_content_tags',
      'IDX_users_tenant_status',
      'IDX_users_wechat_openid',
      'IDX_tenant_module_config_tenant_module',
      'IDX_audit_log_tenant_created',
      'IDX_audit_log_user_created',
      'IDX_usage_counter_tenant_metric_date',
    ];

    for (const index of indexes) {
      await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "${index}"`);
    }
  }
}
