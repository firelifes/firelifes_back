# FIRE生活家 (firelifes)

> 记账省心、资产有数、FIRE可期

---

## 项目概述

FIRE生活家是一款面向追求财务自由的年轻用户（尤其是程序员群体）的智能记账应用。

### 技术栈对比

| 维度 | 前端 (UniApp) | 后端 (Midway.js) |
|---|---|---|
| 框架 | Vue 3 + TypeScript | Midway.js v4 (Koa) |
| 构建工具 | Vite | mwtsc |
| 状态管理 | Pinia | - |
| 路由 | pages.json 配置式 | Koa 路由 |
| ORM | - | TypeORM v0.3 |
| 数据库 | - | PostgreSQL |
| 认证 | JWT Token | JWT + bcrypt |
| 国际化 | vue-i18n (zh/en) | - |

---

## 目录结构

```
work_for_fire/
├── frontend/                    # 前端 UniApp 项目
│   ├── src/
│   │   ├── api/                # API 接口封装
│   │   ├── components/         # 全局公共组件
│   │   ├── config/             # 应用配置
│   │   ├── locale/             # 国际化
│   │   ├── pages/              # 页面目录 (21个页面)
│   │   ├── stores/             # Pinia 状态管理
│   │   ├── theme/              # 主题系统
│   │   ├── types/              # TypeScript 类型
│   │   ├── utils/              # 工具函数
│   │   └── App.vue / main.ts   # 入口文件
│   └── docs/                   # 需求文档 (42篇)
├── backend/                    # 后端 Midway.js 项目
│   ├── src/
│   │   ├── controller/         # 控制器层
│   │   ├── service/            # 业务逻辑层
│   │   ├── entity/             # 数据实体 (14个)
│   │   ├── middleware/         # 中间件
│   │   ├── config/             # 多环境配置
│   │   └── filter/             # 异常过滤器
│   └── test/                   # 单元测试
└── README.md                   # 项目说明文档
```

---

## 核心功能

### 1. 记账省心
- 智能分类识别
- 记账草稿自动保存 (24小时)
- 智能记忆 (分类→账户映射)
- 分类使用频率统计

### 2. 资产有数
- 5种账户类型: 现金、投资、固定资产、折旧资产、负债
- 净资产计算引擎
- 账户交易明细

### 3. FIRE可期
- FIRE目标追踪
- 月度FIRE报告
- 储蓄率计算

### 4. 预算体系
- 常规月度预算
- 专项准备金 (年度大额支出平滑计提)
- 三级预警机制

### 5. 主题系统
- 3套预设主题 (teal/blue/amber)
- 自定义颜色模式
- CSS Variables 实现

---

## 前端核心模块

### API 接口文件 (8个)

| 文件 | 说明 |
|---|---|
| `request.ts` | 统一请求封装，自动注入Token，401拦截 |
| `auth.ts` | 登录/注册/短信验证码 |
| `record.ts` | 记账记录 CRUD |
| `account.ts` | 账户管理 |
| `category.ts` | 分类管理 |
| `budget.ts` | 预算管理 |
| `user-config.ts` | 用户配置 |
| `ads.ts` | 广告接口 |

### 页面模块 (21个页面)

| 模块 | 页面 | 说明 |
|---|---|---|
| splash | `pages/splash/index` | 开屏广告页 |
| login | `pages/login/*` | 登录/注册/忘记密码 |
| detail | `pages/detail/*` | 明细首页、账单、FIRE进度、预算 |
| record | `pages/record/*` | 记账入口、编辑记录 |
| analysis | `pages/analysis/*` | 收支分析、账户交易明细 |
| statistics | `pages/statistics/index` | 统计概览 |
| my | `pages/my/*` | 个人中心、分类设置、账户设置、主题设置 |

### 状态管理

- **userStore** (`stores/user.ts`) - 用户认证状态 + 用户配置
- **functionItemsStore** (`stores/functionItems.ts`) - 功能入口排序

---

## 后端核心模块

