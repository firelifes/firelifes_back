# 明细页 — 账单明细首页
> 文件：`detail-month-switch.md` | 中文名称：明细页（账单明细首页） | 所属模块：记账省心
> 页面路径：`src/pages/detail/index.vue`

> 版本：v1.5 | 状态：已完成 | 最后更新：2026-06-01

## 版本历史
| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v1.6 | 2026-06-02 | 明细页支持显示转账/还贷/借贷记录，以中性灰样式展示，不计入收支汇总 | AI-全栈 |
| v1.5 | 2026-06-01 | 空月份自动跳转最近有数据的月份 + 月份切换跳过空月份(新增 getNearestMonth API) | AI-全栈 |
| v1.4 | 2026-05-29 | 记录行点击分离：图标点击弹出分类选择器快速修改分类，其余区域跳转编辑页；新增 CategorySelectPopup 组件 | AI-全栈 |
| v1.3 | 2026-05-21 | 新增 Pencil 设计稿：`designs/detail-index.pen`，可视化页面布局与组件层级 | AI-UI设计 |
| v1.2 | 2026-05-21 | 修复 CATEGORY_ICON_MAP：补全 26 个数据库已有分类的 iconfont 映射，修复 statistics 页 20 个错误图标类名 | AI |
| v1.1 | 2026-05-21 | 补充完整页面结构：DetailHeader、FunctionBar、BillCard、CustomTabbar、分类图标映射、空状态、加载态、切换动画 | AI |
| v1.0 | 2026-05-14 | 初始版本：月份切换、年月选择器、共用组件 | AI |

---

>  **Pencil 设计稿**: `designs/detail-index.pen` — 在编辑器中使用 Pencil 插件打开，可以可视化查看节点层级、精确尺寸和颜色。

---

## 功能概述

明细页是用户打开应用后的默认首页，核心功能：
1. **头部区域**：展示应用标题 + 当前年月 + 月度收入/支出汇总 + 年月选择器入口
2. **功能入口栏**：拖拽排序后的前4个功能快捷入口 + 「更多」按钮

3. **记账列表**：按日期分组展示当月所有记账记录
4. **月份切换**：支持上拉查看上一月、下拉查看下一月、年月选择器跳转

## 用户故事
- 作为用户，我希望看到当月的所有记账记录，按日期分组，一目了然
- 作为用户，我希望能方便地切换不同月份查看历史记录
- 作为用户，我希望能看到每个日期的收支小计和整个月的收支汇总
- 作为用户，我希望转账/还款/借贷记录也能在明细页展示，但不纳入收支统计，与账户金额调整一样以中性灰样式显示

---

## 一、页面整体布局

```
┌──────────────────────────────────────┐
│           F.I.R.E生活家               │ ← DetailHeader
│  2026年   ┃   收入        支出        │   渐变蓝底
│  05月 ▼  ┃  ¥128.50    ¥-35.00      │   点击年月弹出选择器
├──────────────────────────────────────┤
│  账单  资产  FIRE  返现  更多│ ← FunctionBar
├──────────────────────────────────────┤   白色背景，图标+文字
│  ┌────────────────────────────────┐  │
│  │ 05月14日 星期四                │  │ ← BillCard (顶部日期栏)
│  │ 收入 ¥128.50  支出 ¥35.00     │  │   日期 + 周日 + 日合计
│  ├────────────────────────────────┤  │
│  │ [] 餐饮             -¥35.00 │  │ ← 记录行
│  ├────────────────────────────────┤  │   圆形图标 + 名称 + 金额
│  │ [] 工资            +¥128.50 │  │   支出红色 / 收入绿色
│  └────────────────────────────────┘  │
│                                       │
│  ┌────────────────────────────────┐  │
│  │ 05月13日 星期三                │  │
│  │ 收入 ¥0.00  支出 ¥120.00      │  │
│  ├────────────────────────────────┤  │
│  │ [] 交通             -¥5.00  │  │
│  │ [] 购物            -¥115.00 │  │
│  └────────────────────────────────┘  │
│                                       │
│         上拉查看上一个月                │ ← 底部提示
│                                       │
├──────────────────────────────────────┤
│    明细    记账    我的          │ ← CustomTabbar
└──────────────────────────────────────┘
```

