# 资产分析页
> 文件：`analysis.md` | 中文名称：净资产与资产负债一览分析页 | 所属模块：资产有数
> 版本：v1.3 | 状态：开发中 | 最后更新：2026-05-29

## 版本历史
| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v1.3 | 2026-05-29 | 净资产卡片改为全宽无圆角；文字大小统一使用全局 Token 体系 (--text-*) | AI |
| v1.2 | 2026-05-27 | 新增调增/调减记录类型；账户余额完全由记录链推导；monthlySummary 改为全量口径；资产汇总统一数据源 | AI |
| v1.1 | 2026-05-27 | 重构：净资产卡片固定顶部、折旧资产改为汇总展示、新增固定资产汇总、去掉原生导航栏 | AI |
| v1.0 | 2026-05-25 | 初始版本；pages/analysis/analysis.vue 已实现净资产+账户余额+折旧资产三大模块 | AI |

---

## 功能概述

资产分析页是"资产有数"模块的核心入口页，承担**一站式财务状况快照**的角色。用户进入该页面后，无需任何操作即可在 3 秒内获取关键信息：

1. **净资产** — 我最关心的数字，当前总共拥有多少净值。**卡片固定在页面顶部，不随内容滚动。**
2. **账户余额** — 现金类和负债类账户逐笔展示，每个账户独立显示余额，点击可查看交易明细
3. **资产汇总** — 折旧资产和固定资产按类型汇总展示总额和笔数，点击可进入对应账户明细

该页面是"记账省心 → 资产有数 → FIRE可期"三支柱中**资产有数**的入口枢纽。净资产数据同时为 FIRE 可期模块提供数据输入。

### 行业对标

| 产品 | 资产总览策略 | 本方案差异 |
|------|-------------|-----------|
| 鲨鱼资产管家 | 纯手动更新账户余额，手动记录余额变动 | **自动联动**：记账时自动更新账户余额，无需手动调账 |
| 随手记 | 账户列表页 + 净资产卡片 | 增加折旧资产模块，覆盖实物资产价值追踪 |
| Mint（美国） | 银行同步 + 自动净值 | 理念一致（自动化），但 Mint 依赖银行 API，本方案依赖记账行为驱动 |
| YNAB | 预算为核心，账户为辅 | YNAB 重预算分配，本方案重资产全貌 + 折旧追踪 |

**核心差异化优势**：记账即更新资产，零手动对账。净资产因支出而变动时，用户能立即看到原因（因为支出关联账户、资产），而非面对一个"不知道为什么会变"的数字。

---

## 数据一致性设计（v1.2 新增）

### 设计原则：账户余额必须由完整记录链推导

**问题**：v1.1 中 `Account.balance` 由联动计算函数 `calculateAccountBalance` 在每次增删改记录时更新，但没有调增/调减记录类型。当需要手动调整余额（如初始余额录入、对账调平）时，无对应记录可审计。

**方案**：新增 `adjustment_increase`（调增）和 `adjustment_decrease`（调减）两种记录类型，确保：

```
Account.balance = Σ(收入) - Σ(支出) + Σ(调增) - Σ(调减) + Σ(转账/还债净影响)
```

### 调增/调减记录规范

| 属性 | 说明 |
|------|------|
| 类型 | `adjustment_increase`（调增）、`adjustment_decrease`（调减） |
| 语义 | 手动调整账户余额，如初始化余额、对账校正 |
| 视觉 | 前端明细列表中以**灰色**展示，与正常收支区分 |
| 统计 | **不计入**月度收入/支出统计（与 income/expense 分开） |
| 联动 | 调增使账户余额增加、调减使账户余额减少 |
| 金额 | `|新余额 - 旧余额|`，即调整差值，不是新余额本身 |
| 备注 | `手动调整余额（旧余额 → 新余额）`，如 `手动调整余额（50.00 → 20.00）` |
| 分类 | `typeId = 0`（系统自动类型，不计入任何用户分类统计） |

