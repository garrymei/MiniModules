# Module Specification

模块规范定义，每个业务模块都需要在此目录下定义 `module.json` 配置文件。

## 模块规范结构

每个模块的 `module.json` 包含：

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
      "title": "菜单"
    },
    {
      "path": "/ordering/cart",
      "component": "CartPage", 
      "title": "购物车"
    }
  ],
  "config_schema": {
    "type": "object",
    "properties": {
      "time_slot_length": {
        "type": "number",
        "default": 30,
        "description": "时段长度（分钟）"
      },
      "max_items_per_order": {
        "type": "number",
        "default": 50,
        "description": "单次最大点餐数量"
      }
    }
  },
  "capabilities": [
    "order_management",
    "menu_display",
    "cart_management"
  ],
  "dependencies": ["user", "payment"],
  "permissions": {
    "read": ["customer", "staff"],
    "write": ["customer", "staff", "admin"]
  }
}
```

## 字段说明

- `id`: 模块唯一标识符
- `name`: 模块显示名称
- `version`: 模块版本
- `description`: 模块描述
- `category`: 模块分类 (business/core/ui)
- `routes`: 前端路由配置
- `config_schema`: 模块配置的JSON Schema
- `capabilities`: 模块提供的功能列表
- `dependencies`: 依赖的其他模块
- `permissions`: 权限配置

## 模块分类

### Core Modules (核心模块)
- `user`: 用户管理
- `auth`: 认证授权
- `tenant`: 租户管理

### Business Modules (业务模块)
- `ordering`: 点餐
- `booking`: 预约
- `ecommerce`: 电商
- `ticketing`: 票务
- `cms`: 内容管理

### UI Modules (界面模块)
- `theme`: 主题配置
- `layout`: 布局组件
- `navigation`: 导航组件
