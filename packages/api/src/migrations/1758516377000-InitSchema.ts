import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitSchema1758516377000 implements MigrationInterface {
  name = 'InitSchema1758516377000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tenants" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(255) NOT NULL,
        "industry" varchar(100) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW()
      )
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "modules" (
        "id" varchar(100) PRIMARY KEY,
        "name" varchar(255) NOT NULL
      )
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tenant_module_configs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "module_id" varchar(100) NOT NULL,
        "config_json" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "tenant_module_configs_tenant_id_fkey"
          FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id")
          ON DELETE CASCADE,
        CONSTRAINT "tenant_module_configs_module_id_fkey"
          FOREIGN KEY ("module_id")
          REFERENCES "modules"("id")
          ON DELETE CASCADE,
        CONSTRAINT "tenant_module_configs_tenant_module_unique"
          UNIQUE ("tenant_id", "module_id")
      )
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_tenant_module_configs_tenant_id"
      ON "tenant_module_configs" ("tenant_id")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_tenant_module_configs_module_id"
      ON "tenant_module_configs" ("module_id")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_tenant_module_configs_module_id"',
    )
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_tenant_module_configs_tenant_id"',
    )
    await queryRunner.query('DROP TABLE IF EXISTS "tenant_module_configs"')
    await queryRunner.query('DROP TABLE IF EXISTS "modules"')
    await queryRunner.query('DROP TABLE IF EXISTS "tenants"')
  }
}
