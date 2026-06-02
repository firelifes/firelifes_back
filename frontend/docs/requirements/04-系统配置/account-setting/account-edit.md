# 账户编辑页

&gt; 文件：`account-edit.md` | 中文名称：账户编辑 | 所属模块：系统配置（我的页面子模块）
&gt; 页面路径：`pages/my/account-setting/account-edit.vue`

&gt; 版本：v3.0 | 状态：待实现 | 最后更新：2026-06-01

## 版本历史
| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v3.0 | 2026-06-01 | **重大升级**：账户类型扩展为6大类，新增 `credit_card`（信用卡类）；负债表单拆分为独立组件 `LiabilityForm.vue`；新增信用卡专用组件 `CreditCardForm.vue`；负债类还款方式新增 `flexible`（灵活还款）；类型卡片从 3+2 升级为 3+3 两行 | AI |
| v2.3 | 2026-05-29 | **标题栏统一**：替换 WdNavbar → 自定义 gradient 标题栏，全设置页统一样式（主题色渐变背景 + 白色文字 + 左侧返回） | AI-全栈 |
| v2.2 | 2026-05-27 | 新增「账户调整记账联动」：新增/编辑账户时自动生成调整类型记账记录，差额驱动；全面修正色彩规范对齐 variables.css 变量体系 | AI |
| v2.1 | 2026-05-21 | 代码 UI 全面升级：卡片分区布局、图标预览区、类型卡片、余额 ¥&#124;分隔线&#124;输入、开关双行说明 | AI |
| v2.0 | 2026-05-21 | 新增 Pencil 设计稿：`designs/my/account-setting/account-edit.pen` | AI-UI设计 |
| v1.3 | 2026-05-09 | 固定账户类型为5种：现金类、投资类、固定资产类、折旧资产类、负债类 | AI |

---

&gt;  **Pencil 设计稿**: `designs/my/account-setting/account-edit.pen` — 在编辑器中使用 Pencil 插件打开，可视化查看新增/编辑账户页完整布局。

&gt; **关联需求文档**：
&gt; - 负债类（贷款）规则 → [liability-rules.md](./liability-rules.md)
&gt; - 信用卡规则 → [credit-card-rules.md](./credit-card-rules.md)

## 功能概述

账户编辑页支持新增账户和编辑两种模式，提供账户信息的基本维护功能。v3.0 起账户类型扩展为 **6 大类**，新增信用卡类 `credit_card`，负债类表单和信用卡类表单拆分为独立的子组件，根据选中类型条件渲染。

---

## 账户调整记账联动（v2.2 保留）

### 业务规则

| 场景 | 调整前余额 | 调整后余额 | 差额(amount) | RecordType | 备注自动生成 |
|------|-----------|-----------|-------------|------------|------------|
| 新增账户（余额&gt;0） | 0 | +N | +N | adjustment_increase | &quot;新建账户「账户名称」&quot; |
| 新增账户（余额=0） | 0 | 0 | 0 | — | 不产生记录 |
| 新增负债/信用卡账户 | 0 | -N | -N | adjustment_decrease | &quot;新建负债账户「账户名称」&quot; |
| 编辑账户（余额增加） | oldBalance | newBalance | +Δ | adjustment_increase | &quot;调整账户「账户名称」&quot; |
| 编辑账户（余额减少） | oldBalance | newBalance | -Δ | adjustment_decrease | &quot;调整账户「账户名称」&quot; |
| 编辑账户（余额不变） | oldBalance | oldBalance | 0 | — | 不产生记录 |

### 差额计算公式
- **新增模式**：`amount = balance`（balance 的符号决定 income/expense）
- **编辑模式**：`amount = newBalance - oldBalance`（正差→income，负差→expense）

### 调整记录数据结构
调整记录使用独立的 `RecordType: 'adjustment_increase' | 'adjustment_decrease'`，与常规收支（income/expense）区分。

### 交互流程
1. 用户点击保存
2. 前端调用 `createAccount` / `updateAccount` API
3. API 返回成功后，前端判断差额 `diff = newBalance - oldBalance`
4. 若 `diff !== 0`，前端调用 `createRecord` API 生成调整记录
5. 调整记录创建成功后 toast 提示，1.5s 后 navigateBack
6. 若调整记录创建失败，toast 提示&quot;账户已保存，但调整记录生成失败&quot;，仍 navigateBack

