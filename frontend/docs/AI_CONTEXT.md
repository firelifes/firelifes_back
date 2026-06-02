# FIRE生活家 - 项目上下文 (AI Rules)

> **自动加载**: Trae 每次对话开始时自动读取本文件。
> **跨工具通用**: Coze / Claude / GPT 等工具请引用 `firelifes_front/docs/AI_CONTEXT.md`（与本文件内容完全一致）。
>
> ** 强制自动更新**: 本文件必须反映项目最新状态。当发生以下变更时，AI 必须自动更新本文件并同步到 `.trae/rules/project_rules.md`：
> - 新增/删除/重命名页面或组件
> - 新增/删除 API 文件或接口
> - 新增/删除数据库实体
> - 新增/删除 Pinia Store
> - 技术栈或核心依赖变更
> - 核心业务逻辑变更
> - 代码规范变更
> - 路由 (pages.json) 变更
>
> **更新后必须运行**: 校验两个文件内容完全一致。

---

## 1. 项目身份

| 项 | 值 |
|---|---|
| 项目名 | FIRE生活家 (firelifes) |
| Slogan | 记账省心、资产有数、FIRE可期 |
| 类型 | 智能记账应用 (UniApp H5 + 微信小程序) |
| 目标用户 | 追求财务自由的年轻用户，尤其是程序员群体 |

### 仓库

| 仓库 | 相对路径 | 说明 |
|------|---------|------|
| firelifes_front | `firelifes_front/` | 前端 UniApp (Vue3 + TypeScript) |
| firelifes_back | `firelifes_back/` | 后端 Midway.js v4 (Koa + TypeORM + PostgreSQL) |

---

## 2. 技术栈

### 前端 (firelifes_front)

```
框架:     Vue 3 + TypeScript (Composition API)
构建:     Vite + UniApp (支持 H5 + 微信小程序)
UI 组件:  Wot Design Uni (wd-* 前缀), 自动按需导入 (vite-plugin-uni-components + WotResolver)
状态管理: Pinia (stores/)
路由:     pages.json 配置式路由
样式:     SCSS + CSS Variables (主题系统) + SVG 分类图标 (58个统一风格, styles/category-icons.css)
国际化:   vue-i18n (zh/en)
HTTP:     src/api/request.ts (统一拦截器, 默认 needAuth: true)
```

### 后端 (firelifes_back)

```
框架:     Midway.js v4 (基于 Koa)
ORM:      TypeORM v0.3 (synchronize: true 自动建表)
数据库:   PostgreSQL
认证:     JWT (7天有效期) + bcrypt (10轮加密)
配置:     dotenv + 多环境配置 (local/sit/prod/unittest)
中间件链: CORS (inline onReady) → ReportMiddleware → JwtMiddleware → 路由
```

---

## 3. 目录结构 (严格遵循)

### 前端核心路径