---

## 二、组件拆解

>  完整可视化设计稿请打开 `designs/detail-index.pen`（Pencil 插件）

### 2.1 DetailHeader（头部区域）

| 属性 | 值 |
|------|-----|
| 文件 | `src/pages/detail/components/DetailHeader.vue` |
| 背景 | `linear-gradient(135deg, #00BFFF 0%, #0099CC 100%)` |
| 布局 | 顶部居中「F.I.R.E生活家」标题 + 下方三列（年月 / 收入 / 支出） |

**三列布局：**

| 列 | 内容 | 交互 |
|-----|------|------|
| 年月列 | `2026年` + `05月 ▼` | 点击触发 `open-date-picker` 事件 |
| 收入列 | `收入` + 金额（白色加粗 36rpx） | 纯展示 |
| 支出列 | `支出` + 金额（白色加粗 36rpx） | 纯展示 |

**Props:**
```typescript
{
  currentYear: string      // "2026"
  currentMonth: string     // "05"
  monthIncome: number      // 收入总额（正数）
  monthExpense: number     // 支出总额（正数，展示时取绝对值）
}
```

**Emits:** `open-date-picker`

### 2.2 FunctionBar（功能入口栏）

| 属性 | 值 |
|------|-----|
| 文件 | `src/pages/detail/components/FunctionBar.vue` |
| 背景 | `#FFFFFF`，底部阴影 `0 4rpx 16rpx rgba(0,0,0,0.06)` |
| 布局 | 水平均分，每个入口为图标（40rpx）+ 文字（20rpx） |

**Props:**
```typescript
{
  items: FunctionItem[]    // 功能列表
  maxVisible?: number      // 最多显示几个（默认5，实际显示前4个+更多）
}
```

**Emits:** `item-click`, `more-click`

**默认功能入口（定义在 `src/stores/functionItems.ts`）：**
| key | emoji | 文字 | 点击行为 |
|-----|-------|------|---------|
| bill |  | 账单 | 跳转 `/pages/detail/bill` |
| asset |  | 资产管家 | 未实现（toast 提示） |
| fire |  | FIRE进度 | 跳转 `/pages/detail/fire-progress` |
| cashback |  | 购物返现 | 未实现（toast 提示） |

> **排序**：用户可在「功能页」(`/pages/detail/function-list`) 拖拽排序，前4个展示在明细页。

### 2.3 BillCard（日期卡片）

| 属性 | 值 |
|------|-----|
| 文件 | `src/pages/detail/components/BillCard.vue` |
| 背景 | `#FFFFFF`，圆角 `20rpx`，阴影 `0 2rpx 12rpx rgba(0,0,0,0.04)` |

**卡片结构：**

| 区域 | 内容 | 样式 |
|------|------|------|
| 日期栏（顶部） | `05月14日 星期四` + 日收入/日支出小计 | 28rpx 加粗，底部 1rpx 分割线 |
| 记录行（N行） | 圆形图标 + 名称 + 金额 | 28rpx 名称，32rpx 金额 |

**记录行金额前缀规则：**

| 类型 | 前缀 | 示例 |
|------|------|------|
| `expense` | `-` | `-¥35.00` |
| `income` | `+` | `+¥128.50` |
| `transfer` | `-` | `-¥500.00` |
| `repayment` | `-` | `-¥2000.00` |

**记录行点击行为（v1.4 新增）：**

记录行分为两个点击区域：

| 区域 | 交互 | 行为 |
|------|------|------|
| 🎯 **分类图标**（圆形区域） | `@tap.stop` | 弹出 CategorySelectPopup → 选择新分类 → 立即调用 `PUT /api/record/:id` 仅更新 `typeId` → 刷新列表 → Toast「分类已修改」 |
| 📝 **其他区域**（图标外整行） | `@tap` | 跳转编辑页 `/pages/record/edit-record?id={id}`（原有行为不变） |

