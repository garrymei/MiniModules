import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateBookingTables1758521000000 implements MigrationInterface {
  name = 'CreateBookingTables1758521000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "resources" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "name" varchar(255) NOT NULL,
        "type" varchar(100) NOT NULL,
        "meta" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW()
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "time_slot_rules" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "resource_id" uuid NOT NULL,
        "slot_minutes" integer NOT NULL DEFAULT 30,
        "open_hours" jsonb NOT NULL,
        "max_book_days" integer NOT NULL DEFAULT 30,
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "FK_rules_resource" FOREIGN KEY ("resource_id")
          REFERENCES "resources"("id") ON DELETE CASCADE
      )
    `)

    await queryRunner.query(
      `CREATE TYPE "booking_status_enum" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED')`,
    )

    await queryRunner.query(`
      CREATE TABLE "bookings" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "resource_id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "user_id" varchar(255) NOT NULL,
        "start" timestamptz NOT NULL,
        "end" timestamptz NOT NULL,
        "status" "booking_status_enum" NOT NULL DEFAULT 'CONFIRMED',
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "FK_bookings_resource" FOREIGN KEY ("resource_id")
          REFERENCES "resources"("id") ON DELETE CASCADE
      )
    `)

    await queryRunner.query(
      'CREATE INDEX "IDX_bookings_resource_id" ON "bookings" ("resource_id")',
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_bookings_resource_id"')
    await queryRunner.query('DROP TABLE IF EXISTS "bookings"')
    await queryRunner.query('DROP TYPE IF EXISTS "booking_status_enum"')
    await queryRunner.query('DROP TABLE IF EXISTS "time_slot_rules"')
    await queryRunner.query('DROP TABLE IF EXISTS "resources"')
  }
}
