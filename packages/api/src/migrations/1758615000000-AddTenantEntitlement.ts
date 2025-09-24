import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddTenantEntitlement1758615000000 implements MigrationInterface {
  name = 'AddTenantEntitlement1758615000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建 tenant_entitlements 表
    await queryRunner.createTable(
      new Table({
        name: 'tenant_entitlements',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenantId',
            type: 'uuid',
          },
          {
            name: 'moduleKey',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'active'",
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // 创建索引
    await queryRunner.createIndex('tenant_entitlements', new TableIndex({
      name: 'IDX_tenant_entitlements_tenant_id',
      columnNames: ['tenantId'],
    }));

    await queryRunner.createIndex('tenant_entitlements', new TableIndex({
      name: 'IDX_tenant_entitlements_module_key',
      columnNames: ['moduleKey'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除索引
    await queryRunner.dropIndex('tenant_entitlements', 'IDX_tenant_entitlements_module_key');
    await queryRunner.dropIndex('tenant_entitlements', 'IDX_tenant_entitlements_tenant_id');

    // 删除表
    await queryRunner.dropTable('tenant_entitlements');
  }
}