> 注意：图标点击使用 `@tap.stop` 阻止事件冒泡，确保不会触发整行点击事件。

**分类图标方案**：
- 使用 SVG 分类图标系统（`src/styles/category-icons.css`）
- `CATEGORY_ICON_MAP` 映射分类名称 → SVG class 类名
- 圆形背景色：`rgba(0, 191, 255, 0.08)`（卡布里蓝浅色）
- 图标尺寸：`44rpx`，圆形图标容器：`72rpx × 72rpx`

### 2.4 CustomTabbar（底部导航栏）

| 属性 | 值 |
|------|-----|
| 文件 | `src/components/CustomTabbar.vue` |
| 布局 | 固定在页面底部，5 个 tab：明细 / 统计 / 记账 / 资产 / 我的 |
| 高度 | 48px |
| 背景 | `#FFFFFF`，顶部 `<hr>` 分割线 |

### 2.5 CategorySelectPopup（分类选择弹出组件 v1.4 新增）

| 属性 | 值 |
|------|-----|
| 文件 | `src/pages/detail/components/CategorySelectPopup.vue` |
| 容器 | `WdPopup`（底部弹出，圆角 32rpx，背景白色） |
| 内容 | 按分组展示分类网格，每行 4 个，圆形图标 + 分类名 |

**Props:**
```typescript
{
  categories: CategoryGroup[]    // 分组数据（含 children → id + name + icon）
  selectedTypeId: number         // 当前选中分类 ID
  transactionType: 'income' | 'expense'  // 当前记录类型
}
```

**Emits:**
```typescript
{
  'select': (typeId: number) => void   // 选择新分类后触发
}
```

**Expose:**
```typescript
{
  open: () => void   // 打开弹窗
}
```

**交互流程：**
1. 用户点击 BillCard 记录行图标 → `@tap.stop` 阻止冒泡 → emit `category-tap`
2. DetailHeader 接收事件 → 记录当前 `recordId` + `recordType` → 调用 `categorySelectPopupRef.open()`
3. 用户点击分类网格中的某个分类 → emit `select` → 关闭弹窗
4. 立即调用 `PUT /api/record/:id { typeId: newTypeId }`
5. 成功 → 刷新列表 + Toast「分类已修改」
6. 失败 → Toast「修改失败，请重试」

---

## 三、数据流

### 3.1 页面初始化
```
onMounted → 判断当前月份是否需要自动跳转
├── GET /api/record/nearest-month?yearMonth=YYYY-MM&direction=prev
│   ├── 返回非空且不等于当前月 → 直接设置目标月份（无闪动）
│   └── 返回空或等于当前月 → 保持当前月份
├── loadCategoriesOnce()          // 首次加载：获取支出/收入分类 + 用户自定义图标
│   ├── GET /api/category/user (expense)
│   ├── GET /api/category/user (income)
│   └── GET /api/category/user-icons
├── loadMonthSummary()            // 获取月度收支汇总
│   └── GET /api/record/month-summary?yearMonth=YYYY-MM
└── loadFirstPageDates()          // 获取当月所有记录，按日期分组
    └── GET /api/record/page?yearMonth=YYYY-MM&page=1&pageSize=500
```

### 3.2 页面显示时（onShow 从其他页返回）
```
onShow →
├── loadMonthSummary()     // 刷新月度汇总
└── loadFirstPageDates()   // 刷新记录列表
```

### 3.3 数据结构

```typescript
// 页面内数据类型
interface RecordItem {
  id: number
  typeId: number           // 分类ID
  type: 'income' | 'expense' | 'transfer' | 'repayment'
  amount: number
  remark?: string
  date: string             // "2026-05-14"
}

// 日期分组数据（key = date string）
const pageData = reactive<Map<string, DatePageData>>(new Map())

interface DatePageData {
  list: RecordItem[]
  total: number
  page: number
  pageSize: number
}

// BillCard 所需的记录格式
interface BillCardRecord {
  id: number
  typeId: number           // 分类ID (v1.4 新增，用于图标点击修改分类)
  type: 'income' | 'expense' | 'transfer' | 'repayment'
  amount: number
  displayName: string      // 备注 > 分类名称
  categoryIcon: string     // SVG 图标 class
  categoryColor: string    // 图标背景色
}
```