```
firelifes_front/
├── src/
│   ├── api/                    # API 层 (每个文件对应一组接口)
│   │   ├── request.ts          #   统一请求 (Token注入, 401拦截)
│   │   ├── auth.ts             #   认证 (登录/注册/短信)
│   │   ├── record.ts           #   记账记录
│   │   ├── account.ts          #   账户管理
│   │   ├── category.ts         #   分类管理
│   │   ├── budget.ts           #   预算管理
│   │   ├── user-config.ts      #   用户配置 (主题等偏好)
│   │   └── ads.ts              #   广告 (开屏)
│   ├── components/             # 全局公共组件
│   │   ├── BudgetBar.vue       #   预算进度条
│   │   ├── CustomTabbar.vue    #   底部导航 (明细/统计/记账/分析/我的)
│   │   └── YearMonthPicker.vue #   年月选择器
│   ├── config/
│   │   └── index.ts            #   应用配置 (apiBaseUrl, tokenKey, userKey)
│   ├── locale/                 # 国际化 (vue-i18n)
│   │   ├── index.ts            #   配置入口 (zh/en, fallback)
│   │   ├── zh.ts               #   中文语言包
│   │   └── en.ts               #   英文语言包
│   ├── pages/                  # 页面 (每个子目录一个功能模块)
│   │   ├── splash/index.vue    #   开屏广告页
│   │   ├── login/              #   登录注册
│   │   │   ├── login.vue
│   │   │   ├── register.vue
│   │   │   └── forgot-password.vue
│   │   ├── detail/             #   明细首页 (核心)
│   │   │   ├── index.vue       #     月度账单首页 + 功能入口
│   │   │   ├── bill.vue        #     账单汇总
│   │   │   ├── fire-progress.vue  #   FIRE进度
│   │   │   ├── function-list.vue  #   功能列表(可拖拽排序)
│   │   │   ├── components/     #     明细页子组件
│   │   │   │   ├── BillCard.vue
│   │   │   │   ├── DetailHeader.vue
│   │   │   │   ├── FunctionBar.vue
│   │   │   │   └── SavingsRateCard.vue
│   │   │   └── budget/         #     预算模块
│   │   │       ├── index.vue
│   │   │       ├── budget-setting.vue
│   │   │       └── components/BudgetProgress.vue
│   │   ├── record/             #   记账页面
│   │   │   ├── index.vue       #     记账主入口
│   │   │   ├── edit-record.vue #     编辑/新建记录
│   │   │   └── components/
│   │   │       ├── CategorySelector.vue
│   │   │       ├── AccountSelector.vue
│   │   │       ├── AccountSelectorPopup.vue
│   │   │       ├── AssetFields.vue
│   │   │       ├── DatePicker.vue
│   │   │       ├── RecordConfirmCard.vue
│   │   │       └── TransactionForm.vue
│   │   ├── my/                 #   我的页面
│   │   │   ├── index.vue       #     个人中心
│   │   │   ├── account-setting/
│   │   │   │   ├── account-list.vue
│   │   │   │   └── account-edit.vue
│   │   │   ├── category-setting/
│   │   │   │   ├── category-group-list.vue
│   │   │   │   ├── category-group-edit.vue
│   │   │   │   ├── category-list.vue
│   │   │   │   └── category-edit.vue
│   │   │   └── theme-setting/
│   │   │       └── theme.vue
│   │   ├── analysis/           #   分析页
│   │   │   ├── analysis.vue    #     分析首页 (收支趋势/分类统计)
│   │   │   └── account-records.vue #  账户交易明细
│   │   └── statistics/index.vue #  统计页
│   ├── stores/                 # Pinia 状态
│   │   ├── user.ts             #   用户认证 + 用户配置 (含1个state, 4个actions)
│   │   └── functionItems.ts    #   功能入口排序 (localStorage持久化)
│   ├── styles/
│   │   └── category-icons.css  #   58个SVG分类图标系统 v5.0 (Lucide风格)
│   ├── theme/                  # 主题系统 (CSS Variables)
│   │   ├── index.ts            #   主题初始化/应用/同步 (含服务端同步, 老用户迁移)
│   │   ├── presets.ts          #   3套预设主题 (teal/blue/amber, 18个CSS Token)
│   │   └── variables.css       #   CSS 变量定义
│   ├── types/                  # TypeScript 类型
│   │   ├── account.ts          #   账户类型 (5种)
│   │   └── asset.ts            #   资产类型
│   ├── utils/                  # 工具函数
│   │   ├── storage.ts          #   localStorage 封装
│   │   ├── validate.ts         #   表单验证
│   │   ├── navigate.ts         #   导航
│   │   ├── countdown.ts        #   倒计时
│   │   ├── draft.ts            #   记账草稿自动保存 (24h有效期)
│   │   ├── record-memory.ts    #   记账智能记忆 (分类→账户映射)
│   │   ├── category-frequency.ts #  分类使用频率统计 (近30天TOP8)
│   │   └── category-icon-map.ts #  分类名称→图标映射表 (49个分类)
│   ├── App.vue
│   ├── env.d.ts                # 环境类型声明 (vite + .vue)
│   ├── main.ts
│   ├── manifest.json           # UniApp 清单配置
│   ├── pages.json              # 路由配置 (所有页面声明, 21个页面)
│   └── uni.scss
├── docs/
│   ├── AI_CONTEXT.md           #   跨工具项目上下文 (本文件)
│   ├── requirements/           # 需求文档 (按模块-子模块组织)
│   │   ├── 01-记账省心/
│   │   ├── 02-资产有数/
│   │   ├── 03-FIRE可期/
│   │   └── 04-系统配置/
│   ├── designs/                # UI 设计稿 (.pen 文件)
│   └── 流程图/                 # ASCII + ASKII 格式流程图 (5个)
├── designs/                    # UI 设计稿 (.pen 文件, 文档级)
├── .env.development            # 开发环境变量
├── .env.sit                    # SIT 环境变量
├── .env.test                   # 测试环境变量
├── .env.production             # 生产环境变量
├── vite.config.ts              # Vite 构建配置 (代理 + Wot UI组件自动导入)
├── wot-ui-resolver.ts          # Wot UI 组件解析器
├── components.d.ts             # 组件类型声明 (Wot UI)
├── shims-uni.d.ts              # UniApp 类型补丁
└── .trae/
    ├── rules/
    │   └── project_rules.md    #   Trae 自动加载的项目规则
    └── specs/                  # Trae 任务规范快照
```