### 控制器层 (9个)

| 控制器 | 说明 |
|---|---|
| `auth.controller.ts` | 认证接口 (登录/注册/短信) |
| `user.controller.ts` | 用户信息 + 用户配置 |
| `account.controller.ts` | 账户管理 |
| `category.controller.ts` | 分类管理 |
| `record.controller.ts` | 记账记录 |
| `budget.controller.ts` | 预算管理 |
| `ad.controller.ts` | 广告接口 |
| `api.controller.ts` | 通用API |
| `home.controller.ts` | 首页健康检查 |

### 服务层 (9个)

| 服务 | 说明 |
|---|---|
| `auth.service.ts` | 注册/登录逻辑，新用户初始化 |
| `user.service.ts` | 用户配置 CRUD |
| `account.service.ts` | 账户 CRUD，默认账户创建 |
| `category.service.ts` | 分类 CRUD，全局种子数据初始化 |
| `record.service.ts` | 记账记录 CRUD |
| `budget.service.ts` | 预算双体系逻辑 |
| `net-worth.service.ts` | 净资产计算引擎 |
| `sms.service.ts` | 短信验证码 |
| `ad.service.ts` | 广告服务 |

### 数据实体 (14个)

| 分类 | 实体 |
|---|---|
| 用户相关 | `user`, `user_config`, `user_icon` |
| 账户相关 | `account`, `depreciating_asset` |
| 分类相关 | `category`, `category_group`, `icon` |
| 业务数据 | `record`, `budget`, `sms_code`, `ad` |
| 用户自定义 | `user_category_customization`, `user_category_group` |

---

## 数据流转

```
前端请求 ──→ request.ts (Token注入) ──→ 后端 API
                                              │
                                              ▼
                                   JwtMiddleware (认证校验)
                                              │
                                              ▼
                                   Controller (路由处理)
                                              │
                                              ▼
                                   Service (业务逻辑)
                                              │
                                              ▼
                                   TypeORM Entity (数据库操作)
```

---

## API 约定

### 请求封装
- 默认 `needAuth: true`，自动注入 JWT Token
- 401 自动清除登录态（15天有效期）
- 响应格式: `{ success: boolean, data?: any, message?: string }`

### JWT 白名单
- `/api/auth/*` (登录/注册/短信)
- `/health` (健康检查)
- `/api/ads/splash` (开屏广告)
- `/api/category/*` 公开路径

---

## 代码规范

- Vue 页面: `kebab-case.vue`
- Vue 组件: `PascalCase.vue`
- TS 模块: `kebab-case.ts`
- 使用 Composition API + `<script setup>`
- CSS 颜色使用 CSS Variables: `var(--color-xxx)`
- 不要添加注释，除非明确要求

---

## 快速开始

```bash
# 前端安装依赖
cd frontend && npm install

# 后端安装依赖
cd backend && npm install

# 启动前端开发服务器 (H5)
cd frontend && npm run dev:h5

# 启动前端开发服务器 (微信小程序)
cd frontend && npm run dev:mp-weixin

# 启动后端开发服务器
cd backend && npm run dev

# 构建命令
# 前端 H5: npm run build:h5
# 前端微信小程序: npm run build:mp-weixin
# 后端: npm run build
```

---

## 关键文档

- `backend/API.md` - API 接口文档
- `backend/ARCHITECTURE.md` - 架构设计文档
- `frontend/docs/requirements/` - 需求文档目录 (共 42 篇)

---

## 已知问题与解决方案

### 1. 登录接口 body 为空
**根因**: Midway.js v4 不会自动设置 `ctx.request.body`
**方案**: 在 `src/configuration.ts` 的 `onReady()` 中添加 `bodyParser()` 中间件

### 2. 端口冲突 EADDRINUSE
**方案**: 在 `config.default.ts` 中设置 `reuseAddr: true`

### 3. TypeORM 初始化时序问题
**方案**: 使用 `npm start` 或生产模式启动，避免 watch 模式

---

*项目版本: v1.0*
