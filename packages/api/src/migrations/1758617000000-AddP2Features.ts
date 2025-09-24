import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class AddP2Features1758617000000 implements MigrationInterface {
  name = 'AddP2Features1758617000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建 usage_counters 表
    await queryRunner.createTable(
      new Table({
        name: 'usage_counters',
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
            name: 'metric',
            type: 'enum',
            enum: ['orders', 'bookings', 'users', 'storage', 'api_calls'],
            isNullable: false,
          },
          {
            name: 'period',
            type: 'enum',
            enum: ['daily', 'monthly', 'yearly'],
            isNullable: false,
          },
          {
            name: 'periodDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'value',
            type: 'int',
            default: 0,
          },
          {
            name: 'metadata',
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

    // 创建 tenant_quotas 表
    await queryRunner.createTable(
      new Table({
        name: 'tenant_quotas',
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
            name: 'metric',
            type: 'enum',
            enum: ['orders', 'bookings', 'users', 'storage', 'api_calls'],
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['hard_limit', 'soft_limit', 'warning'],
            isNullable: false,
          },
          {
            name: 'limit',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'period',
            type: 'varchar',
            length: '50',
            default: "'monthly'",
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
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

    // 创建 audit_logs 表
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
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
            isNullable: true,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'userEmail',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'action',
            type: 'enum',
            enum: ['create', 'update', 'delete', 'login', 'logout', 'grant', 'revoke', 'publish', 'rollback', 'export', 'import'],
            isNullable: false,
          },
          {
            name: 'resourceType',
            type: 'enum',
            enum: ['tenant', 'user', 'module', 'config', 'order', 'booking', 'product', 'resource', 'quota', 'entitlement'],
            isNullable: false,
          },
          {
            name: 'resourceId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'resourceName',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'oldValues',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'newValues',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'result',
            type: 'enum',
            enum: ['success', 'failure', 'partial'],
            default: "'success'",
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'userAgent',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'requestId',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'metadata',
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

    // 创建 cms_contents 表
    await queryRunner.createTable(
      new Table({
        name: 'cms_contents',
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
            name: 'type',
            type: 'enum',
            enum: ['banner', 'announcement', 'article', 'activity', 'news'],
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'summary',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'coverImage',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'images',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'published', 'archived'],
            default: "'draft'",
          },
          {
            name: 'jumpType',
            type: 'enum',
            enum: ['page', 'url', 'internal', 'none'],
            default: "'none'",
          },
          {
            name: 'jumpUrl',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'tags',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'sortOrder',
            type: 'int',
            default: 0,
          },
          {
            name: 'viewCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'publishedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'metadata',
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

    // 创建 export_jobs 表
    await queryRunner.createTable(
      new Table({
        name: 'export_jobs',
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
            name: 'userId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['orders', 'bookings', 'users', 'products', 'resources', 'audit_logs', 'usage_stats'],
            isNullable: false,
          },
          {
            name: 'format',
            type: 'enum',
            enum: ['csv', 'excel', 'json'],
            default: "'csv'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
            default: "'pending'",
          },
          {
            name: 'fileName',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'fileUrl',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'downloadUrl',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'fileSize',
            type: 'bigint',
            default: 0,
          },
          {
            name: 'recordCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'filters',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'startedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completedAt',
            type: 'timestamp',
            isNullable: true,
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
    await queryRunner.createIndex('usage_counters', new TableIndex({
      name: 'IDX_usage_counters_tenant_id',
      columnNames: ['tenantId']
    }));
    await queryRunner.createIndex('usage_counters', new TableIndex({
      name: 'IDX_usage_counters_metric',
      columnNames: ['metric']
    }));
    await queryRunner.createIndex('usage_counters', new TableIndex({
      name: 'IDX_usage_counters_period_date',
      columnNames: ['periodDate']
    }));
    await queryRunner.createIndex('usage_counters', new TableIndex({
      name: 'IDX_usage_counters_unique',
      columnNames: ['tenantId', 'metric', 'period', 'periodDate'],
      isUnique: true
    }));

    await queryRunner.createIndex('tenant_quotas', new TableIndex({
      name: 'IDX_tenant_quotas_tenant_id',
      columnNames: ['tenantId']
    }));
    await queryRunner.createIndex('tenant_quotas', new TableIndex({
      name: 'IDX_tenant_quotas_metric',
      columnNames: ['metric']
    }));
    await queryRunner.createIndex('tenant_quotas', new TableIndex({
      name: 'IDX_tenant_quotas_unique',
      columnNames: ['tenantId', 'metric', 'type'],
      isUnique: true
    }));

    await queryRunner.createIndex('audit_logs', new TableIndex({
      name: 'IDX_audit_logs_tenant_id',
      columnNames: ['tenantId']
    }));
    await queryRunner.createIndex('audit_logs', new TableIndex({
      name: 'IDX_audit_logs_user_id',
      columnNames: ['userId']
    }));
    await queryRunner.createIndex('audit_logs', new TableIndex({
      name: 'IDX_audit_logs_action',
      columnNames: ['action']
    }));
    await queryRunner.createIndex('audit_logs', new TableIndex({
      name: 'IDX_audit_logs_resource_type',
      columnNames: ['resourceType']
    }));
    await queryRunner.createIndex('audit_logs', new TableIndex({
      name: 'IDX_audit_logs_created_at',
      columnNames: ['createdAt']
    }));

    await queryRunner.createIndex('cms_contents', new TableIndex({
      name: 'IDX_cms_contents_tenant_id',
      columnNames: ['tenantId']
    }));
    await queryRunner.createIndex('cms_contents', new TableIndex({
      name: 'IDX_cms_contents_type',
      columnNames: ['type']
    }));
    await queryRunner.createIndex('cms_contents', new TableIndex({
      name: 'IDX_cms_contents_status',
      columnNames: ['status']
    }));

    await queryRunner.createIndex('export_jobs', new TableIndex({
      name: 'IDX_export_jobs_tenant_id',
      columnNames: ['tenantId']
    }));
    await queryRunner.createIndex('export_jobs', new TableIndex({
      name: 'IDX_export_jobs_user_id',
      columnNames: ['userId']
    }));
    await queryRunner.createIndex('export_jobs', new TableIndex({
      name: 'IDX_export_jobs_type',
      columnNames: ['type']
    }));
    await queryRunner.createIndex('export_jobs', new TableIndex({
      name: 'IDX_export_jobs_status',
      columnNames: ['status']
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('export_jobs');
    await queryRunner.dropTable('cms_contents');
    await queryRunner.dropTable('audit_logs');
    await queryRunner.dropTable('tenant_quotas');
    await queryRunner.dropTable('usage_counters');
  }
}
