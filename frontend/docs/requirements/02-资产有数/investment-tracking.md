# 投资账户追踪
&gt; 文件：investment-tracking.md | 中文名称：股票/基金投资账户市值追踪功能 | 所属模块：资产有数
&gt; 版本：v2.0 | 状态：设计中 | 最后更新：2026-05-12

## 版本历史
| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v2.0 | 2026-05-12 | 统一使用WotUI组件库，左滑交互模式 | AI |
| v1.0 | 2026-05-09 | 初始版本 | AI |

---

> 最后更新：2026-05-09

---

## 功能概述
投资账户追踪功能支持用户记录股票、基金等投资资产的持仓成本和当前市值，自动计算浮动盈亏和收益率。投资账户在资产总览中作为独立大类展示，汇总显示总投资市值和盈亏情况。

**注意**：此功能为 Phase 3 功能，数据结构在 Phase 1 已预留。UI 和交互逻辑在此文档中定义，实现可分阶段进行。

## 用户故事
作为用户，我希望在 APP 中记录我的投资持仓，看到总投资市值和盈亏情况，这样我可以全面了解自己的资产状况，而不需要去其他 APP 查看。

## 交互设计

### 页面结构

```
资产总览页 - 投资大类（已更新）
┌────────────────────────────────────┐
│  资产类                              │
│  ...                                │
│  ───────────────────────────────── │
│   投资               ¥125,000  > │
│     成本 ¥100,000  盈利 +25.00%  │
└────────────────────────────────────┘

投资账户详情 (src/pages/investment/detail.vue)
┌────────────────────────────────────┐
│  ← 我的投资                    [+] │
├────────────────────────────────────┤
│                                      │
│  总投资市值                          │
│  ¥125,000.00                        │
│                                      │
│  总成本 ¥100,000  总盈亏 +¥25,000   │
│  总收益率 +25.00%                   │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ 基金账户                        │ │
│  │ 持有收益  +¥15,000            │ │
│  │ 持有收益率 +30.00%            │ │
│  │ [更新市值]                     │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ 股票账户                        │ │
│  │ 持有收益  +¥10,000            │ │
│  │ 持有收益率 +20.00%            │ │
│  │ [更新市值]                     │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │       [+ 添加投资账户]          │ │
│  └────────────────────────────────┘ │
│                                      │
└────────────────────────────────────┘

投资账户编辑 (src/pages/investment/edit.vue)
┌────────────────────────────────────┐
│  ← 新建投资账户              [保存] │
├────────────────────────────────────┤
│                                      │
│  投资类型                            │
│  ┌────────┐ ┌────────┐ ┌────────┐  │
│  │ 基金   │ │ 股票   │ │ 债券   │  │
│  └────────┘ └────────┘ └────────┘  │
│                                      │
│  账户名称                            │
│  ┌────────────────────────────────┐ │
│  │ 输入名称...                     │ │
│  └────────────────────────────────┘ │
│                                      │
│  持仓成本                            │
│  ┌────────────────────────────────┐ │
│  │ ¥ 0.00                         │ │
│  └────────────────────────────────┘ │
│                                      │
│  当前市值                            │
│  ┌────────────────────────────────┐ │
│  │ ¥ 0.00                         │ │
│  └────────────────────────────────┘ │
│                                      │
│  预计年分红收益率（可选）              │
│  ┌────────────────────────────────┐ │
│  │ %                              │ │
│  └────────────────────────────────┘ │
│                                      │
│  备注（可选）                         │
│  ┌────────────────────────────────┐ │
│  │ 输入备注...                    │ │
│  └────────────────────────────────┘ │
│                                      │
└────────────────────────────────────┘

更新市值弹窗
┌────────────────────────────────────┐
│           更新市值                   │
├────────────────────────────────────┤
│                                      │
│  基金账户                           │
│  当前市值：¥65,000                 │
│                                      │
│  新市值                             │
│  ┌────────────────────────────────┐ │
│  │ ¥ 68,000                       │ │
│  └────────────────────────────────┘ │
│                                      │
│  更新后：                            │
│  盈亏 +¥18,000 (36.00%)            │
│                                      │
│  ┌────────────────────────────────┐ │
│  │          确认更新              │ │
│  └────────────────────────────────┘ │
│                                      │
└────────────────────────────────────┘
```

### 交互流程

1. **查看投资总览**
   - 资产总览页显示投资大类
   - 汇总显示市值、成本、盈亏

2. **投资账户列表**
   - 显示所有投资账户
   - 显示每个账户的盈亏

3. **添加投资账户**
   - 选择投资类型
   - 输入账户名称
   - 输入持仓成本（初始成本）
   - 输入当前市值（可选）

4. **更新市值**
   - 点击"更新市值"
   - 输入新市值
   - 显示盈亏变化
   - 确认更新

