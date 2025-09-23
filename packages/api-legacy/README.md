# API Service

后端服务（REST/GraphQL）模块，提供租户配置、模块管理和业务API。

## 技术栈

- Node.js + Express/Fastify
- TypeScript
- PostgreSQL (主数据库)
- Redis (缓存/会话)
- Prisma/TypeORM (ORM)
- JWT (认证)

## 快速启动

### 1. 环境配置

复制环境变量模板：
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接和Redis：
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/minimodules"
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-jwt-secret-key"

# API
PORT=3000
NODE_ENV=development
```

### 2. 启动依赖服务

使用 Docker Compose 启动 PostgreSQL 和 Redis：
```bash
docker-compose up -d
```

### 3. 安装依赖

```bash
npm install
```

### 4. 数据库迁移

```bash
npm run db:migrate
npm run db:seed
```

### 5. 启动开发服务器

```bash
npm run dev
```

API服务将在 http://localhost:3000 启动

## 核心API端点

### 租户配置
- `GET /api/tenant/{id}/config` - 获取租户配置和启用的模块
- `PUT /api/tenant/{id}/config` - 更新租户配置

### 模块管理
- `GET /api/modules` - 获取所有可用模块
- `GET /api/modules/{id}` - 获取模块详情

### 业务API
- `POST /api/ordering/orders` - 创建订单
- `GET /api/booking/slots` - 获取预约时段
- `POST /api/payment/charge` - 处理支付

## 开发规范

### 模块化约定

每个业务模块需要：
1. 在 `src/modules/{module-name}/` 下实现
2. 包含 `routes.ts`、`service.ts`、`types.ts`
3. 在 `libs/module-spec` 中定义 `module.json` 规范

### 数据库设计

- 多租户隔离：使用 `tenant_id` 字段
- 模块配置：存储在 `module_configs` 表
- 主题配置：存储在 `tenant_themes` 表

## 测试

```bash
# 单元测试
npm run test

# 集成测试
npm run test:integration

# E2E测试
npm run test:e2e
```

## 部署

```bash
# 构建
npm run build

# 生产启动
npm start
```
