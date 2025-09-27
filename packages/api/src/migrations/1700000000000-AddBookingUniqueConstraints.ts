import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingUniqueConstraints1700000000000 implements MigrationInterface {
  name = 'AddBookingUniqueConstraints1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 删除现有的唯一约束（如果存在）
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      DROP CONSTRAINT IF EXISTS "unique_booking_slot"
    `);

    // 添加新的唯一约束，只对有效状态的预约生效
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      ADD CONSTRAINT "unique_booking_slot_with_status" 
      UNIQUE ("resourceId", "bookingDate", "startTime", "endTime", "status")
      WHERE "status" IN ('confirmed', 'checked_in')
    `);

    // 添加复合索引以提高查询性能
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_booking_tenant_date_status" 
      ON "bookings" ("tenantId", "bookingDate", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_booking_resource_slot_status" 
      ON "bookings" ("resourceId", "bookingDate", "startTime", "endTime", "status")
    `);

    // 添加部分索引用于核销码
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_booking_verification_code_unique" 
      ON "bookings" ("verificationCode") 
      WHERE "verificationCode" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除新添加的约束和索引
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      DROP CONSTRAINT IF EXISTS "unique_booking_slot_with_status"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_booking_tenant_date_status"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_booking_resource_slot_status"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_booking_verification_code_unique"
    `);

    // 恢复原来的约束
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      ADD CONSTRAINT "unique_booking_slot" 
      UNIQUE ("resourceId", "bookingDate", "startTime", "endTime")
    `);
  }
}
