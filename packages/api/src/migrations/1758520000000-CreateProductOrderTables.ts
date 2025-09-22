import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateProductOrderTables1758520000000
  implements MigrationInterface
{
  name = 'CreateProductOrderTables1758520000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "product_status_enum" AS ENUM ('draft', 'active', 'archived')
    `)
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text,
        "images" text[] NOT NULL DEFAULT '{}',
        "status" "product_status_enum" NOT NULL DEFAULT 'draft',
        "attrs" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW()
      )
    `)
    await queryRunner.query(
      'CREATE INDEX "IDX_products_tenant_id" ON "products" ("tenant_id")',
    )

    await queryRunner.query(`
      CREATE TABLE "skus" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "product_id" uuid NOT NULL,
        "price" numeric(12,2) NOT NULL,
        "stock" integer NOT NULL DEFAULT 0,
        "spec" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "FK_skus_product" FOREIGN KEY ("product_id")
          REFERENCES "products"("id") ON DELETE CASCADE
      )
    `)
    await queryRunner.query(
      'CREATE INDEX "IDX_skus_product_id" ON "skus" ("product_id")',
    )

    await queryRunner.query(
      `CREATE TYPE "order_status_enum" AS ENUM ('PENDING', 'PAID', 'CANCELLED')`,
    )
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "user_id" varchar(255) NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "status" "order_status_enum" NOT NULL DEFAULT 'PENDING',
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW()
      )
    `)
    await queryRunner.query(
      'CREATE INDEX "IDX_orders_tenant_id" ON "orders" ("tenant_id")',
    )
    await queryRunner.query(
      'CREATE INDEX "IDX_orders_user_id" ON "orders" ("user_id")',
    )

    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "order_id" uuid NOT NULL,
        "sku_id" uuid NOT NULL,
        "quantity" integer NOT NULL,
        "unit_price" numeric(12,2) NOT NULL,
        "total_price" numeric(12,2) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "FK_order_items_order" FOREIGN KEY ("order_id")
          REFERENCES "orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_order_items_sku" FOREIGN KEY ("sku_id")
          REFERENCES "skus"("id")
      )
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "order_items"')
    await queryRunner.query('DROP TABLE IF EXISTS "orders"')
    await queryRunner.query('DROP TYPE IF EXISTS "order_status_enum"')
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_skus_product_id"')
    await queryRunner.query('DROP TABLE IF EXISTS "skus"')
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_products_tenant_id"')
    await queryRunner.query('DROP TABLE IF EXISTS "products"')
    await queryRunner.query('DROP TYPE IF EXISTS "product_status_enum"')
  }
}