---

## 用户故事
作为用户，我希望能灵活添加和修改账户信息，涵盖现金、投资、固定资产、折旧资产、贷款负债、信用卡等全部资产类型。

## 交互设计

### 页面结构（v3.0 升级版）

```
新增/编辑账户页
┌────────────────────────────────────┐
│  ← 新增账户 / 编辑账户              │
├────────────────────────────────────┤
│  ┌──────────────────────────────┐  │
│  │  [图标预览]  选择图标         │  │ ← 图标卡片
│  │  14个小图标网格               │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  账户类型                     │  │ ← 类型卡片（3+3 两行）
│  │  ┌──────┐┌──────┐┌──────┐   │  │
│  │  │ 现金  ││ 投资  ││ 固定  │   │  │
│  │  └──────┘└──────┘└──────┘   │  │
│  │  ┌──────┐┌──────┐┌──────┐   │  │
│  │  │ 折旧  ││ 负债  ││ 信用卡 │   │  │
│  │  └──────┘└──────┘└──────┘   │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  账户名称  [               ] │  │ ← 表单卡片
│  │  账户余额  [¥ │ 0.00      ] │  │
│  │  账户说明  [               ] │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  默认支出账户        [开关]   │  │ ← 开关卡片
│  │  默认收入账户        [开关]   │  │   cash/liability/credit_card 可见
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │ ← 条件渲染子组件
│  │  <LiabilityForm />           │  │   当 type === 'liability'
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  <CreditCardForm />          │  │   当 type === 'credit_card'
│  └──────────────────────────────┘  │
│                                     │
│  ┌────────────────────────────────┐ │
│  │          [ 保 存 ]             │ │
│  └────────────────────────────────┘ │
└────────────────────────────────────┘
```

### 页面模式

- **新增模式**：标题显示&quot;新增账户&quot;，所有字段为空，图标默认选中，类型默认现金类，保存后创建新账户
- **编辑模式**：标题显示&quot;编辑账户&quot;，通过路由参数 `id` 加载已有账户数据并填充表单，保存后更新

### 表单字段与验证

| 字段 | 必填 | 验证规则 | 说明 |
|------|------|---------|------|
| 账户图标 | ⭕ | 17个预设图标选一 | 新增模式默认，编辑模式加载已有图标 |
| 账户名称 | ✅ | 1-20字符 | 非空且不超过20字符 |
| 账户类型 | ✅ | 六选一 | 彩色圆点+SVG图标+标签卡片，3+3两行 |
| 账户余额 | ✅ | 数字，最多2位小数 | ¥前缀，负债类/信用卡类传负数 |
| 设为默认支出账户 | ⭕ | 开关 | **仅 cash / liability / credit_card 可用** |
| 设为默认收入账户 | ⭕ | 开关 | **仅 cash / liability / credit_card 可用** |
| 账户说明 | ⭕ | 0-500字符 | 多行文本输入，右下角显示字符计数 |
| **负债类专用字段** | ⭕* | 见 liability-rules.md | *组件拆分为 `LiabilityForm.vue` |
| **信用卡专用字段** | ⭕* | 见 credit-card-rules.md | *组件拆分为 `CreditCardForm.vue` |

### 账户类型（v3.0 扩展为6类）

| 序号 | 类型标识 | 中文名称 | 说明 | 主色 | 图标 |
|------|---------|---------|------|------|------|
| 1 | cash | 现金类 | 现金、银行卡、支付宝、微信等 | #00BFFF 蓝 | account-icon-wallet |
| 2 | investment | 投资类 | 股票、基金、债券等 | #FF9800 橙 | account-icon-trending |
| 3 | fixed_asset | 固定资产类 | 房产、车位、商铺等 | #9C27B0 紫 | account-icon-house |
| 4 | depreciable_asset | 折旧资产类 | 手机、电脑、家电等 | #00BCD4 青 | account-icon-mobile |
| 5 | liability | 负债类 | 房贷、车贷、消费贷、私人借款 | #FA3534 红 | account-icon-loan |
| 6 | **credit_card** | **信用卡类** | 信用卡、花呗等循环信用 | **#7C3AED 紫** | **account-icon-credit-card** |

&gt; ⚠️ **v3.0 图标变更**：原负债类图标 `account-icon-credit-card` 移给信用卡大类；负债类新设图标 `account-icon-loan`。

