# 贡献指南

感谢您对 MiniModules 项目的关注！我们欢迎各种形式的贡献，包括但不限于代码、文档、测试、问题反馈等。

## 贡献方式

### 1. 报告问题

- 使用 GitHub Issues 报告 Bug
- 提供详细的问题描述和复现步骤
- 包含环境信息和错误日志

### 2. 功能建议

- 在 Issues 中提出新功能建议
- 详细描述功能需求和预期效果
- 讨论实现方案和技术细节

### 3. 代码贡献

- Fork 项目到个人仓库
- 创建功能分支进行开发
- 提交 Pull Request

## 开发流程

### 1. 环境准备

```bash
# 克隆项目
git clone https://github.com/your-username/MiniModules.git
cd MiniModules

# 安装依赖
npm install

# 启动开发环境
docker-compose up -d
```

### 2. 分支策略

我们使用 Git Flow 分支模型：

- `main`: 稳定可发布分支
- `develop`: 集成分支
- `feature/*`: 功能开发分支
- `hotfix/*`: 紧急修复分支

### 3. 创建功能分支

```bash
# 从 develop 分支创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/ordering-payment-flow
```

### 4. 开发规范

#### 代码风格

- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 和 Prettier 配置
- 编写清晰的注释和文档

#### 提交规范

使用 Conventional Commits 规范：

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

类型说明：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

示例：
```
feat(ordering): add payment flow integration

- Add WeChat Pay integration
- Add order status tracking
- Update payment API endpoints

Closes #123
```

### 5. 测试要求

#### 单元测试

```bash
# 运行单元测试
npm run test

# 运行测试覆盖率
npm run test:coverage
```

#### 集成测试

```bash
# 运行集成测试
npm run test:integration
```

#### E2E 测试

```bash
# 运行端到端测试
npm run test:e2e
```

### 6. 代码审查

提交 PR 前请确保：

- [ ] 代码通过所有测试
- [ ] 代码符合项目规范
- [ ] 添加了必要的文档
- [ ] 更新了相关测试
- [ ] 提交信息清晰明确

## 模块开发规范

### 1. 模块结构

每个模块需要包含：

```
packages/api/src/modules/{module-name}/
├── routes.ts          # 路由定义
├── service.ts         # 业务逻辑
├── types.ts          # 类型定义
├── controller.ts     # 控制器
└── tests/           # 测试文件
    ├── routes.test.ts
    ├── service.test.ts
    └── controller.test.ts
```

### 2. 模块规范文件

在 `packages/libs/module-spec/` 下创建 `{module-name}.json`：

```json
{
  "id": "module-name",
  "name": "模块名称",
  "version": "1.0.0",
  "description": "模块描述",
  "category": "business",
  "routes": [...],
  "config_schema": {...},
  "capabilities": [...],
  "dependencies": [...],
  "permissions": {...}
}
```

### 3. API 设计规范

- 使用 RESTful API 设计
- 统一的响应格式
- 适当的 HTTP 状态码
- 详细的 API 文档

### 4. 数据库设计

- 使用 `tenant_id` 进行多租户隔离
- 遵循数据库命名规范
- 添加必要的索引
- 编写数据库迁移脚本

## 文档贡献

### 1. 文档类型

- API 文档
- 架构设计文档
- 用户使用指南
- 开发者文档

### 2. 文档规范

- 使用 Markdown 格式
- 保持文档结构清晰
- 提供代码示例
- 及时更新文档

## 发布流程

### 1. 版本发布

- 遵循语义化版本规范
- 更新 CHANGELOG.md
- 创建 Release Notes
- 打标签发布

### 2. 发布检查清单

- [ ] 所有测试通过
- [ ] 文档已更新
- [ ] 版本号已更新
- [ ] CHANGELOG 已更新
- [ ] 发布说明已准备

## 社区行为准则

### 1. 基本准则

- 尊重所有贡献者
- 保持友好和专业
- 接受建设性批评
- 关注社区最佳利益

### 2. 禁止行为

- 骚扰或歧视性语言
- 人身攻击
- 恶意行为
- 垃圾信息

## 联系方式

- GitHub Issues: 问题反馈和讨论
- Email: [项目维护者邮箱]
- 微信群: [微信群二维码或邀请链接]

## 许可证

本项目采用 MIT 许可证，详见 [LICENSE](LICENSE) 文件。

---

再次感谢您的贡献！让我们一起构建更好的 MiniModules 平台。
