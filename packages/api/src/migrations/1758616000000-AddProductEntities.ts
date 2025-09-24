import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class AddProductEntities1758616000000 implements MigrationInterface {
  name = 'AddProductEntities1758616000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建 products 表
    await queryRunner.createTable(
      new Table({
        name: 'products',
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
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'images',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['food', 'goods', 'service'],
            default: "'goods'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive', 'draft'],
            default: "'active'",
          },
          {
            name: 'basePrice',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'tags',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'attributes',
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

    // 创建 skus 表
    await queryRunner.createTable(
      new Table({
        name: 'skus',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'productId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'skuCode',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'originalPrice',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'stock',
            type: 'int',
            default: 0,
          },
          {
            name: 'reservedStock',
            type: 'int',
            default: 0,
          },
          {
            name: 'minStock',
            type: 'int',
            default: 0,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive', 'out_of_stock'],
            default: "'active'",
          },
          {
            name: 'attributes',
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

    // 创建 order_items 表
    await queryRunner.createTable(
      new Table({
        name: 'order_items',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'orderId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'skuId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'productName',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'skuName',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'quantity',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'unitPrice',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'totalPrice',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'attributes',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
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

    // 创建 resources 表
    await queryRunner.createTable(
      new Table({
        name: 'resources',
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
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['room', 'table', 'court', 'equipment', 'venue'],
            default: "'room'",
          },
          {
            name: 'capacity',
            type: 'int',
            default: 1,
          },
          {
            name: 'features',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'basePrice',
            type: 'decimal',
            precision: 10,
            scale: 2,
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
            enum: ['active', 'inactive', 'maintenance'],
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

    // 创建 booking_rules 表
    await queryRunner.createTable(
      new Table({
        name: 'booking_rules',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'resourceId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'slotMinutes',
            type: 'int',
            default: 60,
          },
          {
            name: 'openHours',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'maxBookableDays',
            type: 'int',
            default: 7,
          },
          {
            name: 'minBookableHours',
            type: 'int',
            default: 1,
          },
          {
            name: 'maxBookableHours',
            type: 'int',
            default: 0,
          },
          {
            name: 'blackoutDates',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'specialRules',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive'],
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

    // 创建索引
    await queryRunner.createIndex('products', new TableIndex({
      name: 'IDX_products_tenant_id',
      columnNames: ['tenantId']
    }));
    await queryRunner.createIndex('products', new TableIndex({
      name: 'IDX_products_status',
      columnNames: ['status']
    }));
    await queryRunner.createIndex('products', new TableIndex({
      name: 'IDX_products_category',
      columnNames: ['category']
    }));

    await queryRunner.createIndex('skus', new TableIndex({
      name: 'IDX_skus_product_id',
      columnNames: ['productId']
    }));
    await queryRunner.createIndex('skus', new TableIndex({
      name: 'IDX_skus_status',
      columnNames: ['status']
    }));
    await queryRunner.createIndex('skus', new TableIndex({
      name: 'IDX_skus_sku_code',
      columnNames: ['skuCode']
    }));

    await queryRunner.createIndex('order_items', new TableIndex({
      name: 'IDX_order_items_order_id',
      columnNames: ['orderId']
    }));
    await queryRunner.createIndex('order_items', new TableIndex({
      name: 'IDX_order_items_sku_id',
      columnNames: ['skuId']
    }));

    await queryRunner.createIndex('resources', new TableIndex({
      name: 'IDX_resources_tenant_id',
      columnNames: ['tenantId']
    }));
    await queryRunner.createIndex('resources', new TableIndex({
      name: 'IDX_resources_status',
      columnNames: ['status']
    }));
    await queryRunner.createIndex('resources', new TableIndex({
      name: 'IDX_resources_type',
      columnNames: ['type']
    }));

    await queryRunner.createIndex('booking_rules', new TableIndex({
      name: 'IDX_booking_rules_resource_id',
      columnNames: ['resourceId']
    }));
    await queryRunner.createIndex('booking_rules', new TableIndex({
      name: 'IDX_booking_rules_status',
      columnNames: ['status']
    }));

    // 创建外键约束
    await queryRunner.createForeignKey(
      'skus',
      new TableForeignKey({
        columnNames: ['productId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'order_items',
      new TableForeignKey({
        columnNames: ['orderId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'orders',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'order_items',
      new TableForeignKey({
        columnNames: ['skuId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'skus',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'booking_rules',
      new TableForeignKey({
        columnNames: ['resourceId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'resources',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除外键约束
    const skuTable = await queryRunner.getTable('skus');
    const skuForeignKey = skuTable.foreignKeys.find(fk => fk.columnNames.indexOf('productId') !== -1);
    if (skuForeignKey) {
      await queryRunner.dropForeignKey('skus', skuForeignKey);
    }

    const orderItemsTable = await queryRunner.getTable('order_items');
    const orderItemsOrderForeignKey = orderItemsTable.foreignKeys.find(fk => fk.columnNames.indexOf('orderId') !== -1);
    if (orderItemsOrderForeignKey) {
      await queryRunner.dropForeignKey('order_items', orderItemsOrderForeignKey);
    }

    const orderItemsSkuForeignKey = orderItemsTable.foreignKeys.find(fk => fk.columnNames.indexOf('skuId') !== -1);
    if (orderItemsSkuForeignKey) {
      await queryRunner.dropForeignKey('order_items', orderItemsSkuForeignKey);
    }

    const bookingRulesTable = await queryRunner.getTable('booking_rules');
    const bookingRulesForeignKey = bookingRulesTable.foreignKeys.find(fk => fk.columnNames.indexOf('resourceId') !== -1);
    if (bookingRulesForeignKey) {
      await queryRunner.dropForeignKey('booking_rules', bookingRulesForeignKey);
    }

    // 删除表
    await queryRunner.dropTable('booking_rules');
    await queryRunner.dropTable('resources');
    await queryRunner.dropTable('order_items');
    await queryRunner.dropTable('skus');
    await queryRunner.dropTable('products');
  }
}