### TYPE_CONFIG 完整配置

```typescript
const TYPE_CONFIG: Record&lt;AccountType, TypeConfig&gt; = {
  cash:              { color: '#00BFFF', svgIcon: 'account-icon-wallet', label: '现金类', activeBg: 'rgba(0,191,255,0.06)' },
  investment:        { color: '#FF9800', svgIcon: 'account-icon-trending', label: '投资类', activeBg: 'rgba(255,152,0,0.06)' },
  fixed_asset:       { color: '#9C27B0', svgIcon: 'account-icon-house', label: '固定资产类', activeBg: 'rgba(156,39,176,0.06)' },
  depreciable_asset: { color: '#00BCD4', svgIcon: 'account-icon-mobile', label: '折旧资产类', activeBg: 'rgba(0,188,212,0.06)' },
  liability:         { color: '#FA3534', svgIcon: 'account-icon-loan', label: '负债类', activeBg: 'rgba(250,53,52,0.06)' },
  credit_card:       { color: '#7C3AED', svgIcon: 'account-icon-credit-card', label: '信用卡类', activeBg: 'rgba(124,58,237,0.06)' },
}

// 3+3 两行布局
const typeRow1 = computed(() =&gt;
  (['cash', 'investment', 'fixed_asset'] as AccountType[]).map(v =&gt; ({ value: v, ...TYPE_CONFIG[v] }))
)
const typeRow2 = computed(() =&gt;
  (['depreciable_asset', 'liability', 'credit_card'] as AccountType[]).map(v =&gt; ({ value: v, ...TYPE_CONFIG[v] }))
)
```

### 子组件：LiabilityForm.vue（负债类贷款表单）

&gt; 详细规则见 [liability-rules.md](./liability-rules.md)

```
Props:
  modelValue: {
    autoRepaymentEnabled: boolean
    originalPrincipal?: number
    annualInterestRate?: number
    repaymentMethod?: RepaymentMethod    // 含 flexible
    totalMonths?: number
    remainingMonths?: number
    repaymentDay?: number
    linkedAssetAccountId?: string
  }

Emits:
  update:modelValue    # 双向绑定负债字段
```

内部逻辑要点：
- 自动记账开关控制所有子字段显隐
- 还款方式选择 `flexible` 时隐藏总期数、剩余期数、还款日
- `flexible` 时年利率可选填 0（无息）
- 关联资产账户下拉选择器（仅 fixed_asset 类型账户）

### 子组件：CreditCardForm.vue（信用卡表单）

&gt; 详细规则见 [credit-card-rules.md](./credit-card-rules.md)

```
Props:
  modelValue: {
    billingDay: number
    dueDay: number
    creditLimit?: number
    minPaymentRate?: number
    dailyInterestRate?: number
  }

Emits:
  update:modelValue    # 双向绑定信用卡字段
```

内部逻辑要点：
- 账单日/还款日 1-28 选择器
- 免息期自动计算展示（只读）
- 校验：还款日 ≠ 账单日，间隔 ≥ 5 天
- 信用额度、最低还款比例（默认10%）、逾期日利率（默认0.05%）

---

## 交互细节

- **默认值填充**：新增模式图标默认，类型默认 cash（现金类），余额输入框为空，默认开关均关闭
- **默认开关显示规则**：只有**现金类、负债类、信用卡类**显示「设为默认支出/收入账户」开关；投资类、固定资产类、折旧资产类不显示该选项
- **类型切换自动重置**：切换到非 cash / liability / credit_card 时，自动将默认支出/收入标记重置为关闭
- **保存按钮**：使用 WdButton 组件，固定在页面底部，`disabled` 置灰不可点击，`loading` 显示加载中状态
- **保存反馈**：调用 API 成功后 toast 提示&quot;创建成功&quot;/&quot;修改成功&quot;，1.5s 后自动 navigateBack 返回列表页
- **余额输入**：使用 WdInput 组件，正则校验
  - 非负债/非信用卡类：只允许数字和最多2位小数，不允许负数
  - 负债/信用卡类：允许数字、小数和负号，自动将输入的正数转为负数
