const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testWithoutDB() {
  console.log('🧪 测试基础 API 功能（无数据库）...\n');

  try {
    // 1. 检查健康状态
    console.log('1. 检查 API 健康状态...');
    const healthResponse = await axios.get(`${BASE_URL}/healthz`);
    console.log('✅ 健康检查:', healthResponse.data);

    // 2. 测试平台管理接口（模拟数据）
    console.log('\n2. 测试平台管理接口...');
    const tenantId = 'test-tenant-001';
    
    try {
      const entitlementsResponse = await axios.get(`${BASE_URL}/platform/tenants/${tenantId}/entitlements`);
      console.log('✅ 获取租户授权:', entitlementsResponse.data);
    } catch (error) {
      console.log('⚠️ 获取租户授权失败（预期，因为无数据库）:', error.response?.status);
    }

    // 3. 测试用户权限接口
    console.log('\n3. 测试用户权限接口...');
    try {
      const permissionsResponse = await axios.get(`${BASE_URL}/me/permissions?tenantId=${tenantId}`);
      console.log('✅ 用户权限:', permissionsResponse.data);
    } catch (error) {
      console.log('⚠️ 获取用户权限失败（预期，因为无数据库）:', error.response?.status);
    }

    // 4. 测试租户配置接口
    console.log('\n4. 测试租户配置接口...');
    try {
      const configResponse = await axios.get(`${BASE_URL}/api/tenant/${tenantId}/config`);
      console.log('✅ 租户配置:', configResponse.data);
    } catch (error) {
      console.log('⚠️ 获取租户配置失败（预期，因为无数据库）:', error.response?.status);
    }

    console.log('\n🎉 基础 API 测试完成！');
    console.log('\n📝 下一步：');
    console.log('1. 启动 PostgreSQL: docker-compose up -d postgres');
    console.log('2. 运行迁移: pnpm typeorm:ts migration:run');
    console.log('3. 重新测试完整流程');

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ API 服务未启动，请运行: pnpm dev');
    } else {
      console.error('❌ 测试失败:', error.response?.data || error.message);
    }
  }
}

// 运行测试
testWithoutDB();
