import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class InitCoreTables1758614000000 implements MigrationInterface {
  name = 'InitCoreTables1758614000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建 tenants 表
    await queryRunner.createTable(
      new Table({
        name: 'tenants',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'industry',
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

    // 创建 modules_catalog 表
    await queryRunner.createTable(
      new Table({
        name: 'modules_catalog',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'key',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'version',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'active'",
          },
          {
            name: 'capabilities',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // 创建 tenant_module_config 表
    await queryRunner.createTable(
      new Table({
        name: 'tenant_module_config',
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
            name: 'configJson',
            type: 'jsonb',
          },
          {
            name: 'version',
            type: 'int',
            default: 1,
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
    await queryRunner.createIndex('modules_catalog', new TableIndex({
      name: 'IDX_modules_catalog_key',
      columnNames: ['key'],
    }));

    await queryRunner.createIndex('tenant_module_config', new TableIndex({
      name: 'IDX_tenant_module_config_tenant_id',
      columnNames: ['tenantId'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除索引
    await queryRunner.dropIndex('tenant_module_config', 'IDX_tenant_module_config_tenant_id');
    await queryRunner.dropIndex('modules_catalog', 'IDX_modules_catalog_key');

    // 删除表
    await queryRunner.dropTable('tenant_module_config');
    await queryRunner.dropTable('modules_catalog');
    await queryRunner.dropTable('tenants');
  }
}