### 3.4 分类信息解析 `getCategoryInfo(typeId)`
```
1. 遍历已加载的 categories（支出组 + 收入组）
2. 匹配分类的 id，获取 name
3. 通过 CATEGORY_ICON_MAP 查找 name → iconfont 类名
4. 若未命中，尝试从 userIconsMap（自定义图标）获取
5. 最终兜底：name='其他', icon='icon-qita'
```

---

## 四、月份切换机制

### 4.1 三种切换方式

| 方式 | 手势 | 行为 | 限制 |
|------|------|------|------|
| 下拉刷新 | scroll-view 顶部下拉 | 切换到下一月（如5月→6月） | 不超当前月 |
| 上拉加载 | scroll-view 滚动到底 | 切换到最近有数据的上一月（跳过空月） | 无更多数据时提示 |
| 选择器 | 点击头部年月 | 弹出 YearMonthPicker 直接跳转 | 不超当前月 |

### 4.2 切换逻辑

```
下拉刷新 → handleScrollToUpper()
  → switchToNextMonth()
    1. 计算 year/month++
    2. 检查是否超过当前月份 → 是则 toast「已经是最新月份了」
    3. GET /api/record/page 检查是否有数据
    4. 有数据 → transitionDirection='next' → 更新 year/month → loadMonthData()
    5. 无数据但目标月是当前月份 → 允许展示空状态（用户可看到当前月）
    6. 无数据且不是当前月 → toast「已经是最新月份了」

上拉加载 → handleReachBottom()
  → switchToPrevMonth()    （带锁防重复，1秒冷却）
    1. GET /api/record/nearest-month?yearMonth=YYYY-MM&direction=prev
       → 后端单条SQL查找最近的有数据月份（跳过所有空月份）
    2. 查到结果 → transitionDirection='prev' → 更新 year/month → loadMonthData()
    3. 查不到 → toast「已经到底了，没有更多数据了」
```

> `getNearestMonth` 使用 `TO_CHAR(date, 'YYYY-MM') + GROUP BY + LIMIT 1` 单条 SQL 查询，高效跳过间隔的空月份。例如5月有数据、4月空、3月有数据：从5月查询 → 直接返回3月。

### 4.3 切换动画

| 方向 | CSS动画 |
|------|---------|
| next（向未来） | `slideUpFromBottom`：从下方 80rpx 滑入 + 缩放 0.96→1 |
| prev（向过去） | `slideDownFromTop`：从上方 -80rpx 滑入 + 缩放 0.96→1 |

动画时长：`0.4s cubic-bezier(0.22, 0.61, 0.36, 1)`

### 4.4 YearMonthPicker（共用组件）

| 属性 | 值 |
|------|-----|
| 文件 | `src/components/YearMonthPicker.vue` |
| 组件 | `WdPopup` + `WdPickerView` |
| Props | `modelValue: string`（格式 `"2026-05"`） |
| Emits | `update:modelValue` |
| Expose | `open()` |

**年份范围**：当前年往前推10年 ~ 当前年。当前年月份只显示到当前月，历史年全部12个月。

---

## 五、状态设计

### 5.1 加载态
```
页面中央：文字 "加载中..."，28rpx #999
仅在 sortedDates 为空时显示（已有数据时静默刷新）
```

### 5.2 空状态
```
页面中央：
"暂无记账记录" — 32rpx #999
"点击下方按钮开始记账" — 26rpx #ccc
```

### 5.3 错误处理
- 加载分类失败 → `console.error` 静默处理，分类数据为空
- 加载月度汇总失败 → `monthIncome/monthExpense` 置为 0
- 加载记录失败 → `pageData` 清空

---

## 六、API 接口

