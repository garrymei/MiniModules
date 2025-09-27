import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingConstraints1758618000001 implements MigrationInterface {
  name = 'AddBookingConstraints1758618000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 添加预约冲突检查的唯一约束
    await queryRunner.query(`
      CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "idx_bookings_resource_time_conflict" 
      ON "bookings" ("resource_id", "booking_date", "start_time", "end_time") 
      WHERE "status" IN ('confirmed', 'checked_in')
    `);

    // 添加订单幂等性约束
    await queryRunner.query(`
      CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "idx_orders_tenant_number" 
      ON "orders" ("tenant_id", "order_number")
    `);

    // 添加SKU库存检查约束
    await queryRunner.query(`
      ALTER TABLE "skus" 
      ADD CONSTRAINT "chk_skus_stock_non_negative" 
      CHECK ("stock" >= 0)
    `);

    // 添加预约时间合理性约束
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      ADD CONSTRAINT "chk_bookings_time_valid" 
      CHECK ("start_time" < "end_time")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_bookings_resource_time_conflict"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_orders_tenant_number"`);
    await queryRunner.query(`ALTER TABLE "skus" DROP CONSTRAINT IF EXISTS "chk_skus_stock_non_negative"`);
    await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "chk_bookings_time_valid"`);
  }
}