### 后端核心路径

```
firelifes_back/
├── src/
│   ├── config/                 # 多环境配置 (local/sit/prod/unittest)
│   │   ├── config.default.ts
│   │   ├── config.local.ts
│   │   ├── config.sit.ts
│   │   ├── config.prod.ts
│   │   └── config.unittest.ts  #   单元测试配置 (port: null)
│   ├── controller/             # 控制器层 (HTTP 路由)
│   │   ├── auth/auth.controller.ts
│   │   ├── user/user.controller.ts    # 含 /user/config 接口
│   │   ├── account/account.controller.ts
│   │   ├── category/category.controller.ts
│   │   ├── record/record.controller.ts
│   │   ├── api.controller.ts          # 通用API (GET /api/get_user)
│   │   ├── home.controller.ts         # 首页 (GET /)
│   │   ├── budget.controller.ts
│   │   └── ad.controller.ts
│   ├── service/                # 业务逻辑层
│   │   ├── auth.service.ts     #   注册/登录/微信登录 (含新用户初始化调用)
│   │   ├── user.service.ts     #   用户信息 + 用户配置CRUD + initUserConfig
│   │   ├── account.service.ts  #   账户CRUD + 3个默认账户创建
│   │   ├── category.service.ts #   分类CRUD + 新用户111条数据初始化（13个大类）
│   │   ├── record.service.ts   #   记账记录CRUD
│   │   ├── budget.service.ts   #   预算双体系
│   │   ├── net-worth.service.ts #  净资产计算引擎
│   │   ├── sms.service.ts      #   短信验证码
│   │   └── ad.service.ts
│   ├── entity/                 # 数据实体 (14个)
│   │   ├── user.entity.ts
│   │   ├── user_config.entity.ts          # 用户配置表 (key-value)
│   │   ├── user_category_customization.entity.ts
│   │   ├── user_category_group.entity.ts
│   │   ├── user_icon.entity.ts
│   │   ├── account.entity.ts
│   │   ├── record.entity.ts
│   │   ├── category.entity.ts
│   │   ├── category_group.entity.ts
│   │   ├── icon.entity.ts
│   │   ├── budget.entity.ts
│   │   ├── depreciating_asset.entity.ts
│   │   ├── sms_code.entity.ts
│   │   └── ad.entity.ts
│   ├── middleware/             # 中间件
│   │   ├── cors.middleware.ts  #   已定义但未启用 (CORS 在 onReady 中 inline 处理)
│   │   ├── report.middleware.ts #  请求日志
│   │   └── jwt.middleware.ts   #   JWT 认证 (白名单放行 /auth/*, /health, /, /api/ads/splash, /api/category/* 公开路径)
│   ├── filter/                 # 异常过滤器
│   │   ├── default.filter.ts
│   │   └── notfound.filter.ts
│   ├── configuration.ts        # 主配置 (CORS inline → ReportMiddleware → JwtMiddleware)
│   └── interface.ts
├── test/                       # 单元测试
│   ├── controller/
│   │   ├── api.test.ts
│   │   └── home.test.ts
├── init-db.ts                  # 数据库初始化脚本
├── test-db.ts                  # 测试数据库脚本
├── API.md                      # API 文档
├── ARCHITECTURE.md             # 架构文档
├── .env.example                # 环境变量模板
├── .env.local                  # 本地环境变量
├── .env.sit                    # SIT 环境变量
├── .prettierrc.js              # Prettier 配置
├── eslint.config.js            # ESLint 配置
├── jest.config.js              # Jest 配置
└── package.json
```

