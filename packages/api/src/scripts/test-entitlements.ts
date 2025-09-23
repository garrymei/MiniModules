import { DataSource } from 'typeorm';
import { TenantEntitlementsSqlite } from '../entities/tenant-entitlements-sqlite.entity';

// 创建内存数据源用于测试
const dataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  entities: [TenantEntitlementsSqlite],
  synchronize: true,
  logging: false,
});

async function testEntitlements() {
  try {
    console.log('🔐 开始测试授权流程...');
    
    // 初始化数据源
    await dataSource.initialize();
    console.log('✅ 内存数据库连接成功');

    const tenantId = 'test-tenant-123';

    // 1. 创建测试授权
    console.log('\n📝 创建测试授权...');
    const entitlements = [
      {
        tenantId,
        moduleKey: 'ordering',
        status: 'enabled' as const,
        expiresAt: null
      },
      {
        tenantId,
        moduleKey: 'booking',
        status: 'disabled' as const,
        expiresAt: null
      },
      {
        tenantId,
        moduleKey: 'user',
        status: 'enabled' as const,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天后过期
      }
    ];

    for (const entitlementData of entitlements) {
      const entitlement = dataSource.getRepository(TenantEntitlementsSqlite).create(entitlementData);
      await dataSource.getRepository(TenantEntitlementsSqlite).save(entitlement);
      console.log(`  ✅ 创建授权: ${entitlementData.moduleKey} - ${entitlementData.status}`);
    }

    // 2. 测试授权查询
    console.log('\n🔍 查询租户授权...');
    const allEntitlements = await dataSource.getRepository(TenantEntitlementsSqlite).find({
      where: { tenantId }
    });

    console.log(`  租户 ${tenantId} 的授权列表:`);
    allEntitlements.forEach(entitlement => {
      console.log(`    - ${entitlement.moduleKey}: ${entitlement.status}${entitlement.expiresAt ? ` (过期时间: ${entitlement.expiresAt.toISOString()})` : ''}`);
    });

    // 3. 测试模块访问检查
    console.log('\n🔒 测试模块访问检查...');
    
    const checkModule = async (moduleKey: string) => {
      const entitlement = await dataSource.getRepository(TenantEntitlementsSqlite).findOne({
        where: {
          tenantId,
          moduleKey,
          status: 'enabled',
        },
      });

      if (!entitlement) {
        console.log(`    ❌ ${moduleKey}: 未授权`);
        return false;
      }

      // 检查是否过期
      if (entitlement.expiresAt && entitlement.expiresAt <= new Date()) {
        console.log(`    ⏰ ${moduleKey}: 已过期`);
        return false;
      }

      console.log(`    ✅ ${moduleKey}: 已授权`);
      return true;
    };

    await checkModule('ordering');
    await checkModule('booking');
    await checkModule('user');
    await checkModule('pay'); // 未配置的模块

    // 4. 测试授权更新
    console.log('\n🔄 测试授权更新...');
    
    // 删除现有授权
    await dataSource.getRepository(TenantEntitlementsSqlite).delete({ tenantId });
    
    // 创建新授权
    const newEntitlements = [
      {
        tenantId,
        moduleKey: 'ordering',
        status: 'enabled' as const,
        expiresAt: null
      },
      {
        tenantId,
        moduleKey: 'pay',
        status: 'enabled' as const,
        expiresAt: null
      }
    ];

    for (const entitlementData of newEntitlements) {
      const entitlement = dataSource.getRepository(TenantEntitlementsSqlite).create(entitlementData);
      await dataSource.getRepository(TenantEntitlementsSqlite).save(entitlement);
      console.log(`  ✅ 更新授权: ${entitlementData.moduleKey} - ${entitlementData.status}`);
    }

    // 验证更新结果
    const updatedEntitlements = await dataSource.getRepository(TenantEntitlementsSqlite).find({
      where: { tenantId }
    });

    console.log(`\n📋 更新后的授权列表:`);
    updatedEntitlements.forEach(entitlement => {
      console.log(`    - ${entitlement.moduleKey}: ${entitlement.status}`);
    });

    console.log('\n🎉 授权流程测试完成！');

  } catch (error) {
    console.error('❌ 授权流程测试失败:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('🔌 数据库连接已关闭');
  }
}

// 运行测试
if (require.main === module) {
  testEntitlements();
}

export { testEntitlements };
