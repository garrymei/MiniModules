# 模块规范文档

## 概述

MiniModules 采用模块化架构，每个业务功能都是一个独立的模块。模块规范定义了模块的结构、配置、路由和权限等信息。

## 模块规范结构

### 基础字段

```json
{
  "id": "string",           // 模块唯一标识符
  "name": "string",         // 模块显示名称
  "version": "string",      // 模块版本 (语义化版本)
  "description": "string",  // 模块描述
  "category": "string"      // 模块分类
}
```

### 路由配置

```json
{
  "routes": [
    {
      "path": "string",      // 路由路径
      "component": "string", // 组件名称
      "title": "string",     // 页面标题
      "icon": "string",      // 图标名称 (可选)
      "hidden": "boolean"    // 是否隐藏 (可选)
    }
  ]
}
```

### 配置模式

使用 JSON Schema 定义模块配置：

```json
{
  "config_schema": {
    "type": "object",
    "properties": {
      "property_name": {
        "type": "string|number|boolean|array|object",
        "default": "default_value",
        "description": "配置说明",
        "minimum": 0,        // 数字类型最小值
        "maximum": 100,      // 数字类型最大值
        "enum": ["a", "b"]   // 枚举值
      }
    },
    "required": ["property_name"]
  }
}
```

### 功能能力

```json
{
  "capabilities": [
    "capability_1",  // 模块提供的功能列表
    "capability_2"
  ]
}
```

### 依赖关系

```json
{
  "dependencies": [
    "module_id_1",  // 依赖的其他模块
    "module_id_2"
  ]
}
```

### 权限配置

```json
{
  "permissions": {
    "read": ["role1", "role2"],    // 可读权限的角色
    "write": ["role1", "role3"],   // 可写权限的角色
    "admin": ["admin"]             // 管理权限的角色
  }
}
```

### API 端点

```json
{
  "api_endpoints": [
    "GET /api/module/endpoint1",
    "POST /api/module/endpoint2"
  ]
}
```

## 模块分类

### Core Modules (核心模块)

基础功能模块，其他模块的依赖：

- `user`: 用户管理
- `auth`: 认证授权
- `tenant`: 租户管理
- `theme`: 主题配置

### Business Modules (业务模块)

具体业务功能模块：

- `ordering`: 点餐模块
- `booking`: 预约模块
- `ecommerce`: 电商模块
- `ticketing`: 票务模块
- `cms`: 内容管理

### UI Modules (界面模块)

界面相关模块：

- `layout`: 布局组件
- `navigation`: 导航组件
- `form`: 表单组件

## 模块开发规范

### 目录结构

```
packages/libs/module-spec/
├── README.md           # 模块规范说明
├── types.ts           # TypeScript 类型定义
├── ordering.json      # 点餐模块规范
├── booking.json       # 预约模块规范
└── user.json          # 用户模块规范
```

### 命名规范

- 模块 ID：使用小写字母和连字符，如 `ordering-system`
- 路由路径：使用 kebab-case，如 `/ordering/menu`
- 组件名称：使用 PascalCase，如 `MenuPage`
- 配置属性：使用 camelCase，如 `timeSlotLength`

### 版本管理

使用语义化版本 (SemVer)：

- `MAJOR`: 不兼容的 API 修改
- `MINOR`: 向下兼容的功能性新增
- `PATCH`: 向下兼容的问题修正

示例：`1.2.3`

## 配置示例

### 点餐模块配置

```json
{
  "id": "ordering",
  "name": "点餐模块",
  "version": "1.0.0",
  "description": "餐厅点餐功能模块",
  "category": "business",
  "routes": [
    {
      "path": "/ordering/menu",
      "component": "MenuPage",
      "title": "菜单",
      "icon": "menu"
    }
  ],
  "config_schema": {
    "type": "object",
    "properties": {
      "time_slot_length": {
        "type": "number",
        "default": 30,
        "minimum": 15,
        "maximum": 120,
        "description": "时段长度（分钟）"
      }
    },
    "required": ["time_slot_length"]
  },
  "capabilities": [
    "menu_display",
    "cart_management",
    "order_creation"
  ],
  "dependencies": ["user", "payment"],
  "permissions": {
    "read": ["customer", "staff"],
    "write": ["customer", "staff"],
    "admin": ["admin"]
  }
}
```

## 模块加载流程

### 1. 租户配置获取

```javascript
// 小程序启动时
const config = await api.getTenantConfig(tenantId);
```

### 2. 模块规范加载

```javascript
// 根据 enabled_modules 加载模块规范
const moduleSpecs = await Promise.all(
  config.enabled_modules.map(moduleId => 
    import(`./modules/${moduleId}.json`)
  )
);
```

### 3. 路由注册

```javascript
// 注册模块路由
moduleSpecs.forEach(spec => {
  spec.routes.forEach(route => {
    app.route(route.path, route.component);
  });
});
```

### 4. 配置应用

```javascript
// 应用模块配置
moduleSpecs.forEach(spec => {
  const moduleConfig = config[spec.id];
  if (moduleConfig) {
    applyModuleConfig(spec.id, moduleConfig);
  }
});
```

## 最佳实践

### 1. 模块设计

- 保持模块职责单一
- 减少模块间耦合
- 提供清晰的 API 接口

### 2. 配置设计

- 提供合理的默认值
- 使用类型安全的配置模式
- 支持配置验证

### 3. 版本兼容

- 向后兼容的配置变更
- 清晰的版本升级指南
- 废弃功能的平滑迁移

### 4. 文档维护

- 及时更新模块规范
- 提供使用示例
- 记录变更历史
