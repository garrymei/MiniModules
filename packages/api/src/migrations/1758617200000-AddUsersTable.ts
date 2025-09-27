import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddUsersTable1758617200000 implements MigrationInterface {
  name = 'AddUsersTable1758617200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
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
            isNullable: false,
          },
          {
            name: 'wechatOpenId',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'unionId',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'nickname',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'avatarUrl',
            type: 'varchar',
            length: '255',
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

    await queryRunner.createIndex(
      'users',
      new TableIndex({ name: 'IDX_users_tenant', columnNames: ['tenantId'] }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({ name: 'IDX_users_wechat', columnNames: ['wechatOpenId'], isUnique: true }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('users', 'IDX_users_wechat');
    await queryRunner.dropIndex('users', 'IDX_users_tenant');
    await queryRunner.dropTable('users');
  }
}
