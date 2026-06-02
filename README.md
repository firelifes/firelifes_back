# FIRE生活家 (firelifes)

> 记账省心、资产有数、FIRE可期

---

## 项目概述

FIRE生活家是一款面向追求财务自由的年轻用户（尤其是程序员群体）的智能记账应用。

### 技术栈

**前端 (firelifes_front)**
- 框架: Vue 3 + TypeScript (Composition API)
- 构建: Vite + UniApp (支持 H5 + 微信小程序)
- UI 组件: Wot Design Uni (wd-* 前缀)
- 状态管理: Pinia
- 国际化: vue-i18n (zh/en)

**后端 (firelifes_back)**
- 框架: Midway.js v4 (基于 Koa)
- ORM: TypeORM v0.3
- 数据库: PostgreSQL
- 认证: JWT + bcrypt

---

## 目录结构

```
├── frontend/              # 前端 UniApp 项目
│   ├── src/
│   │   ├── api/          # API 接口定义
│   │   ├── components/   # 全局公共组件
│   │   ├── pages/        # 页面目录
│   │   ├── stores/       # Pinia 状态管理
│   │   ├── theme/        # 主题系统
│   │   └── utils/        # 工具函数
│   └── docs/             # 需求文档
├── backend/              # 后端 Midway.js 项目
│   ├── src/
│   │   ├── controller/   # 控制器层
│   │   ├── service/      # 业务逻辑层
│   │   ├── entity/       # 数据实体
│   │   ├── middleware/   # 中间件
│   │   └── config/       # 配置文件
│   └── test/             # 单元测试
└── README.md             # 项目说明文档
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

---

## 页面路由

| 模块 | 页面 | 说明 |
|---|---|---|
| 登录注册 | login, register, forgot-password | 用户认证 |
| 明细首页 | detail/index | 核心页面，月份切换+流水列表 |
| 记账 | record/index, record/edit-record | 记账入口与编辑 |
| 分析 | analysis/analysis, analysis/account-records | 收支趋势/分类统计 |
| 统计 | statistics/index | 统计概览 |
| 我的 | my/index | 个人中心 |
| 预算 | detail/budget/* | 预算管理 |

---

## API 约定

### 请求封装
- 默认 `needAuth: true`，自动注入 JWT Token
- 401 自动清除登录态
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

# 启动前端开发服务器
cd frontend && npm run dev:h5

# 启动后端开发服务器
cd backend && npm run dev
```

---

## 仓库信息

| 仓库 | 路径 |
|---|---|
| 前端 | `frontend/` (UniApp Vue3 + TypeScript) |
| 后端 | `backend/` (Midway.js v4 + TypeORM) |

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
