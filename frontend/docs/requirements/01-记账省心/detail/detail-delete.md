# 明细页 — 删除记账记录
> 文件：`detail-delete.md` | 中文名称：明细页删除记账记录 | 所属模块：记账省心（明细页子功能）
> 页面路径：`src/pages/detail/index.vue`（左滑操作）；`src/pages/record/edit-record.vue`（详情页删除）

> 版本：v1.1 | 状态：已完成 | 最后更新：2026-05-21

## 版本历史
| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v1.1 | 2026-05-21 | 全部实现：P0 后端事务+余额回退、P1 BillCard WdSwipeAction 左滑删除、P2 明细页确认弹窗+月度汇总刷新+列表移除、P3 编辑页已有删除入口 | AI-全栈开发 |
| v1.0 | 2026-05-21 | 初始版本：左滑删除交互、余额回退、月度统计联动、四种记录类型的差异化回退逻辑 | AI-产品经理 |

---

## 功能概述

用户在明细页误记了一笔账，需要能够**直接删除这条记录**。删除后系统自动回退该笔记录对账户余额的影响，并刷新月度收入/支出统计。

## 用户故事

| 场景 | 用户故事 |
|------|---------|
| **误记删除** | 作为用户，我记了一笔支出后发现选错了分类或金额不对，我希望直接在明细页左滑删除它，然后重新记一笔正确的 |
| **账户余额回退** | 作为用户，我删除一笔支出后，希望当初扣减的账户余额自动恢复，不需要我手动去改账户余额 |
| **月度统计联动** | 作为用户，我删除一笔记录后，希望本月的收入/支出汇总自动更新，不用手动刷新 |
| **转账/还债回退** | 作为用户，我删除一笔转账记录后，希望转出账户和转入账户的余额都恢复原状 |

---

## 交互设计

### 明细页操作入口：左滑删除

在明细页 `detail/index.vue` 中，每条记录行支持**左滑显示删除按钮**：

```
明细页记录列表
┌──────────────────────────────────────┐
│  05月14日 星期四  收入 128.50  支出 35.00│
├──────────────────────────────────────┤
│  ┌────────────────────────────────┐  │
│  │        ← 向左滑动              │  │
│  │ [] 餐饮            -35.00  ┃  │  │
│  │                    ┌──────┐┃  │  │
│  │                    │ 删除 │┃  │  │ ← 左滑露出红色删除按钮
│  │                    └──────┘┃  │  │
│  └────────────────────────────────┘  │
│  [] 工资           +128.50        │
│                                      │
└──────────────────────────────────────┘
```

### 交互细节

| 步骤 | 用户操作 | 系统响应 |
|------|---------|---------|
| 1 | 在记录行上**向左滑动** | 记录行右移，露出红色「删除」按钮（宽度 140rpx，红底白字） |
| 2 | 点击「删除」按钮 | 弹出确认弹窗 `WdDialog`，内容为：**确定要删除这条记录吗？删除后不可恢复。** |
| 3 | 点击「取消」 | 弹窗关闭，记录行回弹，不做任何操作 |
| 4 | 点击「确认」 | 弹窗关闭，记录行执行删除动画（`translateX(-100%)` + `opacity: 0`，300ms），调用后端删除 API |
| 5 | API 成功 | toast "已删除"，记录从列表消失，**同时刷新**：月度收入/支出汇总、当前日期的日收入/日支出小计、关联账户的余额 |
| 6 | API 失败 | toast "删除失败，请重试"，记录行恢复显示 |

### 从编辑页也可删除（已有能力）

编辑页 `edit-record.vue` 也需提供删除入口（底部增加红色「删除记录」按钮），逻辑与明细页左滑删除一致——弹窗确认 → 调后端 API → 成功后返回明细页。

---

## 账户余额回退逻辑

删除记录后，系统按**记录类型的逆向操作**回退账户余额：

| 记录类型 | 原记账时的余额变动 | 删除后的回退操作 | 涉及账户 |
|---------|-------------------|----------------|---------|
| **支出 (expense)** | 支出账户余额 **减少** | 支出账户余额 **增加**（恢复原值） | 1 个：`accountId` |
| **收入 (income)** | 收入账户余额 **增加** | 收入账户余额 **减少**（恢复原值） | 1 个：`accountId` |
| **转账 (transfer)** | 转出账户余额 **减少**；转入账户余额 **增加** | 转出账户余额 **增加**；转入账户余额 **减少** | 2 个：`accountId` + `toAccountId` |
| **还债 (repayment)** | 还款账户余额 **减少**；负债账户余额 **增加**（负债绝对值变小，余额趋向0） | 还款账户余额 **增加**；负债账户余额 **减少**（负债绝对值恢复） | 2 个：`accountId` + `toAccountId` |

### 还债删除的特殊说明

还债记录删除后，负债账户余额 **减少**（即负债绝对值增大，恢复原负债状态），还款账户余额 **增加**（恢复被扣除的金额）。

```
还债前：信用卡余额 -5,000 | 现金余额 10,000
还债后：信用卡余额 -3,000 | 现金余额  8,000  ← 还款 2,000
删还债：信用卡余额 -5,000 | 现金余额 10,000  ← 回退 2,000
```

---

## 月度统计联动

删除记录后，明细页需自动刷新以下数据：

