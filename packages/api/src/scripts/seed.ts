import { DataSource } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';
import { ModulesCatalog } from '../entities/modules-catalog.entity';
import { TenantModuleConfig } from '../entities/tenant-module-config.entity';

// 创建数据源
const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/minimodules',
  entities: [Tenant, ModulesCatalog, TenantModuleConfig],
  synchronize: false,
  logging: true,
});

async function seed() {
  try {
    console.log('🌱 开始种子数据注入...');
    
    // 初始化数据源
    await dataSource.initialize();
    console.log('✅ 数据库连接成功');

    // 清理现有数据（可选）
    console.log('🧹 清理现有数据...');
    await dataSource.getRepository(TenantModuleConfig).delete({});
    await dataSource.getRepository(Tenant).delete({});
    await dataSource.getRepository(ModulesCatalog).delete({});

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
      },
      {
        key: 'user',
        name: '用户管理',
        version: '1.0',
        status: 'active',
        capabilities: {
          features: ['user_registration', 'profile_management', 'authentication'],
          permissions: ['read_profile', 'update_profile', 'manage_users']
        }
      },
      {
        key: 'pay',
        name: '支付系统',
        version: '1.0',
        status: 'active',
        capabilities: {
          features: ['wechat_pay', 'alipay', 'refund_processing'],
          permissions: ['process_payment', 'refund_payment', 'view_transactions']
        }
      },
      {
        key: 'cms',
        name: '内容管理',
        version: '1.0',
        status: 'active',
        capabilities: {
          features: ['content_creation', 'media_management', 'seo_optimization'],
          permissions: ['create_content', 'edit_content', 'publish_content']
        }
      }
    ];

    for (const moduleData of modulesCatalog) {
      const module = dataSource.getRepository(ModulesCatalog).create(moduleData);
      await dataSource.getRepository(ModulesCatalog).save(module);
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
      },
      pay: {
        methods: ['wechat', 'alipay'],
        auto_refund: true
      }
    };

    const restaurantConfigEntity = dataSource.getRepository(TenantModuleConfig).create({
      tenantId: savedTenants[0].id,
      configJson: restaurantConfig,
      version: 1
    });
    await dataSource.getRepository(TenantModuleConfig).save(restaurantConfigEntity);
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
      },
      pay: {
        methods: ['wechat', 'alipay'],
        deposit_required: true
      }
    };

    const sportsConfigEntity = dataSource.getRepository(TenantModuleConfig).create({
      tenantId: savedTenants[1].id,
      configJson: sportsConfig,
      version: 1
    });
    await dataSource.getRepository(TenantModuleConfig).save(sportsConfigEntity);
    console.log(`  ✅ 运动场馆配置已创建`);

    console.log('🎉 种子数据注入完成！');
    console.log('\n📊 数据概览:');
    console.log(`  - 模块目录: ${modulesCatalog.length} 个`);
    console.log(`  - 租户: ${savedTenants.length} 个`);
    console.log(`  - 租户配置: 2 个`);
    console.log('\n🔗 测试端点:');
    console.log(`  - 餐厅配置: GET /api/tenant/${savedTenants[0].id}/config`);
    console.log(`  - 运动场馆配置: GET /api/tenant/${savedTenants[1].id}/config`);

  } catch (error) {
    console.error('❌ 种子数据注入失败:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('🔌 数据库连接已关闭');
  }
}

// 运行种子脚本
if (require.main === module) {
  seed();
}

export { seed };