- **占位符动态切换**：负债/信用卡类显示 &quot;-0.00&quot;，其他显示 &quot;0.00&quot;
- **类型切换余额自动转换**：
  - 切换到负债/信用卡类：余额是正数 → 自动加负号
  - 从负债/信用卡类切换走：余额是负数 → 自动去负号
- **默认账户开关互斥逻辑**：
  - 仅 cash / liability / credit_card 类账户支持设为默认
  - 开启「设为默认支出账户」时，后端自动将同类型其他账户该字段设为 false
  - 开启「设为默认收入账户」时，后端自动将同类型其他账户该字段设为 false

### 记账页使用规则

- **仅 cash / liability / credit_card** 支持设为默认支出/收入账户（investment、fixed_asset、depreciable_asset 不参与记账账户自动选中）
- 新增记账记录时，根据收支类型自动选择对应类型的默认账户
- 支出场景：优先选择 `isDefaultExpense = true` 的账户
- 收入场景：优先选择 `isDefaultIncome = true` 的账户
- 若用户手动切换过账户，下次进入时优先记住用户上次选择的账户
- 若无默认账户，则选择该类型排序（order字段）最靠前的账户

---

## 数据结构（v3.0 更新）

### 账户类型定义（`src/types/account.ts`）

```typescript
// 账户类型枚举（扩展为6类）
export type AccountType = 
  | 'cash' 
  | 'investment' 
  | 'fixed_asset' 
  | 'depreciable_asset' 
  | 'liability' 
  | 'credit_card';   // 🆕 v3.0

// 还款方式类型（扩展含 flexible）
export type RepaymentMethod = 
  | 'equal_principal_interest' 
  | 'equal_principal' 
  | 'interest_first' 
  | 'flexible';       // 🆕 v3.0

// 🆕 信用卡专用字段
export interface CreditCardFields {
  billingDay: number;            // 账单日 1-28
  dueDay: number;                // 还款日 1-28
  creditLimit?: number;          // 信用额度
  minPaymentRate?: number;       // 最低还款比例 默认10
  dailyInterestRate?: number;    // 逾期日利率 默认0.05
}

// 账户数据结构（v3.0 扩展）
export interface Account {
  id: string;
  userId: string;
  name: string;
  icon: string;
  type: AccountType;
  balance: number;
  description?: string;
  isDefaultExpense: boolean;
  isDefaultIncome: boolean;
  // 负债类（贷款）专用
  originalPrincipal?: number;
  annualInterestRate?: number;
  repaymentMethod?: RepaymentMethod;
  totalMonths?: number;
  remainingMonths?: number;
  repaymentDay?: number;
  linkedAssetAccountId?: string;
  lastRepaymentDate?: string;
  // 🆕 信用卡专用
  creditCardFields?: CreditCardFields;
  order: number;
  isVisible: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// 创建/编辑账户请求参数（v3.0 扩展）
export interface AccountRequest {
  name: string;
  icon: string;
  type: AccountType;
  balance: number;
  description?: string;
  isDefaultExpense: boolean;
  isDefaultIncome: boolean;
  originalPrincipal?: number;
  annualInterestRate?: number;
  repaymentMethod?: RepaymentMethod;
  totalMonths?: number;
  remainingMonths?: number;
  repaymentDay?: number;
  linkedAssetAccountId?: string;
  creditCardFields?: CreditCardFields;
}

// 账户类型选项（v3.0 扩展）
export const ACCOUNT_TYPE_OPTIONS = [
  { value: 'cash' as AccountType, label: '现金类' },
  { value: 'investment' as AccountType, label: '投资类' },
  { value: 'fixed_asset' as AccountType, label: '固定资产类' },
  { value: 'depreciable_asset' as AccountType, label: '折旧资产类' },
  { value: 'liability' as AccountType, label: '负债类' },
  { value: 'credit_card' as AccountType, label: '信用卡类' },
]

// 获取账户类型的余额颜色
export const getBalanceColor = (type: AccountType, balance?: number): string =&gt; {
  if (balance !== undefined &amp;&amp; balance &lt; 0) return '#FA3534'
  if (type === 'liability' || type === 'credit_card') return '#FA3534'
  return '#19BE6B'
}
```

---

## 组件拆分方案

### 文件路径

```
src/pages/my/account-setting/
├── account-edit.vue                  # 主编辑页（条件渲染子组件）
├── account-list.vue                  # 列表页（新增 credit_card 分组）
└── components/
    ├── LiabilityForm.vue             # 🆕 负债贷款表单组件
    └── CreditCardForm.vue            # 🆕 信用卡表单组件
```