5. **查看账户详情**
   - 显示持仓历史
   - 显示盈亏曲线（可选）

### 计算公式
```
盈亏金额 = 当前市值 - 持仓成本
收益率 = 盈亏金额 / 持仓成本 × 100%
      = (当前市值 - 持仓成本) / 持仓成本 × 100%
```

### 状态变化

| 状态 | 触发条件 | 行为 |
|------|----------|------|
| Loading | 加载中 | 显示骨架屏 |
| 盈利 | 市值 > 成本 | 显示绿色 +XX% |
| 亏损 | 市值 < 成本 | 显示红色 -XX% |
| 持平 | 市值 = 成本 | 显示灰色 0% |
| 空态 | 无投资账户 | 显示引导"添加投资账户" |

## UI 设计规范

### 布局
- 页面内边距：32rpx
- 汇总区：高度 200rpx
- 账户卡片：高度 160rpx
- 间距：24rpx

### 颜色（卡布里蓝体系 + 语义色）
- 页面背景：#FFFFFF
- 总市值：#00BFFF
- 盈亏盈利：#19BE6B
- 盈亏亏损：#FA3534
- 盈亏持平：#999999
- 成本：#666666

### 字体
- 总市值：56rpx，#00BFFF
- 盈亏金额：36rpx，#19BE6B / #FA3534
- 盈亏百分比：32rpx
- 账户名称：32rpx，#333333
- 成本：28rpx，#666666

### 动效
- 盈亏变化：数字颜色渐变动画
- 卡片点击：scale 0.98，时长 100ms

## 数据结构

### 投资账户数据结构（更新）
```typescript
interface InvestmentAccount {
  id: string;
  userId: string;
  name: string;                    // 账户名称
  icon: string;                    // 'fund' | 'stock' | 'bond' | 'other'
  type: 'asset';                   // 固定为 asset
  investmentType: 'fund' | 'stock' | 'bond' | 'other';
  initialBalance: number;         // 初始成本（买入时的总金额）
  currentBalance: number;          // 当前市值
  currency: string;                // 币种
  order: number;                   // 排序
  isVisible: boolean;              // 是否显示在总览
  
  // 投资相关字段
  costBasis: number;              // 持仓成本（累计投入）
  currentValue: number;           // 当前市值
  dividendYield?: number;          // 年分红收益率（可选）
  
  // 计算属性（服务端计算）
  unrealizedGain: number;          // 浮动盈亏 = currentValue - costBasis
  unrealizedGainRate: number;     // 收益率 = unrealizedGain / costBasis
  
  // 持仓历史
  holdings: InvestmentHolding[];
  
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface InvestmentHolding {
  id: string;
  accountId: string;
  name: string;                    // 持仓名称（如基金名称）
  shares: number;                  // 持有份额
  avgCost: number;                 // 平均成本
  currentPrice: number;           // 当前单价
  currentValue: number;           // 当前价值
  unrealizedGain: number;          // 浮动盈亏
  createdAt: string;
  updatedAt: string;
}

// 更新市值
interface UpdateMarketValueRequest {
  currentValue: number;            // 新市值
  // 不需要传 costBasis，因为成本不变
}

// 市值历史（用于画图）
interface MarketValueHistory {
  date: string;                    // 'YYYY-MM-DD'
  value: number;
}
```

### API 接口
```typescript
// GET /api/accounts/investment - 获取投资账户汇总
interface GetInvestmentSummaryResponse {
  code: number;
  data: {
    totalValue: number;             // 总市值
    totalCost: number;             // 总成本
    totalGain: number;             // 总盈亏
    gainRate: number;              // 总收益率
    accounts: InvestmentAccount[];
  };
}

// POST /api/accounts/investment - 添加投资账户
interface CreateInvestmentAccountRequest {
  name: string;
  investmentType: 'fund' | 'stock' | 'bond' | 'other';
  costBasis: number;              // 持仓成本
  currentValue?: number;          // 当前市值（可选）
  dividendYield?: number;
}

// PUT /api/accounts/:id/market-value - 更新市值
interface UpdateMarketValueRequest {
  currentValue: number;
}

// GET /api/accounts/:id/history - 获取市值历史
interface GetMarketValueHistoryResponse {
  code: number;
  data: {
    history: MarketValueHistory[];
  };
}
```

## 与现有功能的关联

### 依赖关系
- **依赖**：F1 account-system（基础账户结构）
- **被依赖**：无

### 需要修改的文件
- `src/pages/account/edit.vue` - 账户编辑页（支持投资类型）
- `src/pages/assets/index.vue` - 资产总览页（投资大类汇总）
- `src/types/account.ts` - 更新类型定义