### 调增/调减触发场景

| 场景 | 入口 | 触发条件 | 备注 |
|------|------|----------|------|
| **编辑账户余额** | 账户编辑页 `/pages/my/account-setting/account-edit` | 保存时检测到 `balance` 字段变化 | 后端 `account.service.ts` 的 `updateAccount()` 方法内自动创建，无需前端额外处理 |

**实现详情**：
```
POST/PUT /api/accounts/:id → account.service.ts → updateAccount()
  ├─ 查询旧余额 oldBalance = account.balance
  ├─ 保存新余额
  ├─ 计算 diff = newBalance - oldBalance
  └─ diff ≠ 0 → 创建 Record {
       type: diff > 0 ? 'adjustment_increase' : 'adjustment_decrease',
       amount: Math.abs(diff),
       typeId: 0,
       remark: '手动调整余额（oldBalance → newBalance）'
     }
```

> **注意**：后端修改后需要重启服务才能生效（`node bootstrap.js` 不是热更新）。前端 Vite 支持 HMR 热更新。如果修改后看不到效果，请确认后端已重启。

### 月度汇总全量口径（v1.2 修改）

`getRecordsByAccountId` 的 `monthlySummary` 从仅统计 `income`/`expense` 改为**全量口径**：

```typescript
monthlySummary = {
  income: Σ(income 记录),
  expense: Σ(expense 记录),
  adjustmentIncrease: Σ(adjustment_increase 记录),
  adjustmentDecrease: Σ(adjustment_decrease 记录),
}
```

这样前端明细页可以展示完整的余额变动来源：
- **本月收入** = 普通收入
- **本月支出** = 普通支出
- **本月调增**（灰色）= 手动调增
- **本月调减**（灰色）= 手动调减
- **余额** = 月初余额 + 收入 - 支出 + 调增 - 调减 = 与顶部 Account.balance 完全一致

### 资产汇总数据源统一（v1.2 修改）

`analysis.vue` 的 `assetSummary` 折旧资产行：
- ~~v1.1：优先用 `getDepreciatingAssets()` 的 `currentValue` 汇总 → 兜底 Account.balance~~（两个数据源口径不同，必然不一致）
- **v1.2：统一使用 `Account.balance`（type=depreciable_asset / type=fixed_asset）**

`getDepreciatingAssets()` API 仍保留，仅用于折旧资产详情页（v2.0 规划）。

---

## 用户故事

1. **作为普通用户**，我希望打开资产页就能看到我的净资产是多少，这样我对自己的财务全貌有一个直观认知，不需要去心算各个账户加起来是多少。**净资产卡片始终固定在顶部，滚动浏览账户时也不会消失。**

2. **作为多账户用户**（有现金、储蓄卡、信用卡、贷款等），我希望在一个列表里看到所有现金类和负债类账户的余额，这样我能快速定位"哪个账户钱不够了"或"哪张卡欠了多少"。

3. **作为关注资产总额的用户**，我希望看到折旧资产和固定资产各自汇总的总额，而不是逐笔列出每一个资产明细，这样页面更简洁、一目了然。

4. **作为关注财务健康的用户**，我希望进入页面时数据自动加载、无需手动刷新，这样体验流畅，降低使用摩擦。

5. **作为对某个账户余额变动有疑问的用户**，我希望点击账户能直接看到该账户的全部交易流水，这样我能追溯余额变化的每一笔原因。

---

## 交互设计

### 页面结构

