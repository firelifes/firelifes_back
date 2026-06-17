# FIRE生活家 - 需求文档索引
> 全局版本：v1.7 | 最后更新：2026-06-18


## 文档结构

```
requirements/
├── README.md                          ← 需求文档索引（本文档）
│
├── 01-记账省心/                         ← 模块1
│   ├── README.md                       ← 模块概述
│   ├── detail/                         ← 明细页子模块
│   │   ├── detail-list.md
│   │   ├── detail-delete.md
│   │   └── savings-rate.md
│   ├── moreFunctions/                  ← 更多功能子模块
│   │   ├── fire-progress.md
│   │   └── savings-rate.md
│   ├── record/                         ← 记账功能子模块
│   │   ├── record.md
│   │   ├── account-selector.md
│   │   ├── amount-format.md
│   │   ├── category-pinned.md
│   │   ├── default-categories.md
│   │   ├── draft-auto-save.md
│   │   ├── icon-fallback-fix.md
│   │   ├── smart-memory.md
│   │   ├── smart-remark.md
│   │   └── transfer-operations.md
│   └── statistics.md                   ← 统计分析页面
│
├── 02-资产有数/                         ← 模块2
│   ├── README.md                       ← 模块概述
│   ├── analysis/                       ← 分析页子模块
│   │   └── analysis.md
│   ├── account-detail.md
│   ├── account-records.md
│   ├── asset-overview.md
│   ├── depreciating-asset.md
│   ├── fixed-asset.md
│   ├── investment-tracking.md
│   ├── net-worth.md
│   └── record-account-linkage.md
│
├── 03-FIRE可期/                         ← 模块3
│   ├── README.md                       ← 模块概述
│   ├── fire-feedback.md
│   ├── fire-goal.md
│   ├── fire-time-price.md
│   └── monthly-fire-report.md
│
└── 04-系统配置/                         ← 模块4
    ├── README.md                       ← 模块概述
    ├── login/                          ← 登录注册子模块
    │   ├── login.md
    │   ├── register.md
    │   ├── forgot-password.md
    │   ├── new-user-default-config.md
    │   └── user-config.md
    ├── account-setting/                ← 账户设置子模块
    │   ├── account-list.md
    │   ├── account-edit.md
    │   ├── credit-card-rules.md
    │   └── liability-rules.md
    ├── budget-setting/                 ← 预算设置子模块
    │   ├── budget-setting.md
    │   ├── budget-progress.md
    │   └── budget-dual-system.md
    ├── category-setting/               ← 分类设置子模块
    │   ├── category-group-list.md
    │   ├── category-group-edit.md
    │   ├── category-list.md
    │   └── category-edit.md
    ├── theme-settings/                 ← 主题设置子模块
    │   └── theme.md
    └── my.md                           ← 个人中心
```

## 模块概览

| 模块 | 功能数 | 状态 |
|------|--------|------|
| 01-记账省心 | 12 | 开发中 |
| 02-资产有数 | 8 | 开发中 |
| 03-FIRE可期 | 4 | 开发中 |
| 04-系统配置 | 10 | 部分完成 |
| **总计** | **34** | - |

## 三支柱全链路设计

```
用户每天记账 ──→ 数据积累 ──→ 资产沉淀 ──→ 净资产增长 ──→ 抵达FIRE目标
  (记账省心)      (自动)      (资产有数)      (净资产引擎)     (FIRE可期)
```

### 核心链路

| 环节 | 功能 | 状态 | 关键设计 |
|------|------|------|---------|
| 记账 → 数据 | 记账页 + 明细页 | 已完成 | 分类选择、账户选择、键盘输入 |
| 数据 → 资产 | 记账→折旧资产打通 | 已完成 | AssetFields开关、事务双写 |
| 资产 → 净资产 | 净资产计算引擎 | 已完成 | NetWorthService + GET /record/net-worth |
| 净资产 → FIRE | FIRE进度 + 反馈 | 已完成 | RecordConfirmCard + FIRE进度条 + 储蓄率卡片 |
| FIRE → 动力 | 确认卡片 + 进度条 | 已完成 | 每次记账显示净资产+FIRE距离 |

### 净资产——三支柱的桥梁

```
                    ┌──────────────┐
                    │   净资产      │
                    │  (Net Worth)  │
                    └──────┬───────┘
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ 现金账户  │    │ 折旧资产  │    │ 固定资产  │
    │ + 收入   │    │ 当前价值  │    │ 估值     │
    │ - 支出   │    │ - 折旧   │    │          │
    └──────────┘    └──────────┘    └──────────┘
          │                │                │
          └────────────────┼────────────────┘
                   ┌───────┴───────┐
                   │  - 负债账户    │
                   └───────────────┘
```

### 实现路线图

```
Phase 1  已完成 — 记账→折旧资产打通
    ├── 后端 DepreciatingAsset Entity
    ├── 后端 createRecord 事务双写
    ├── 前端 AssetFields 组件
    └── 前端 TransactionForm 重构

Phase 2  已完成 — 净资产 + 即时反馈
    ├── 后端 NetWorthService + GET /record/net-worth
    ├── 记账确认卡片 RecordConfirmCard（含净资产/FIRE距离）
    ├── 明细页储蓄率卡片 SavingsRateCard
    └── 明细页极简FIRE进度条

Phase 3 ── 资产总览
    ├── 资产总览页
    ├── 折旧资产列表页
    └── 折旧资产详情页

Phase 4 ── FIRE目标
    ├── FIRE目标设定页
    ├── 明细页FIRE进度条
    └── 月度FIRE报告
```

## 版本维护规范

### 单个文档版本
每个需求文档头部带版本号和状态：
```markdown
> 版本：v1.0 | 状态：设计中 | 最后更新：2026-05-09
```

### 版本历史表
每个文档包含版本历史表：
```markdown
## 版本历史
| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v1.0 | 2026-05-09 | 初始版本 | AI |
```

### 模块级版本
每个模块 README.md 维护模块级版本号

### Git Commit 规范
```bash
docs: [模块] [功能] [操作] v[版本]
```
- 例：`docs: 记账省心 record-continue 新增 v1.0`
- 例：`docs: 资产有数 account-system 更新 v1.1`
- 例：`docs: FIRE可期 fire-progress 完成 v1.0`

## 功能状态标记

| 标记 | 含义 | 使用场景 |
|------|------|----------|
| 设计中 | 正在设计交互和功能 | 需求初稿 |
| 已确认 | 需求已确认，可开发 | 产品确认 |
| 开发中 | 正在开发实现 | 开发阶段 |
| 已完成 | 功能开发完成 | 测试通过 |
| 已废弃 | 不再做此功能 | 放弃需求 |

## 协作流程

```
用户（Trae IDE）←→ GitHub ←→ AI（扣子）
     ↓              ↓            ↓
  写代码/改需求   版本控制      生成/更新文档
```

### 各方职责

**用户（Trae IDE）**
- 根据需求文档开发代码
- 发现需求问题及时反馈
- 提交代码时更新功能状态

**GitHub**
- 代码版本控制
- 文档版本控制
- PR 审核流程

**AI（扣子）**
- 生成需求文档
- 更新需求文档
- 提供架构建议
