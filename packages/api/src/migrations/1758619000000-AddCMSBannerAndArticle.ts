import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddCMSBannerAndArticle1758619000000 implements MigrationInterface {
  name = 'AddCMSBannerAndArticle1758619000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建 cms_banners 表
    await queryRunner.createTable(
      new Table({
        name: 'cms_banners',
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
            name: 'title',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'imageUrl',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'linkType',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'product, resource, url, article',
          },
          {
            name: 'linkPayload',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'sort',
            type: 'int',
            default: 0,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'active'",
            comment: 'active, inactive',
          },
          {
            name: 'startAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'endAt',
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

    // 创建 cms_articles 表
    await queryRunner.createTable(
      new Table({
        name: 'cms_articles',
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
            name: 'title',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'excerpt',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'coverUrl',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'linkType',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'product, resource, url, article',
          },
          {
            name: 'linkPayload',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            default: "'general'",
          },
          {
            name: 'tags',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'sort',
            type: 'int',
            default: 0,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'draft'",
            comment: 'draft, published, archived',
          },
          {
            name: 'viewCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'publishedAt',
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
    await queryRunner.createIndex('cms_banners', new TableIndex({
      name: 'IDX_cms_banners_tenant_id',
      columnNames: ['tenantId'],
    }));

    await queryRunner.createIndex('cms_banners', new TableIndex({
      name: 'IDX_cms_banners_status',
      columnNames: ['status'],
    }));

    await queryRunner.createIndex('cms_articles', new TableIndex({
      name: 'IDX_cms_articles_tenant_id',
      columnNames: ['tenantId'],
    }));

    await queryRunner.createIndex('cms_articles', new TableIndex({
      name: 'IDX_cms_articles_status',
      columnNames: ['status'],
    }));

    await queryRunner.createIndex('cms_articles', new TableIndex({
      name: 'IDX_cms_articles_category',
      columnNames: ['category'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除索引
    await queryRunner.dropIndex('cms_articles', 'IDX_cms_articles_category');
    await queryRunner.dropIndex('cms_articles', 'IDX_cms_articles_status');
    await queryRunner.dropIndex('cms_articles', 'IDX_cms_articles_tenant_id');
    await queryRunner.dropIndex('cms_banners', 'IDX_cms_banners_status');
    await queryRunner.dropIndex('cms_banners', 'IDX_cms_banners_tenant_id');

    // 删除表
    await queryRunner.dropTable('cms_articles');
    await queryRunner.dropTable('cms_banners');
  }
}