---

## 4. 页面路由速查 (pages.json)

| 路由路径 | 页面 | 说明 |
|---------|------|------|
| `pages/splash/index` | 开屏 | 广告开屏 |
| `pages/login/login` | 登录 | 手机号+密码/验证码登录 |
| `pages/login/register` | 注册 | 手机号+验证码注册 |
| `pages/login/forgot-password` | 忘记密码 | |
| `pages/detail/index` | 明细首页 | 核心页面，月份切换+流水列表 |
| `pages/detail/bill` | 账单汇总 | |
| `pages/detail/function-list` | 全部功能 | 功能入口列表(可拖拽) |
| `pages/detail/fire-progress` | FIRE进度 | |
| `pages/detail/budget/index` | 预算总览 | |
| `pages/detail/budget/budget-setting` | 预算设置 | |
| `pages/statistics/index` | 统计页 | |
| `pages/record/index` | 记账入口 | 支出/收入/转账/还债 |
| `pages/record/edit-record` | 编辑记录 | |
| `pages/analysis/analysis` | 分析首页 | 收支趋势/分类统计 |
| `pages/analysis/account-records` | 账户交易明细 | 按账户查看流水 |
| `pages/my/index` | 我的 | 个人中心 |
| `pages/my/category-setting/category-group-list` | 大类管理 | 分类大类列表 |
| `pages/my/category-setting/category-list` | 子分类管理 | |
| `pages/my/account-setting/account-list` | 账户列表 | |
| `pages/my/account-setting/account-edit` | 账户编辑 | |
| `pages/my/theme-setting/theme` | 主题设置 | 预设+自定义颜色 |

---

## 5. 代码规范 (严格遵循)

### 5.1 文件命名

| 类型 | 规范 | 示例 |
|------|------|------|
| Vue 页面 | kebab-case.vue | `fire-progress.vue` |
| Vue 组件 | PascalCase.vue | `BillCard.vue` |
| TS 模块 | kebab-case.ts | `user-config.ts` |
| API 文件 | kebab-case.ts, 与后端控制器对应 | `account.ts` |
| 需求文档 | kebab-case.md, 置于 `docs/requirements/{模块}/{子模块}/` | |
| 流程图 MD | 中文名 + 描述, 置于 `docs/流程图/` | `记账流程_流程图.md` |

### 5.2 代码风格

- **不要添加注释**，除非用户明确要求
- 使用 `const` / `let`，禁止 `var`
- 函数优先使用 `async/await`
- Vue 组件使用 `<script setup lang="ts">` + Composition API
- API 请求统一通过 `src/api/request.ts` 的 `request()` 函数，默认 `needAuth: true`
- API 响应格式统一: `{ success: boolean, data?: any, message?: string }`

### 5.3 路径引用

- 组件内引用使用相对路径: `../../../stores/user`
- API 文件引用: `import request from './request'`

### 5.4 样式规范

- 全部使用 CSS Variables (`var(--color-primary)`) 而非硬编码色值
- 主题变量定义在 `src/theme/variables.css` 和 `src/theme/presets.ts`
- 不要新增 `#xxxxxx` 硬编码颜色
- 不要在 `.vue` 文件中定义 `<style>` 之外的全局样式
- SVG 分类图标引用方式: 通过 `styles/category-icons.css` 的 CSS class 引用