### 新增文件
- `src/pages/investment/index.vue` - 投资账户列表页
- `src/pages/investment/detail.vue` - 投资账户详情页
- `src/pages/investment/edit.vue` - 投资账户编辑页
- `src/components/InvestmentSummary.vue` - 投资汇总组件
- `src/components/HoldingItem.vue` - 持仓项组件
- `src/components/MarketValueChart.vue` - 市值走势图

## 边界情况

1. **首次添加**
   - 显示空状态引导
   - 提示"添加你的第一个投资账户"

2. **市值为0**
   - 新添加账户，市值可能为0
   - 显示"待录入市值"

3. **成本为0**
   - 收益率无法计算
   - 显示"--"

4. **分红再投入**
   - 分红后成本不变，市值增加
   - 收益率变化

5. **汇率变动**
   - 外币投资需要考虑汇率
   - 默认统一转换为人民币

6. **删除投资账户**
   - 确认删除
   - 记录盈亏快照

7. **不支持实时行情**
   - 用户手动更新市值
   - 显示"上次更新: X天前"

8. **股票/基金搜索（可选）**
   - 可选接入行情 API
   - 自动更新市值

9. **禁止横向滚动**
   - 页面根容器设置 `overflow-x: hidden`
   - 避免与 WdSwipeCell 的横向滑动冲突

---

## UI 组件使用

页面使用 WotUI (`@wot-ui/ui`) 组件库，通过 `@uni-helper/vite-plugin-uni-components` 自动按需导入。

| 组件 | 用途 | 关键属性 |
|------|------|---------|
| WdNavbar | 顶部导航栏 | `title`，`leftArrow`，`fixed`，`placeholder`，`bordered`，`safeAreaInsetTop`，`rightText`，`@click-right` |
| WdSwipeCell | 左滑单元格 | `:right-width="140"`，`#default`，`#right` |
| WdButton | 操作按钮 | `size="small"`，`type="primary"`（更新市值），`type="danger"`（删除） |
| WdDialog | 弹窗 | `v-model`，`title`，`show-cancel-button`，`show-confirm-button` |
| WdInput | 输入框 | `v-model`，`placeholder`，`maxlength`，`show-clear`，`type="number"` |
| WdPicker | 日期选择器 | `v-model`，`type="date"`，`format="YYYY-MM-DD"` |
| WdRadioGroup | 单选框 | `v-model`，`options` |

---

## 实现要点

### WdSwipeCell 使用示例

```vue
&lt;wd-swipe-cell :right-width="140"&gt;
  &lt;template #default&gt;
    &lt;view class="investment-account-card" @click="goToDetail(account.id)"&gt;
      &lt;view class="card-left"&gt;
        &lt;text class="account-icon"&gt;{{ getInvestmentTypeIcon(account.investmentType) }}&lt;/text&gt;
        &lt;view class="account-info"&gt;
          &lt;text class="account-name"&gt;{{ account.name }}&lt;/text&gt;
          &lt;view class="account-meta"&gt;
            &lt;text class="investment-type"&gt;{{ getInvestmentTypeLabel(account.investmentType) }}&lt;/text&gt;
            &lt;text class="updated-at"&gt;上次更新: {{ formatDate(account.updatedAt) }}&lt;/text&gt;
          &lt;/view&gt;
          &lt;view class="account-value"&gt;
            &lt;text class="current-value"&gt;¥{{ formatAmount(account.currentValue) }}&lt;/text&gt;
            &lt;view class="gain-info" :class="getGainClass(account.unrealizedGain)"&gt;
              &lt;text class="gain-amount"&gt;{{ account.unrealizedGain &gt;= 0 ? '+' : '' }}¥{{ formatAmount(account.unrealizedGain) }}&lt;/text&gt;
              &lt;text class="gain-rate"&gt;{{ account.unrealizedGainRate &gt;= 0 ? '+' : '' }}{{ account.unrealizedGainRate }}%&lt;/text&gt;
            &lt;/view&gt;
          &lt;/view&gt;
        &lt;/view&gt;
      &lt;/view&gt;
    &lt;/view&gt;
  &lt;/template&gt;
  &lt;template #right&gt;
    &lt;wd-button size="small" type="primary" @click.stop="handleUpdateMarketValue(account.id)"&gt;更新&lt;/wd-button&gt;
    &lt;wd-button size="small" type="danger" @click.stop="handleDelete(account.id)"&gt;删除&lt;/wd-button&gt;
  &lt;/template&gt;
&lt;/wd-swipe-cell&gt;
```

### 禁止横向滚动

```vue
&lt;style scoped&gt;
.page-container {
  overflow-x: hidden; /* 关键：禁止页面横向滚动 */
  min-height: 100vh;
  background-color: #f5f5f5;
}
&lt;/style&gt;
```
