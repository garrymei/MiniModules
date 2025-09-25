import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class EnhanceConfigVersioning1758618000000 implements MigrationInterface {
  name = 'EnhanceConfigVersioning1758618000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 为 tenant_module_config 表添加审批相关字段
    await queryRunner.addColumn('tenant_module_config', new TableColumn({
      name: 'approvedBy',
      type: 'uuid',
      isNullable: true,
    }));

    await queryRunner.addColumn('tenant_module_config', new TableColumn({
      name: 'reviewNote',
      type: 'text',
      isNullable: true,
    }));

    await queryRunner.addColumn('tenant_module_config', new TableColumn({
      name: 'submittedAt',
      type: 'timestamp',
      isNullable: true,
    }));

    await queryRunner.addColumn('tenant_module_config', new TableColumn({
      name: 'approvedAt',
      type: 'timestamp',
      isNullable: true,
    }));

    await queryRunner.addColumn('tenant_module_config', new TableColumn({
      name: 'publishedAt',
      type: 'timestamp',
      isNullable: true,
    }));

    // 扩展status字段支持更多状态
    await queryRunner.query(`
      ALTER TABLE tenant_module_config 
      DROP CONSTRAINT IF EXISTS "CHK_tenant_module_config_status"
    `);

    await queryRunner.query(`
      ALTER TABLE tenant_module_config 
      ADD CONSTRAINT "CHK_tenant_module_config_status" 
      CHECK (status IN ('draft', 'submitted', 'approved', 'published', 'rejected'))
    `);

    // 更新现有记录的status
    await queryRunner.query(`
      UPDATE tenant_module_config 
      SET status = 'published' 
      WHERE status = 'published'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除添加的列
    await queryRunner.dropColumn('tenant_module_config', 'publishedAt');
    await queryRunner.dropColumn('tenant_module_config', 'approvedAt');
    await queryRunner.dropColumn('tenant_module_config', 'submittedAt');
    await queryRunner.dropColumn('tenant_module_config', 'reviewNote');
    await queryRunner.dropColumn('tenant_module_config', 'approvedBy');

    // 恢复原始status约束
    await queryRunner.query(`
      ALTER TABLE tenant_module_config 
      DROP CONSTRAINT IF EXISTS "CHK_tenant_module_config_status"
    `);

    await queryRunner.query(`
      ALTER TABLE tenant_module_config 
      ADD CONSTRAINT "CHK_tenant_module_config_status" 
      CHECK (status IN ('draft', 'published'))
    `);
  }
}