### 5.5 需求文档规范（所有需求文档必须遵守）

每个需求文档头部必须包含：

```markdown
# 文档标题
> 文件：`filename.md` | 中文名称：xxx | 所属模块：xxx
> 版本：vX.Y | 状态：xxx | 最后更新：YYYY-MM-DD

## 版本历史

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v1.0 | YYYY-MM-DD | 初始版本 | AI |
```

**状态标记（统一使用）：**

| 标记 | 含义 | 使用场景 |
|------|------|----------|
| 设计中 | 正在设计交互和功能 | 需求初稿 |
| 需求整理 | 需求正在梳理中 | 功能尚未明确 |
| 已完成 | 功能代码和文档全部完成 | 测试通过，可上线 |
| 开发中 | 正在开发实现 | 代码编写阶段 |
| 待实现 | 需求已确认，待开发 | 排期中 |
| 规划中 | 远期规划 | 尚未排期 |
| 已废弃 | 放弃或已合并 | 该文档不再适用 |

**版本号规则：** `v主版本.次版本`，功能完成 +0.1，文档结构变更 +1.0

**规则：**
- 新增需求文档必须按此模板创建
- 功能状态变更时必须同步更新版本号和状态标记
- `## 版本历史` 表格必须记录每次版本变更

## 6. 核心业务逻辑

### 6.1 新用户注册初始化链路 (112 条数据自动创建)

```
注册 → auth.service.ts
  ├── users 表                      1条
  ├── categoryService.initUserCategories()
  │   ├── user_category_groups      13条 (10个支出大类+3个收入大类)
  │   ├── user_icons                47条 (SVG图标, styles/category-icons.css)
  │   └── user_category_customizations 47条 (39支出+8收入分类)
  ├── accountService.createDefaultAccounts()
  │   └── accounts                  3条 (现金/折旧资产/固定资产)
  └── userService.initUserConfig()
      └── user_configs              1条 (theme: teal预设)
```

### 6.1.1 全局种子数据初始化 (服务启动时)

```
configuration.ts → onReady(container)
  └── CategoryService.seedGlobalData()
      ├── icons 表                  47条 (全局图标, findOne 查重后写入)
      ├── category_groups 表        13条 (全局大类, findOne 查重后写入)
      └── categories 表             47条 (全局分类, findOne 查重后写入)
```

> **注意**: 种子逻辑必须在 `onReady` 生命周期通过 `container.getAsync(CategoryService)` 调用，不能在 `@Init()` 中执行，因为后者执行时 TypeORM Repository 代理尚未就绪。

### 6.2 账户体系 (5 种类型)

| 类型 | type 标识 | 颜色 | 说明 |
|------|----------|------|------|
| 现金类 | `cash` |  | 现金、银行卡、支付宝、微信 |
| 投资类 | `investment` |  | 股票、基金、债券 |
| 固定资产 | `fixed_asset` |  | 房产、车位 |
| 折旧资产 | `depreciable_asset` |  | 手机、电脑、家电 |
| 负债类 | `liability` |  | 信用卡、贷款 |

### 6.3 用户配置系统 (user_configs 表)

- 表结构: key-value 行 (`config_key` + `config_value` JSON)，唯一索引 `(user_id, config_key)`
- 首期配置项: `theme` = `{ mode, presetName, customColors }`
- 读写策略: 前端先写 localStorage（即时生效），异步写服务端；登录时从服务端拉取覆盖本地
- 老用户迁移: 登录时检测本地主题非默认值则自动同步到服务端 (migrateLocalTheme)
- API: `GET /user/config` + `PUT /user/config`

### 6.4 主题系统

- 3 套预设: `teal`(稳重蓝绿/默认) / `blue`(深邃蓝) / `amber`(暖琥珀)
- 18 个 CSS Token，所有页面通过 `var(--color-xxx)` 引用
- 支持自定义颜色模式 (custom)，覆盖任意 Token
- 主题切换即时生效 (localStorage) + 异步同步服务端

