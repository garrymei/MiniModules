-- 创建数据库和基础表结构
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 租户表
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 租户配置表
CREATE TABLE tenant_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    config_key VARCHAR(100) NOT NULL,
    config_value JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, config_key)
);

-- 模块配置表
CREATE TABLE module_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    module_id VARCHAR(100) NOT NULL,
    config JSONB NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, module_id)
);

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    phone VARCHAR(20),
    wechat_openid VARCHAR(100),
    nickname VARCHAR(100),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'customer',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 订单表（点餐模块）
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    order_type VARCHAR(50) DEFAULT 'dine_in', -- dine_in, takeout
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 预约表（预约模块）
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    people_count INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入示例数据
INSERT INTO tenants (id, name, industry, domain) VALUES 
('550e8400-e29b-41d4-a716-446655440000', '示例餐厅', 'restaurant', 'demo-restaurant.minimodules.com'),
('550e8400-e29b-41d4-a716-446655440001', '示例健身房', 'fitness', 'demo-gym.minimodules.com');

-- 插入租户配置
INSERT INTO tenant_configs (tenant_id, config_key, config_value) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'theme', '{"primaryColor": "#FF6A00", "logo": "https://example.com/restaurant-logo.png", "name": "示例餐厅"}'),
('550e8400-e29b-41d4-a716-446655440001', 'theme', '{"primaryColor": "#4CAF50", "logo": "https://example.com/gym-logo.png", "name": "示例健身房"}');

-- 插入模块配置
INSERT INTO module_configs (tenant_id, module_id, config) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'ordering', '{"time_slot_length": 30, "max_items_per_order": 50, "enable_takeout": true, "enable_dine_in": true}'),
('550e8400-e29b-41d4-a716-446655440000', 'booking', '{"slot_duration": 60, "advance_booking_days": 7, "max_people_per_slot": 10}'),
('550e8400-e29b-41d4-a716-446655440001', 'booking', '{"slot_duration": 90, "advance_booking_days": 14, "max_people_per_slot": 20}');