| 数据 | 刷新方式 | 说明 |
|------|---------|------|
| 月度收入汇总 `monthIncome` | 调用 `getMonthSummary` API | 如果删除的是收入记录 |
| 月度支出汇总 `monthExpense` | 调用 `getMonthSummary` API | 如果删除的是支出记录 |
| 当前日期的日合计 | 重新计算 `getDayIncome()` / `getDayExpense()` | 删除后该日期可能无数据，分组卡片需消失 |
| 当前月份记录列表 | 从 `pageData` 中移除该记录 | 无需重新加载整月数据 |

---

## 后端 API 设计

### 现有 API（已实现 ）

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| `deleteRecord` | `DELETE` | `/record/:id` |  带事务的余额回退：支出删→账户加回、收入删→账户扣回、转账/还债删→双账户回退 |

### 实现细节

`DELETE /api/record/:id` 接口需要在删除记录前，执行余额回退逻辑：

```typescript
// 伪代码：后端 deleteRecord 改造
async deleteRecord(id: number): Promise<boolean> {
  // 1. 查询待删除记录
  const record = await this.recordModel.findOne({ where: { id } });
  if (!record) return false;

  // 2. 根据类型反向操作账户余额
  const absAmount = Math.abs(record.amount);
  
  if (record.type === 'expense') {
    // 支出删除 → 账户余额加回
    this.accountService.adjustBalance(record.accountId, +absAmount);
  } else if (record.type === 'income') {
    // 收入删除 → 账户余额扣回
    this.accountService.adjustBalance(record.accountId, -absAmount);
  } else if (record.type === 'transfer') {
    // 转账删除 → 转出账户加回，转入账户扣回
    this.accountService.adjustBalance(record.accountId, +absAmount);
    this.accountService.adjustBalance(record.toAccountId, -absAmount);
  } else if (record.type === 'repayment') {
    // 还债删除 → 还款账户加回，负债账户减回（负债绝对值增大）
    this.accountService.adjustBalance(record.accountId, +absAmount);
    this.accountService.adjustBalance(record.toAccountId, -absAmount);
  }

  // 3. 使用事务确保原子性
  // 4. 删除记录行
  return (await this.recordModel.delete(id)).affected > 0;
}
```

### 前端 API 调用（已有）

```typescript
// src/api/record.ts（已存在，无需修改）
recordApi.deleteRecord(id: number): Promise<ApiResponse<boolean>>
```

---

## 组件交互

### 明细页 BillCard 改造

`src/pages/detail/components/BillCard.vue` 的记录行需要支持左滑：

| 属性 | 值 |
|------|-----|
| 组件 | `WdSwipeAction`（与账户列表、分类列表一致） |
| 右侧按钮 | 1 个「删除」按钮，宽度 `140rpx` |
| 删除按钮背景 | `var(--color-danger)`（警示红） |
| 删除按钮文字 | `删除`，白色 `26rpx` |
| Slot | `#default`（现有记录行）+ `#right`（删除按钮） |

### 删除确认弹窗

| 属性 | 值 |
|------|-----|
| 实现 | `uni.showModal` |
| title | `"删除记录"` |
| content | `"确定要删除这条记录吗？删除后不可恢复。"` |
| `confirmText` | `"删除"` |
| `confirmColor` | `var(--color-danger)` |

### 编辑页删除按钮（ 已有）

编辑页 `edit-record.vue` header 右侧已有「删除」文字按钮，调用 `showDeleteConfirm()` → `recordApi.deleteRecord()` → toast "已删除" → navigateBack。

---

## 边界情况

1. **删除后该日期无数据** → 该日期分组卡片（BillCard）从列表消失，空日期不显示
2. **删除后该月无数据** → 显示空状态「暂无记账记录」
3. **网络错误** → toast "删除失败，请重试"，记录行回弹，不做任何数据变更
4. **记录已不存在** → 后端返回 `success: false, message: '记录不存在'`，前端 toast 后刷新列表
5. **关联账户已删除** → 记录可删除，但跳过账户余额回退步骤，仅删除记录行
6. **快速连删** → 删除动画执行期间禁止重复触发，通过 `deletingId` 状态锁定
7. **左滑与滚动冲突** → WdSwipeAction 自带手势冲突处理，无需额外代码

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `src/pages/detail/index.vue` | 明细页主文件（需添加删除处理逻辑 `handleDeleteRecord`） |
| `src/pages/detail/components/BillCard.vue` | 记录卡片（需改造为 WdSwipeAction 支持左滑） |
| `src/pages/record/edit-record.vue` | 编辑页（需新增「删除记录」红色按钮） |
| `src/api/record.ts` | 记录 API（`deleteRecord` 已存在，需调用） |
| `firelifes_back/src/controller/record/record.controller.ts` | 删除接口（已存在，但需改造） |
| `firelifes_back/src/service/record.service.ts` |  **核心改造**：`deleteRecord` 需增加余额回退逻辑 |

---

## 实现优先级

| 阶段 | 内容 | 说明 |
|------|------|------|
| **P0 — 后端改造** | `deleteRecord` 服务增加账户余额回退逻辑 + 事务保护 | 没有这个，删除只是"看起来删了"，账户余额不会恢复 |
| **P1 — 明细页左滑** | BillCard 改造为 WdSwipeAction，支持左滑露出删除按钮 | 用户主要的删除入口 |
| **P2 — 前端刷新联动** | 删除成功后刷新月度汇总 + 日合计 + 移除记录行 | 完善体验 |
| **P3 — 编辑页删除** | 编辑页底部增加红色「删除记录」按钮 | 二级入口，从编辑页也可删除 |