### 6.5 预算体系 (双体系)

- **常规月度预算** (normal): 日常消费类，支持总预算+分类预算
- **专项准备金** (reserve): 年度大额支出，按月平滑计提
- 三级预警: 80%接近 / 95%即将超支 / 100%+已超支

### 6.6 记账智能记忆与草稿

- **智能记忆** (record-memory.ts): 按分类ID记忆上次使用的账户，减少连续记账重复操作
  - 支出/收入: 按分类ID记忆
  - 转账: 分别记忆转出/转入账户
  - 还债: 分别记忆还款/债权账户
- **草稿自动保存** (draft.ts): 24小时有效期，进入编辑页时自动恢复上次未提交的表单

### 6.7 分类图标系统

- 58 个独立 SVG 图标 (Lucide 风格，MIT License)
- 定义在 `styles/category-icons.css`，通过 CSS class `.category-icon-xxx` 引用
- v5.0 重构: 统一 20×20px 有效范围，stroke-width: 2

---

## 7. API 约定

### 请求封装 (src/api/request.ts)

- 默认 `needAuth: true`，自动在请求头注入 `Authorization: Bearer <token>`
- 401 自动清除登录态（15天有效期），防止重复触发
- 仅公开接口 (登录/注册/发送短信) 使用 `needAuth: false`

### 后端响应格式

```typescript
interface IApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
}
```

### JWT 鉴权

- `JwtMiddleware` 白名单放行路径:
  - `/api/auth/*` (登录/注册/短信)
  - `/health` (健康检查)
  - `/` (首页)
  - `/api/ads/splash` (开屏广告)
  - `/api/category/*` 除 `/api/category/user`、`/api/category/group/` 之外的公开路径
- `ctx.state.user = { userId, username }` 在中间件中注入
- Token 有效期 7 天

---

## 8. 关键 Store (Pinia)

### userStore (stores/user.ts)
```typescript
// State
token: string | null
user: User | null
userConfig: Record<string, any> | null   // 用户配置(主题等)

// Key Actions
setAuth(token, user)      // 登录时调用，自动触发 fetchUserConfig()
clearAuth()               // 退出登录
fetchUserConfig()         // 从服务端拉取配置 + 老用户迁移 (migrateLocalTheme)
syncThemeToServer()       // 主题变更时同步到服务端
```

### functionItemsStore (stores/functionItems.ts)
- 功能入口排序 (bill/asset/fire/cashback)
- localStorage 持久化

---

## 9. 需求文档索引 (共 42 篇)

| 模块 | 路径 | 文档数 | 文档列表 |
|------|------|--------|----------|
| 01-记账省心 | `docs/requirements/01-记账省心/` | 12 | |
| | `detail/` | 2 | detail-delete.md, detail-list.md |
| | `record/` | 8 | record.md, account-selector.md, amount-format.md, category-pinned.md, draft-auto-save.md, icon-fallback-fix.md, smart-memory.md, smart-remark.md |
| | `moreFunctions/` | 2 | fire-progress.md, savings-rate.md |
| 02-资产有数 | `docs/requirements/02-资产有数/` | 9 | account-detail.md, account-records.md, analysis/analysis.md, asset-overview.md, depreciating-asset.md, fixed-asset.md, investment-tracking.md, net-worth.md, record-account-linkage.md |
| 03-FIRE可期 | `docs/requirements/03-FIRE可期/` | 4 | fire-feedback.md, fire-goal.md, fire-time-price.md, monthly-fire-report.md |
| 04-系统配置 | `docs/requirements/04-系统配置/` | 17 | |
| | `login/` | 5 | login.md, register.md, forgot-password.md, user-config.md, new-user-default-config.md |
| | `category-setting/` | 4 | category-group-list.md, category-group-edit.md, category-list.md, category-edit.md |
| | `account-setting/` | 3 | account-list.md, account-edit.md, liability-rules.md |
| | `budget-setting/` | 3 | budget-dual-system.md, budget-setting.md, budget-progress.md |
| | `theme-settings/` | 1 | theme.md |
| | 根目录 | 1 | my.md |

