import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddRolePermissions1758617300000 implements MigrationInterface {
  name = 'AddRolePermissions1758617300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'roles',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'tenantId', type: 'uuid', isNullable: false },
          { name: 'name', type: 'varchar', length: '100', isNullable: false },
          { name: 'type', type: 'varchar', length: '50', default: "'custom'" },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'role_permissions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'tenantId', type: 'uuid', isNullable: false },
          { name: 'roleId', type: 'uuid', isNullable: false },
          { name: 'resource', type: 'varchar', length: '120', isNullable: false },
          { name: 'action', type: 'varchar', length: '120', isNullable: false },
          { name: 'module', type: 'varchar', length: '120', isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'user_roles',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'tenantId', type: 'uuid', isNullable: false },
          { name: 'userId', type: 'uuid', isNullable: false },
          { name: 'roleId', type: 'uuid', isNullable: false },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex('roles', new TableIndex({ name: 'IDX_roles_tenant', columnNames: ['tenantId'] }));
    await queryRunner.createIndex('roles', new TableIndex({ name: 'IDX_roles_tenant_name', columnNames: ['tenantId', 'name'], isUnique: true }));

    await queryRunner.createIndex('role_permissions', new TableIndex({ name: 'IDX_role_permissions_tenant', columnNames: ['tenantId'] }));
    await queryRunner.createIndex('role_permissions', new TableIndex({ name: 'IDX_role_permissions_role', columnNames: ['roleId'] }));
    await queryRunner.createIndex(
      'role_permissions',
      new TableIndex({ name: 'IDX_role_permissions_unique', columnNames: ['tenantId', 'roleId', 'resource', 'action', 'module'], isUnique: true }),
    );

    await queryRunner.createIndex('user_roles', new TableIndex({ name: 'IDX_user_roles_tenant', columnNames: ['tenantId'] }));
    await queryRunner.createIndex('user_roles', new TableIndex({ name: 'IDX_user_roles_user', columnNames: ['userId'] }));
    await queryRunner.createIndex(
      'user_roles',
      new TableIndex({ name: 'IDX_user_roles_unique', columnNames: ['tenantId', 'userId', 'roleId'], isUnique: true }),
    );

    await queryRunner.createForeignKey(
      'role_permissions',
      new TableForeignKey({
        columnNames: ['roleId'],
        referencedTableName: 'roles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_roles',
      new TableForeignKey({
        columnNames: ['roleId'],
        referencedTableName: 'roles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_roles');
    await queryRunner.dropTable('role_permissions');
    await queryRunner.dropTable('roles');
  }
}