### 主编辑页 account-edit.vue 条件渲染逻辑

```vue
&lt;!-- 负债类贷款表单 --&gt;
&lt;LiabilityForm
  v-if=&quot;formData.type === 'liability'&quot;
  v-model=&quot;liabilityFields&quot;
/&gt;

&lt;!-- 信用卡表单 --&gt;
&lt;CreditCardForm
  v-if=&quot;formData.type === 'credit_card'&quot;
  v-model=&quot;creditCardFields&quot;
/&gt;
```

保存时将 `formData` + `liabilityFields` + `creditCardFields` 合并提交到 API。

---

## UI 设计规范

### 布局
- 页面背景：`var(--color-bg-page)`
- 页面内边距：`16rpx`
- 内容卡片：`var(--color-bg-card)` 背景，圆角 `24rpx`，内边距 `32rpx 28rpx`，卡片间距 `20rpx`
- 导航栏：自定义 gradient 标题栏（主题色渐变背景 + 白色文字 + 左侧返回）
- 表单输入区：`var(--color-border-light, #F1F5F9)` 背景
- 表单行间距：`32rpx`
- 标签文字：`26rpx` `var(--color-text-secondary, #94A3B8)` `font-weight: 500`

### 类型选择区（v3.0 3+3 布局）
- **卡片布局**：6 种类型分两行（上3 + 下3），每列 `flex: 1`，高度 `112rpx`，间距 `16rpx`
- **默认态**：`var(--color-border-light)` 背景，圆角 `16rpx`
- **选中态**：底色改为类型对应淡色（`activeBg`），标签文字变类型主色加粗
- **每卡片**：彩色圆点(8rpx) + SVG图标(44rpx) + 标签(22rpx)，垂直排列居中
- **点击反馈**：`scale(0.96)` + `transition 150ms ease`

### 余额输入区
- 外层容器：`var(--color-border-light)` 背景，圆角 `10rpx`，高 `88rpx`
- ¥ 前缀：`32rpx` `var(--color-text-primary)` `font-weight: 700`
- 分隔符：`1rpx × 36rpx` 竖线（`var(--color-border)`），左右间距 `20rpx`

### 开关区（独立卡片）
- 卡片无边距（`padding: 0`），内部行 `padding: 28rpx`
- 分割线：`1rpx` `var(--color-border-light)`，左右留 `28rpx`

### 保存按钮
- WdButton `block`，高度 `96rpx`，圆角 `12rpx`
- 固定在页面底部，`padding: 20rpx 32rpx` + 安全区

### 负债表单卡片（LiabilityForm）
- 背景：`var(--color-danger-light, #FEF2F2)`，边框 `2rpx solid rgba(239, 68, 68, 0.1)`

### 信用卡表单卡片（CreditCardForm）
- 背景：`rgba(124, 58, 237, 0.04)`，边框 `2rpx solid rgba(124, 58, 237, 0.1)`

---

## UI 组件使用

页面使用 WotUI (`@wot-ui/ui`) 组件库，通过 `@uni-helper/vite-plugin-uni-components` 自动按需导入。

| 组件 | 用途 | 关键属性 |
|------|------|---------|
| WdInput | 账户名称输入 | `v-model`, `placeholder`, `maxlength=20`, `showClear` |
| WdInput | 账户余额输入 | `:model-value` + `@update:model-value`, `type=&quot;text&quot;`, 动态占位符 |
| WdSwitch | 默认账户开关 | `v-model`, `activeColor=&quot;var(--color-primary, #0D9488)&quot;` |
| WdTextarea | 账户说明输入 | `v-model`, `placeholder`, `maxlength=500`, `showWordCount`, `autoHeight` |
| WdButton | 保存按钮 | `type=&quot;primary&quot;`, `block`, `:disabled`, `:loading` |
| WdPopup | 图标选择弹窗 | `v-model`, `position=&quot;bottom&quot;` |
| WdPopup | 关联账户选择弹窗 | `v-model`, `position=&quot;bottom&quot;` |

&gt; **注意**：图标选择器、类型选择器、负债子表单、信用卡子表单均采用自定义实现（卡片式交互），WotUI 无直接对应的复合组件。