关键需求文档快速定位:
- 用户认证: `04-系统配置/login/` (login.md, register.md, forgot-password.md)
- 用户配置表: `04-系统配置/login/user-config.md`
- 新用户默认配置: `04-系统配置/login/new-user-default-config.md`
- 主题设置: `04-系统配置/theme-settings/theme.md`
- 记账核心: `01-记账省心/record/record.md`
- 记账草稿: `01-记账省心/record/draft-auto-save.md`
- 记账智能记忆: `01-记账省心/record/smart-memory.md`
- 预算双体系: `04-系统配置/budget-setting/budget-dual-system.md`
- 净资产: `02-资产有数/net-worth.md`
- 分析页: `02-资产有数/analysis/analysis.md`
- 账户交易明细: `02-资产有数/account-records.md`
- FIRE目标: `03-FIRE可期/fire-goal.md`

---

## 10. 禁止事项

1.  不要在 Vue 文件中硬编码颜色值 (`#xxxxxx`)，必须使用 `var(--color-xxx)`
2.  不要删除或修改 `pages.json` 中的路由声明
3.  不要修改 `src/api/request.ts` 的拦截逻辑
4.  不要在 `.vue` 文件外定义全局样式
5.  不要引入项目未使用的新依赖（先检查 package.json）
6.  不要修改其他智能体负责的功能模块
7.  不要创建根目录下的非必要文件（除非明确要求）
8.  API 接口不要改动已有字段的类型和名称

---

## 11. 已知踩坑经验 (2025-05-31 汇总)

> **目的**: 记录今天联调中反复踩坑的根因和最终方案，后续智能体/大模型读到这一段能快速定位同类问题。

### 11.1 登录接口 body 为空 → `"请提供完整的登录信息"`

**现象**: POST `/api/auth/login` 返回 `{"success":false,"message":"请提供完整的登录信息"}`，controller 中 `ctx.request.body` 为 `undefined` 或 `{}`。

**根因**: Midway.js v4 (`@midwayjs/koa` v4) **不会自动设置** `ctx.request.body`。`@Body()` 装饰器从 `ctx.request.body` 取值，但没有中间件负责解析请求体，所以永远是空的。

**错误尝试**:
| 尝试 | 失败原因 |
|------|---------|
| `import * as bodyParser from 'koa-bodyparser'` | 项目 `tsconfig.json` 无 `esModuleInterop`，TS 编译后 `bodyParser` 是 `{ default: fn }` namespace 而非函数，运行时报 `bodyParser is not a function` |
| `import bodyParser from 'koa-bodyparser'` | 同上，无 `esModuleInterop`，import default 同样失败 |
| 手写 `ctx.req.on('data')` / `ctx.req.on('end')` | 中间件链中流已被消费，事件永不触发 → **请求卡死** |
| `getRawBody(ctx.req)` (raw-body 库) | 流状态不可靠，且会干扰 TypeORM DI |

**最终方案**:
1. 用 `const bodyParser = require('koa-bodyparser')` — CJS require 直接拿到函数，不受 TS 模块解析影响
2. 在 `src/configuration.ts` 的 `onReady()` 中**第一个**调用 `this.app.use(bodyParser())`，确保在任何其他中间件前解析 body
3. Controller 用 `@Body() body: any` 接收参数 — 与 `register`/`send-sms` 一致

```ts
// src/configuration.ts — import 区域
const bodyParser = require('koa-bodyparser');

// onReady() 中 — 必须是第一个中间件
async onReady(container: IMidwayContainer) {
  this.app.use(bodyParser());  // ← 第一个，解析 JSON body
  // ... CORS, ReportMiddleware, JwtMiddleware ...
}
```

```ts
// src/controller/auth/auth.controller.ts
@Post('/login')
async login(@Body() body: any): Promise<IApiResponse> {
  // body 现在有值了
}
```

