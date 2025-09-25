import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddNotifyAndSearchIndexes1758617100000 implements MigrationInterface {
  name = 'AddNotifyAndSearchIndexes1758617100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'webhooks',
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
            name: 'event',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'url',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'secret',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'headers',
            type: 'jsonb',
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

    await queryRunner.createIndices('webhooks', [
      new TableIndex({ name: 'IDX_webhooks_tenant', columnNames: ['tenantId'] }),
      new TableIndex({ name: 'IDX_webhooks_event', columnNames: ['event'] }),
      new TableIndex({ name: 'IDX_webhooks_unique', columnNames: ['tenantId', 'event', 'url'], isUnique: true }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'webhook_deliveries',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'webhookId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'tenantId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'event',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'payload',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'statusCode',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'success',
            type: 'boolean',
            default: false,
          },
          {
            name: 'errorMessage',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'responseBody',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'durationMs',
            type: 'int',
            default: 0,
          },
          {
            name: 'attempt',
            type: 'int',
            default: 1,
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

    await queryRunner.createIndices('webhook_deliveries', [
      new TableIndex({ name: 'IDX_webhook_deliveries_webhook', columnNames: ['webhookId'] }),
      new TableIndex({ name: 'IDX_webhook_deliveries_tenant', columnNames: ['tenantId'] }),
      new TableIndex({ name: 'IDX_webhook_deliveries_event', columnNames: ['event'] }),
      new TableIndex({ name: 'IDX_webhook_deliveries_created', columnNames: ['createdAt'] }),
    ]);

    await queryRunner.createForeignKey(
      'webhook_deliveries',
      new TableForeignKey({
        name: 'FK_webhook_deliveries_webhook',
        columnNames: ['webhookId'],
        referencedTableName: 'webhooks',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({ name: 'IDX_products_name', columnNames: ['name'] }),
    );
    await queryRunner.createIndex(
      'products',
      new TableIndex({ name: 'IDX_products_category', columnNames: ['category'] }),
    );

    await queryRunner.createIndex(
      'resources',
      new TableIndex({ name: 'IDX_resources_name', columnNames: ['name'] }),
    );

    await queryRunner.createIndex(
      'cms_articles',
      new TableIndex({ name: 'IDX_cms_articles_title', columnNames: ['title'] }),
    );
    await queryRunner.createIndex(
      'cms_articles',
      new TableIndex({ name: 'IDX_cms_articles_tags', columnNames: ['tags'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('cms_articles', 'IDX_cms_articles_tags');
    await queryRunner.dropIndex('cms_articles', 'IDX_cms_articles_title');

    await queryRunner.dropIndex('resources', 'IDX_resources_name');

    await queryRunner.dropIndex('products', 'IDX_products_category');
    await queryRunner.dropIndex('products', 'IDX_products_name');

    await queryRunner.dropForeignKey('webhook_deliveries', 'FK_webhook_deliveries_webhook');
    await queryRunner.dropIndex('webhook_deliveries', 'IDX_webhook_deliveries_webhook');
    await queryRunner.dropIndex('webhook_deliveries', 'IDX_webhook_deliveries_tenant');
    await queryRunner.dropIndex('webhook_deliveries', 'IDX_webhook_deliveries_event');
    await queryRunner.dropIndex('webhook_deliveries', 'IDX_webhook_deliveries_created');
    await queryRunner.dropTable('webhook_deliveries');

    await queryRunner.dropIndex('webhooks', 'IDX_webhooks_tenant');
    await queryRunner.dropIndex('webhooks', 'IDX_webhooks_event');
    await queryRunner.dropIndex('webhooks', 'IDX_webhooks_unique');
    await queryRunner.dropTable('webhooks');
  }
}