```
资产分析页 (src/pages/analysis/analysis.vue)
┌────────────────────────────────────┐
│                                      │
│  ┌──────────────────────────────┐   │
│  │         净资产                │   │
│  │      ¥128,350.00             │   │  ← 青绿色渐变卡片，固定在顶部
│  │                              │   │     不随下方内容滚动
│  └──────────────────────────────┘   │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │  ← 以下区域可滚动
│                                      │
│  ┌─ 账户余额 ────────────────────┐   │
│  │                              │   │
│  │  现金           ¥3,210.00 >│   │  ← 点击进入账户交易明细
│  │    现金类                    │   │     仅展示现金类+负债类
│  │ ─────────────────────────── │   │
│  │  储蓄卡         ¥12,345.67>│   │
│  │    现金类                    │   │
│  │ ─────────────────────────── │   │
│  │  招商信用卡     -¥2,345.00>│   │  ← 负余额红色标识
│  │    负债类                    │   │
│  │                              │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌─ 资产汇总 ────────────────────┐   │
│  │                              │   │
│  │  折旧资产  5笔  ¥12,981.25>│   │  ← 点击进入折旧资产账户
│  │ ─────────────────────────── │   │
│  │  固定资产  2笔  ¥58,000.00>│   │  ← 点击进入固定资产账户
│  │                              │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │      [CustomTabbar]          │   │
│  └──────────────────────────────┘   │
└────────────────────────────────────┘
```

> **注意**：页面去掉了原生导航栏（`navigationStyle: "custom"`），净资产卡片直接置顶。

### 三大模块详解

#### 模块一：净资产卡片（固定在顶部）

| 属性 | 说明 |
|------|------|
| 位置 | 页面顶部，第一个视觉锚点，**固定在顶部不随内容滚动** |
| 固定方式 | `pages.json` 配置 `disableScroll: true` 禁用页面滚动 + `navigationStyle: "custom"` 隐藏原生导航栏；内容区使用 `scroll-view` 独立滚动 |
| 背景 | 青绿色渐变（`var(--color-primary)` → `var(--color-primary-dark)`），品牌色 |
| 文案 | "净资产" |
| 金额 | 大号字体 56rpx，白色，加粗 700 |
| 格式 | `¥12,345.67`，负净资产时显示 `-¥12,345.67` |
| 加载态 | 数据请求中显示"计算中..."，白色半透明小字 |

