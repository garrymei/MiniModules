const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAuthFlow() {
  console.log('🧪 测试授权闭环流程...\n');

  try {
    // 1. 检查健康状态
    console.log('1. 检查 API 健康状态...');
    const healthResponse = await axios.get(`${BASE_URL}/healthz`);
    console.log('✅ 健康检查:', healthResponse.data);

    // 2. 创建租户授权
    console.log('\n2. 为租户添加模块授权...');
    const tenantId = 'test-tenant-001';
    const entitlements = [
      {
        tenantId,
        moduleKey: 'ordering',
        status: 'active'
      },
      {
        tenantId,
        moduleKey: 'user',
        status: 'active'
      }
    ];

    const addEntitlementResponse = await axios.put(
      `${BASE_URL}/platform/tenants/${tenantId}/entitlements`,
      entitlements
    );
    console.log('✅ 添加授权成功:', addEntitlementResponse.data);

    // 3. 检查用户权限
    console.log('\n3. 检查用户权限...');
    const permissionsResponse = await axios.get(
      `${BASE_URL}/me/permissions?tenantId=${tenantId}`
    );
    console.log('✅ 用户权限:', permissionsResponse.data);

    // 4. 创建租户配置
    console.log('\n4. 创建租户配置...');
    const config = {
      tenant_id: tenantId,
      industry: 'restaurant',
      enabled_modules: ['ordering', 'user'],
      theme: {
        primaryColor: '#FF6A00',
        logo: 'https://example.com/logo.png',
        name: '测试餐厅'
      },
      ordering: {
        time_slot_length: 30,
        max_items_per_order: 50,
        enable_takeout: true,
        enable_dine_in: true
      }
    };

    const configResponse = await axios.put(
      `${BASE_URL}/api/tenant/${tenantId}/config`,
      config
    );
    console.log('✅ 配置创建成功:', configResponse.data);

    // 5. 发布配置
    console.log('\n5. 发布租户配置...');
    const publishResponse = await axios.post(
      `${BASE_URL}/api/tenant/${tenantId}/config/publish`,
      { version: 1 }
    );
    console.log('✅ 配置发布成功:', publishResponse.data);

    // 6. 获取最终配置
    console.log('\n6. 获取最终租户配置...');
    const finalConfigResponse = await axios.get(
      `${BASE_URL}/api/tenant/${tenantId}/config`
    );
    console.log('✅ 最终配置:', finalConfigResponse.data);

    console.log('\n🎉 授权闭环测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

// 运行测试
testAuthFlow();