| 接口 | 方法 | 路径 | 参数 | 说明 |
|------|------|------|------|------|
| getRecordsByMonth | GET | `/api/record/page` | `yearMonth`, `page`, `pageSize` | 分页获取月度记录 |
| getMonthSummary | GET | `/api/record/month-summary` | `yearMonth` | 获取月度汇总 |
| getNearestMonth | GET | `/api/record/nearest-month` | `yearMonth`, `direction`(prev/next) | 查找最近的有数据月份（跳过空月） |
| getUserCategories | GET | `/api/category/user` | `type`（expense/income） | 获取用户分类 |
| getUserIcons | GET | `/api/category/user-icons` | - | 获取用户自定义图标 |
| updateRecord | PUT | `/api/record/:id` | `{ typeId }` (仅修改分类时) | 仅更新记录的 typeId（v1.4 新增用途） |

**响应格式：**
```typescript
{
  success: boolean
  message: string
  data: any
}
```

---

## 七、页面级交互

| 交互 | 触发 | 行为 |
|------|------|------|
| 点击记录行 | BillCard 记录行 tap（非图标区域） | 跳转编辑页 `/pages/record/edit-record?id={id}` |
| **点击分类图标** | **BillCard 记录行图标 tap** | **弹出 CategorySelectPopup → 选择新分类 → 即时调用 `PUT /api/record/:id` 仅更新 typeId → 刷新列表 → Toast「分类已修改」（v1.4 新增）** |
| 点击功能入口 | FunctionBar item tap | 根据 key 跳转对应页面 |
| 点击「更多」 | FunctionBar more tap | 跳转功能列表页 `/pages/detail/function-list` |
| 点击年月 | DetailHeader 年月列 tap | 弹出 YearMonthPicker |
| 底部 tab 切换 | CustomTabbar tap | 切换 tab 页面 |

---

## 八、边界情况

1. **未来月份限制**：不能切换到超过当前月份的月份
2. **空月份自动跳转**：首次进入时若当前月无数据，自动跳转到最近有数据的月份（通过 `getNearestMonth` API，不经过空状态）
3. **间隔空月跳过**：月份切换时自动跳过空月份。例如5月有数据→4月空→3月有数据：从5月切换到3月，不提示"已经到底了"
4. **当前月份可访问**：即使当前月无数据，下拉刷新仍可切换到当前月（展示空状态），用户可确认当前月确实没有记账
5. **快速切换**：上拉加载有锁机制（`loadPrevMonthLock`），1秒冷却防重复请求
6. **静默刷新**：`onShow` 时更新月度汇总和记录数据，不影响当前滚动位置
7. **分类未加载**：首次进入时 `loadCategoriesOnce()` 只执行一次（`categoriesLoaded` 标记）
8. **分类图标兜底**：分类名不在映射表 → 尝试用户自定义图标 → 兜底 `icon-qita`

---

## 九、相关文件

| 文件 | 说明 |
|------|------|
| `src/pages/detail/index.vue` | 明细页主文件 |
| `src/pages/detail/components/DetailHeader.vue` | 头部年月+收支汇总 |
| `src/pages/detail/components/FunctionBar.vue` | 功能快捷入口栏 |
| `src/pages/detail/components/BillCard.vue` | 日期分组记录卡片 |
| `src/pages/detail/components/CategorySelectPopup.vue` | 分类选择弹出组件（v1.4 新增） |
| `src/pages/detail/function-list.vue` | 功能列表页（拖拽排序） |
| `src/pages/detail/bill.vue` | 账单明细页 |
| `src/pages/detail/fire-progress.vue` | FIRE进度页 |
| `src/components/YearMonthPicker.vue` | 年月选择器（共用组件） |
| `src/components/CustomTabbar.vue` | 底部导航栏（共用组件） |
| `src/stores/functionItems.ts` | 功能入口排序状态管理（Pinia） |
| `src/api/record.ts` | 记账记录 API |
| `src/api/category.ts` | 分类 API |
| `src/static/iconfont/iconfont.css` | 分类图标字体 |
