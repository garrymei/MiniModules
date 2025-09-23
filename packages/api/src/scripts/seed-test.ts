import { DataSource } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';
import { ModulesCatalogSqlite } from '../entities/modules-catalog-sqlite.entity';
import { TenantModuleConfigSqlite } from '../entities/tenant-module-config-sqlite.entity';

// 创建内存数据源用于测试
const dataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  entities: [Tenant, ModulesCatalogSqlite, TenantModuleConfigSqlite],
  synchronize: true,
  logging: false,
});

async function seedTest() {
  try {
    console.log('🌱 开始种子数据注入测试（内存数据库）...');
    
    // 初始化数据源
    await dataSource.initialize();
    console.log('✅ 内存数据库连接成功');

    // 1. 插入模块目录
    console.log('📦 插入模块目录...');
    const modulesCatalog = [
      {
        key: 'ordering',
        name: '点餐系统',
        version: '1.0',
        status: 'active',
        capabilities: {
          features: ['menu_management', 'order_processing', 'payment_integration'],
          permissions: ['read_menu', 'create_order', 'manage_orders']
        }
      },
      {
        key: 'booking',
        name: '预约系统',
        version: '1.0',
        status: 'active',
        capabilities: {
          features: ['slot_management', 'booking_creation', 'calendar_integration'],
          permissions: ['read_slots', 'create_booking', 'manage_bookings']
        }
      }
    ];

    for (const moduleData of modulesCatalog) {
      const module = dataSource.getRepository(ModulesCatalogSqlite).create({
        ...moduleData,
        capabilities: JSON.stringify(moduleData.capabilities)
      });
      await dataSource.getRepository(ModulesCatalogSqlite).save(module);
      console.log(`  ✅ 插入模块: ${moduleData.key}`);
    }

    // 2. 创建租户
    console.log('🏢 创建租户...');
    const tenants = [
      {
        name: '美味餐厅',
        industry: '餐饮',
        status: 'active'
      },
      {
        name: '运动场馆',
        industry: '体育',
        status: 'active'
      }
    ];

    const savedTenants = [];
    for (const tenantData of tenants) {
      const tenant = dataSource.getRepository(Tenant).create(tenantData);
      const savedTenant = await dataSource.getRepository(Tenant).save(tenant);
      savedTenants.push(savedTenant);
      console.log(`  ✅ 创建租户: ${tenantData.name} (ID: ${savedTenant.id})`);
    }

    // 3. 为每个租户创建配置
    console.log('⚙️ 创建租户配置...');
    
    // 餐厅配置
    const restaurantConfig = {
      enabledModules: ['ordering', 'user', 'pay', 'cms'],
      theme: {
        primaryColor: '#FF6A00',
        logo: 'https://example.com/restaurant-logo.png'
      },
      ordering: {
        time_slot_length: 30,
        delivery_radius: 5,
        min_order_amount: 20
      }
    };

    const restaurantConfigEntity = dataSource.getRepository(TenantModuleConfigSqlite).create({
      tenantId: savedTenants[0].id,
      configJson: JSON.stringify(restaurantConfig),
      version: 1
    });
    await dataSource.getRepository(TenantModuleConfigSqlite).save(restaurantConfigEntity);
    console.log(`  ✅ 餐厅配置已创建`);

    // 运动场馆配置
    const sportsConfig = {
      enabledModules: ['booking', 'user', 'pay', 'cms'],
      theme: {
        primaryColor: '#1890FF',
        logo: 'https://example.com/sports-logo.png'
      },
      booking: {
        slot_duration: 60,
        advance_booking_days: 7,
        cancellation_hours: 2
      }
    };

    const sportsConfigEntity = dataSource.getRepository(TenantModuleConfigSqlite).create({
      tenantId: savedTenants[1].id,
      configJson: JSON.stringify(sportsConfig),
      version: 1
    });
    await dataSource.getRepository(TenantModuleConfigSqlite).save(sportsConfigEntity);
    console.log(`  ✅ 运动场馆配置已创建`);

    // 验证数据
    console.log('\n🔍 验证数据...');
    const allModules = await dataSource.getRepository(ModulesCatalogSqlite).find();
    const allTenants = await dataSource.getRepository(Tenant).find();
    const allConfigs = await dataSource.getRepository(TenantModuleConfigSqlite).find();

    console.log(`  - 模块目录: ${allModules.length} 个`);
    console.log(`  - 租户: ${allTenants.length} 个`);
    console.log(`  - 租户配置: ${allConfigs.length} 个`);

    // 测试配置获取
    const restaurantConfigRetrieved = await dataSource.getRepository(TenantModuleConfigSqlite)
      .findOne({ where: { tenantId: savedTenants[0].id } });
    
    if (restaurantConfigRetrieved) {
      console.log('\n📋 餐厅配置内容:');
      console.log(JSON.stringify(JSON.parse(restaurantConfigRetrieved.configJson), null, 2));
    }

    console.log('\n🎉 种子数据注入测试完成！');

  } catch (error) {
    console.error('❌ 种子数据注入测试失败:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('🔌 数据库连接已关闭');
  }
}

// 运行种子脚本测试
if (require.main === module) {
  seedTest();
}

export { seedTest };