### 11.2 端口冲突 → `EADDRINUSE: address already in use :::7001`

**现象**: 运行 `npm run dev` 或 `npm run dev:sit` 时终端报 `Error: listen EADDRINUSE`。

**根因 (两个层面)**:
1. **首次启动**: 上次 `mwtsc --watch` 的 wrap.js 子进程未退出，持续占用 7001
2. **热重载 (watch 模式)**: 文件变更后 mwtsc 重新编译并执行 `--run @midwayjs/mock/app.js`，新的 wrap.js 在旧 wrap.js 退出前就尝试 bind 7001 → EADDRINUSE。`kill-port.js` 只在 `npm run dev` 启动前执行一次，管不了 watch 内部的每次重启。

**错误尝试**:
| 尝试 | 失败原因 |
|------|---------|
| bash `pkill -f` + `lsof` + `xargs kill` | 转义问题、macOS 兼容性、`exit 0` 中断 `&&` 链 |
| `node scripts/kill-port.js` | 只跑一次，管不了 watch 内重启 |
| `mwtsc --run scripts/run-with-kill.js` wrapper | 破坏了 mwtsc 的运行上下文，Midway DI 容器初始化失败 |

**最终方案**: 在 `src/config/config.default.ts` 的 koa 配置中添加：

```ts
koa: {
  port: 7001,
  listenOptions: {
    reuseAddr: true,  // Node.js 24 原生支持，允许端口复用
  },
},
```

`@midwayjs/koa` v4 框架代码将 `config.listenOptions` 展开到 `server.listen()` 参数中，设置 `SO_REUSEADDR`。即使旧 socket 仍在 TIME_WAIT，新进程也能立即绑定同一端口。

**辅助脚本**: `scripts/kill-port.js` 保留用于 `npm run dev` 启动前清理旧进程（pkill + 多轮 lsof 确认）。

### 11.3 沙箱 (Trae) 运行占用用户端口

**现象**: 用户终端运行后端报 `EADDRINUSE`，但 `lsof` 显示端口被沙箱终端中的 node 进程占用。

**根因**: AI Agent 在沙箱终端（`trae-sandbox`）中执行 `npm run dev` 等长时间运行命令，`node` 子进程持续占用 7001 端口。用户自己的终端无法绑定同一端口。

**解决方案**:
- AI Agent 启动后端服务后，务必在验证完成后 `pkill` 清理沙箱中的进程
- 不要用沙箱终端代替用户启动后端，只做一次性验证
- 如果用户报告端口被占用，首先检查沙箱进程: `ps aux | grep "wrap.js\|mwtsc\|midway" | grep -v grep`

### 11.4 TypeORM DataSource 初始化时序问题 (框架缺陷)

**现象**: Body 解析成功后出现 `Cannot read properties of undefined (reading 'getDataSource')`。

**根因**: `mwtsc --watch --run` 模式下，HTTP 服务器可能先于 TypeORM DataSource 完成初始化就开始接受请求，导致 `@InjectEntityModel()` 注入的 Repository 尚未就绪。这是 Midway.js v4 在 watch 模式下的已知缺陷。

**绕过方案**:
- 生产/测试环境用 `npm start` / `npm start:sit` 兜底，生命周期顺序正确
- 或者 `npx mwtsc --cleanOutDir && cp bootstrap.js dist/ && node dist/bootstrap.js`

### 11.5 核心教训总结

1. **不要改 `@midwayjs/koa` 的请求处理链路** — body 解析必须用标准 koa 中间件方式，手写 `ctx.req.on('data')` 会导致流竞争和请求卡死
2. **CJS 模块用 `require()`** — 项目没有 `esModuleInterop` 时，`import *` 和 `import default` 都可能拿不到正确的导出值
3. **端口问题从 TCP 层面解决** — `reuseAddr` 比杀进程脚本更根本、更可靠
4. **不要在沙箱终端启动用户的服务器** — 验证完就杀进程
5. **TypeORM 初始化时序** — watch 模式下可能不正常，用生产模式启动可绕过