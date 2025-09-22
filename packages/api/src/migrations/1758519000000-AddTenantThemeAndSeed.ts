import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTenantThemeAndSeed1758519000000 implements MigrationInterface {
  name = 'AddTenantThemeAndSeed1758519000000'

  private readonly restaurantTenantId =
    '11111111-1111-1111-1111-111111111111'
  private readonly venueTenantId = '22222222-2222-2222-2222-222222222222'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "theme" jsonb',
    )

    await queryRunner.query(`
      INSERT INTO "modules" ("id", "name") VALUES
        ('ordering', 'Ordering'),
        ('table-management', 'Table Management'),
        ('booking', 'Booking'),
        ('ticketing', 'Ticketing')
      ON CONFLICT ("id") DO NOTHING
    `)

    await queryRunner.query(
      `INSERT INTO "tenants" ("id", "name", "industry", "theme") VALUES
        ('${this.restaurantTenantId}', 'Sunrise Restaurant', 'restaurant', '{"primaryColor":"#E67E22","logo":"https://cdn.example.com/tenants/restaurant/logo.png","buttonRadius":8}'),
        ('${this.venueTenantId}', 'Grand Venue', 'venue', '{"primaryColor":"#2C3E50","logo":"https://cdn.example.com/tenants/venue/logo.png","buttonRadius":4}')
      ON CONFLICT ("id") DO NOTHING`,
    )

    await queryRunner.query(`
      INSERT INTO "tenant_module_configs" ("tenant_id", "module_id", "config_json") VALUES
        ('${this.restaurantTenantId}', 'ordering', '{"serviceFee":0.05,"supportTips":true}'),
        ('${this.restaurantTenantId}', 'table-management', '{"maxPartySize":8,"enableWaitlist":true}'),
        ('${this.venueTenantId}', 'booking', '{"openingHours":{"mon":["09:00","18:00"],"tue":["09:00","18:00"],"sat":["10:00","22:00"],"sun":["10:00","22:00"]}}'),
        ('${this.venueTenantId}', 'ticketing', '{"supportsQr":true,"delivery":["email","sms"]}')
      ON CONFLICT ("tenant_id", "module_id") DO NOTHING
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "tenant_module_configs" WHERE "tenant_id" IN ('${this.restaurantTenantId}', '${this.venueTenantId}')`,
    )
    await queryRunner.query(
      `DELETE FROM "tenants" WHERE "id" IN ('${this.restaurantTenantId}', '${this.venueTenantId}')`,
    )
    await queryRunner.query(
      `DELETE FROM "modules" WHERE "id" IN ('ordering', 'table-management', 'booking', 'ticketing')`,
    )
    await queryRunner.query('ALTER TABLE "tenants" DROP COLUMN IF EXISTS "theme"')
  }
}
