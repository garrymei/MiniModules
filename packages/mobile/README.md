# 小程序端 (Mobile)

微信小程序前端应用，支持模块化加载和主题配置。

## 技术栈

- 微信小程序原生开发
- TypeScript
- 模块化架构
- 主题配置系统

## 快速启动

### 1. 环境准备

- 安装微信开发者工具
- Node.js 16+
- 微信小程序 AppID

### 2. 项目配置

1. 在微信开发者工具中导入项目
2. 配置 AppID 和项目信息
3. 安装依赖：

```bash
npm install
```

### 3. 环境配置

复制环境配置文件：
```bash
cp config/dev.example.js config/dev.js
```

编辑 `config/dev.js`：
```javascript
module.exports = {
  // API 基础地址
  apiBaseUrl: 'http://localhost:3000/api',
  
  // 租户ID
  tenantId: 'tenant_001',
  
  // 调试模式
  debug: true
}
```

### 4. 启动开发

```bash
# 编译 TypeScript
npm run build

# 监听文件变化
npm run watch
```

在微信开发者工具中点击"编译"即可预览。

## 模块化架构

### 模块加载流程

1. 小程序启动时调用 `/api/tenant/{id}/config` 获取租户配置
2. 根据 `enabled_modules` 动态加载模块
3. 应用主题配置到全局样式

### 模块结构

```
src/
├── modules/           # 业务模块
│   ├── ordering/     # 点餐模块
│   ├── booking/      # 预约模块
│   └── user/         # 用户模块
├── components/       # 公共组件
├── utils/           # 工具函数
├── styles/          # 样式文件
└── app.js           # 小程序入口
```

### 模块开发规范

每个模块需要包含：
- `index.js` - 模块入口
- `pages/` - 页面文件
- `components/` - 模块组件
- `styles/` - 模块样式

## 主题配置

支持动态主题配置：

```javascript
// 从 API 获取主题配置
const theme = await api.getTenantTheme(tenantId);

// 应用主题
app.globalData.theme = theme;
```

## 开发调试

### 本地调试

1. 启动后端 API 服务
2. 配置 `config/dev.js` 中的 API 地址
3. 在微信开发者工具中预览

### 真机调试

1. 确保手机和开发机在同一网络
2. 配置 API 地址为开发机 IP
3. 使用微信开发者工具的"真机调试"功能

## 构建部署

### 开发环境

```bash
npm run build:dev
```

### 生产环境

```bash
npm run build:prod
```

构建产物在 `dist/` 目录，可直接上传到微信小程序后台。

## 常见问题

### 1. 模块加载失败

检查模块规范文件是否存在，确保 `module.json` 格式正确。

### 2. API 请求失败

检查网络连接和 API 服务状态，确认 CORS 配置正确。

### 3. 主题不生效

确保在 `app.js` 中正确应用主题配置。

## 贡献指南

请参考项目根目录的 [CONTRIBUTING.md](../../CONTRIBUTING.md) 文件。