**计算逻辑**（详见 [净资产计算引擎](file:///Users/dundao/work_for_fire/firelifes_front/docs/requirements/02-资产有数/net-worth.md)）：

```
净资产 = Σ(所有可见账户余额) + Σ(激活状态折旧资产.当前价值)
```

**行业设计参考**：
- 鲨鱼资产管家：顶部大字净资产，简洁直观
- Mint：净资产 + 趋势图，偏数据可视化
- 本方案取鲨鱼的简洁路线，后续可在 v2.0 增加趋势折线图

#### 模块二：账户余额列表（现金类+负债类逐笔展示）

| 属性 | 说明 |
|------|------|
| 数据源 | `getAccountList()` API，过滤 `isDeleted=false` 且 `isVisible=true` |
| 展示范围 | **仅展示现金类（cash）和负债类（liability）账户**，每个账户独立一行 |
| 排除项 | 固定资产（`fixed_asset`）和折旧资产账户（`depreciable_asset`）不在此列表展示，走资产汇总模块 |
| 排序 | 按账户 `order` 字段排序 |
| 每行结构 | 账户图标（SVG Class） + 名称 + 类型标签 + 余额 + 箭头 `›` |
| 负余额 | 负债类账户余额为负，金额显示红色（`var(--color-danger)`） |
| 类型标签 | 映射：`cash`→现金、`liability`→负债 |
| 点击行为 | `uni.navigateTo` → `/pages/analysis/account-records?accountId=${id}` |

#### 模块三：资产汇总（折旧资产+固定资产总额）

| 属性 | 说明 |
|------|------|
| 折旧资产数据源 | 优先使用 `getDepreciatingAssets()` API 的明细汇总；兜底使用 `getAccountList()` 中 `type=depreciable_asset` 的账户余额求和 |
| 固定资产数据源 | `getAccountList()` 中 `type=fixed_asset` 的账户余额求和 |
| 每行结构 | 图标（/）+ 类型名称 + 笔数 + 总额 + 箭头 `›` |
| 总额格式 | `¥12,981.25`，青绿色（`var(--color-primary)`） |
| 笔数 | 展示该类型下的账户/资产数量，格式为"X笔" |
| 点击行为 | 若该类型仅有一个账户，跳转 `/pages/analysis/account-records?accountId=${id}` |

**设计原则**：
- 折旧资产和固定资产不逐笔列出，避免页面冗长
- 用户关注的是"我还有多少折旧资产/固定资产总值"，而非每个物品的明细
- 明细查看通过点击进入账户交易记录页完成

### 交互流程

```
用户进入资产分析页
        │
        ▼
  ┌─────────────┐
  │ 显示 Loading  │  净资产卡片显示"计算中..."
  └──────┬──────┘
         │
         ▼
  ┌─────────────────────┐
  │ 并行请求 3 个 API     │
  │ 1. getNetWorth()     │
  │ 2. getAccountList()  │
  │ 3. getDepreciatingAssets() │
  └──────┬──────────────┘
         │
    ┌────┴────┐
    │         │
  成功      失败/空数据
    │         │
    ▼         ▼
┌───────┐ ┌──────────┐
│渲染数据│ │容错处理   │  ← catch 不弹错误，静默降级
└───┬───┘ │显示空态   │
    │     └──────────┘
    ▼
┌────────────────┐
│ 用户可交互      │
│ · 点击账户 →   │ → /pages/analysis/account-records?accountId=xxx
│   交易明细页    │
│ · 滚动浏览     │
│ · 底部Tab切换  │
└────────────────┘
```

### 状态变化

| 状态 | 触发条件 | 行为 |
|------|----------|------|
| **Loading** | 页面加载中，API 未返回 | 净资产卡片显示"计算中..."；列表区域不展示 |
| **正常** | API 均成功返回 | 展示完整三模块：净资产（固定） + 账户余额列表 + 资产汇总 |
| **部分为空** | 某模块无数据（如无折旧资产） | 仅隐藏空数据模块，其他模块正常展示 |
| **全部为空** | 无现金/负债账户 + 无资产汇总 | 显示空态引导： "暂无资产数据" + "记账后资产数据会自动更新" |
| **净资产为负** | 负债大于资产 | 净资产金额显示 `-¥xxx.xx`（formatAmount 自动处理负号前缀） |
| **请求失败** | 网络异常 / 服务端错误 | `catch` 静默处理，不弹 toast，已加载的部分正常展示 |
| **页面返回刷新** | 从其他页面返回时 | `onShow` 钩子重新加载数据，确保数据与最新记账结果一致 |
| **滚动行为** | 页面级滚动 | 已被 `disableScroll: true` 禁用；仅 `scroll-view` 内容区可滚动 |

---

## UI 设计规范

### 布局
| 元素 | 规格 |
|------|------|
| 页面背景 | `var(--color-bg-page, #F5F7FA)` 浅灰蓝 |
| 底部内边距 | 80px（为 CustomTabbar 留空间） |
| 净资产卡片外边距 | 20rpx |
| 净资产卡片圆角 | 20rpx |
| 净资产卡片内边距 | 40rpx 32rpx |
| 模块卡片（账户/折旧）外边距 | 0 20rpx 20rpx |
| 模块卡片圆角 | 20rpx |
| 模块卡片内边距 | 28rpx |
| 列表行内边距 | 18rpx 0 |
| 列表行分隔线 | 1rpx solid `var(--color-border-light)`，最后一行无分隔线 |

### 颜色（青绿色体系）
| 用途 | 颜色值 |
|------|--------|
| 净资产卡片背景 | `linear-gradient(135deg, #0D9488, #0B7A70)` |
| 净资产金额 | `#FFFFFF` |
| 净资产标签 | `rgba(255,255,255,0.7)` |
| 模块标题 | `var(--color-text-primary, #1E293B)` |
| 账户名称/汇总行名称 | `var(--color-text-primary, #1E293B)` |
| 类型标签/笔数 | `var(--color-text-secondary, #94A3B8)` |
| 正余额/资产总额 | `var(--color-primary, #0D9488)` |
| 负余额（负债） | `var(--color-danger, #EF4444)` |
| 箭头 `›` | `var(--color-text-secondary, #CCCCCC)` |
| 模块卡片背景 | `var(--color-bg-card, #FFFFFF)` |

### 字体
| 元素 | 字号 | 字重 | 说明 |
|------|------|------|------|
| 净资产标签 | 24rpx | 400 | 白色半透明 |
| 净资产金额 | 56rpx | 700 | 白色，字间距 1rpx |
| Loading 文字 | 22rpx | 400 | 白色半透明 |
| 模块标题 | 28rpx | 600 | 深色 |
| 账户/资产名称 | 28rpx | 500 | 深色 |
| 类型/品类标签 | 22rpx | 400 | 灰色 |
| 余额/价值 | 28-30rpx | 600 | 深色 / 青绿 |
| 箭头 | 32rpx | 400 | 浅灰 |

### 动效
| 场景 | 动效 |
|------|------|
| 净值数据更新 | 无动画，直接替换（避免数字滚动动画增加实现复杂度） |
| 页面进入 | 无特殊动画，依赖 uni-app 默认页面切换 |

---

## 数据流

### API 依赖

| API | 方法 | 路径 | 说明 |
|-----|------|------|------|
| 净资产查询 | GET | `/record/net-worth` | 返回 netWorth、cashBalance、depreciatingAssetValue |
| 账户列表 | GET | `/account/list` | 返回全部账户，前端过滤 isDeleted + isVisible |
| 折旧资产列表 | GET | `/record/depreciating-assets` | 返回 active 状态的折旧资产（v2.0 详情页使用，v1.2 资产汇总不再使用） |
| 账户交易明细 | GET | `/record/by-account/:accountId` | 返回账户信息、全量月度汇总（含调增调减）、分页记录列表 |

### 前端数据加工

```typescript
// 1. 净资产直接使用
netWorth = nwRes.data.netWorth

// 2. 账户列表（分为两类展示）
accounts = accRes.data.filter(a => !a.isDeleted && a.isVisible)

// 2a. 现金+负债 → 逐笔展示
displayAccounts = accounts.filter(a =>
  a.type !== 'fixed_asset' && a.type !== 'depreciable_asset'
)

// 2b. 折旧资产+固定资产 → 汇总展示
 assetSummary = [
   {
     type: 'depreciable_asset',
     label: '折旧资产',
     total: Σ(账户.balance, type=depreciable_asset),
     count: 折旧资产类账户数量,
   },
   {
     type: 'fixed_asset',
     label: '固定资产',
     total: Σ(账户.balance, type=fixed_asset),
     count: 固定资产类账户数量,
   },
 ]
```

### 模块间数据流

```
                    ┌──────────────┐
                    │  记账省心     │
                    │  (record)    │
                    └──────┬───────┘
                           │ 记账行为 → 更新账户余额 / 创建折旧资产
                           ▼
                    ┌──────────────┐
                    │  资产分析页   │  ← 本页面
                    │  (analysis)  │
                    └──────┬───────┘
                           │ 净资产数据
                           ▼
                    ┌──────────────┐
                    │  FIRE可期     │
                    │  (fire)      │
                    └──────────────┘
```

---

## 需要修改/新增的文件

### 前端文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/pages/analysis/analysis.vue` |  已实现 | 资产分析页主文件（净资产固定+账户余额+资产汇总，v1.2 去除 depreciatingAssets 混合数据源） |
| `src/pages/analysis/account-records.vue` |  已实现 | 账户交易明细页（v1.2 月度汇总含调增/调减，调增调减记录灰色展示） |
| `src/pages/detail/components/BillCard.vue` |  已实现 | 账单卡片组件（v1.2 扩展 adjustment 类型支持，灰色金额样式） |
| `src/pages.json` |  已配置 | `navigationStyle: "custom"` + `disableScroll: true` |
| `src/api/record.ts` |  已实现 | `getNetWorth()`、`getDepreciatingAssets()`、`getRecordsByAccount()` |
| `src/api/account.ts` |  已实现 | `getAccountList()`、`getAccountDetail()`、`updateAccount()` |
| `src/types/account.ts` |  已实现 | `Account` 类型、`getAccountIconClass()` 图标映射 |
| `src/components/CustomTabbar.vue` |  已实现 | 底部自定义 TabBar |
| `docs/designs/analysis/analysis.pen` |  已完成 | 资产分析页 UI 设计文档 |

### 后端文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `back/src/entity/record.entity.ts` |  已修改 | type 枚举新增 adjustment_increase / adjustment_decrease |
| `back/src/interface.ts` |  已修改 | IRecord / ICreateRecordOptions / IUpdateRecordOptions 类型扩展 |
| `back/src/service/record.service.ts` |  已修改 | calculateAccountBalance / revertAccountBalance + monthlySummary 全量口径 |
| `back/src/service/account.service.ts` |  已修改 | updateAccount 余额变动时自动创建调增/调减记录 |
| `back/src/controller/record/record.controller.ts` |  无需改 | 透传 service 结果 |

### 后端接口

| 接口 | 状态 | 说明 |
|------|------|------|
| `GET /record/net-worth` |  已实现 | 净资产计算 |
| `GET /account/list` |  已实现 | 账户列表查询 |
| `GET /record/depreciating-assets` |  已实现 | 折旧资产列表查询 |
| `GET /record/by-account/:accountId` |  已实现 | 按账户查询交易明细（account-records 页使用） |

---

## 边界情况

| 场景 | 处理策略 |
|------|----------|
| 无任何账户（新用户） | 显示空态引导："暂无资产数据，记账后资产数据会自动更新" |
| 仅有负债账户 | 净资产为负值，卡片正常显示 `-¥xxx.xx` |
| 账户被标记 `isDeleted=true` | 前端过滤不展示 |
| 账户被标记 `isVisible=false` | 前端过滤不展示 |
| 仅有折旧资产/固定资产，无现金/负债账户 | 账户余额模块隐藏，资产汇总模块正常展示 |
| 折旧资产 API 返回空 | 资产汇总中折旧资产行从账户列表余额汇总 |
| 三个 API 任一失败 | `catch` 静默处理，已成功的模块正常展示，失败的模块隐藏 |
| 净资产 API 返回但账户列表为空 | 可能是新用户无账户但有折旧资产（极少见），仍正常展示 |
| 快速切换 Tab 重复请求 | `onMounted` 每次触发，可能有重复请求（当前未做防重，v2.0 考虑增加请求缓存） |
| 负债类账户余额为 0 | 显示 `¥0.00`，不标红（0 不是负数） |
| 页面返回时数据过期 | `onShow` 钩子重新加载，确保数据与最新记账一致 |

---

## 后续迭代规划（v2.0）

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 净资产趋势图 | P1 | 折线图展示最近 12 个月净资产变化，增强数据可视化 |
| 资产配置环形图 | P1 | 按账户类型（现金/投资/固定资产/折旧/负债）展示占比 |
| 下拉刷新 | P1 | 支持手动下拉刷新净资产和账户数据 |
| 折旧资产/固定资产详情页 | P1 | 点击资产汇总行进入详情页，展示逐笔明细和折旧进度条 |
| 请求缓存 | P2 | 短时间内重复进入页面不重复请求 |
| 固定资产模块 | P2 | 增加固定资产独立展示区域（房产、车位等） |
| 投资账户实时市值 | P3 | 对接行情 API，展示投资账户实时市值 |