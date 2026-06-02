# 记账草稿自动保存
&gt; 文件：`draft-auto-save.md` | 中文名称：记账中途草稿自动保存与恢复功能 | 所属模块：记账省心
&gt; 版本：v1.1 | 状态：已完成 | 最后更新：2026-05-24

## 版本历史
| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v1.1 | 2026-05-24 | 实现完成：新增 draft.ts 工具类 + record/index.vue 草稿逻辑 | AI |
| v1.0 | 2026-05-09 | 初始版本 | AI |

---

## 功能概述
记账中途退出时自动暂存当前状态，下次进入记账页时弹窗询问是否恢复。草稿存储在 localStorage，24 小时过期后自动忽略。

## 用户故事
作为用户，我正在输入一笔记账记录，突然需要回复微信消息或接听电话。我希望离开记账页时内容自动保存，回来时能选择恢复继续编辑。

---

## 交互设计

### 草稿恢复提示条（仅在有未过期草稿时显示）

```
┌────────────────────────────────────┐
│  支出 | 收入             取消      │  ← Tab 栏
├────────────────────────────────────┤
│   有未完成的记账草稿              │  ← 提示条（浅主色背景）
│         [ 放弃 ]  [ 恢复 ]         │
│  ────────────────────────────── │
│                                     │
│  分类网格区域...                     │
└────────────────────────────────────┘
```

| 状态 | 图标 | 说明 |
|------|------|------|
| 有草稿 |  | 显示提示条，用户可选择恢复或放弃 |
| 恢复后 | 无 | 提示条消失，表单数据回填 |
| 放弃后 | 无 | 提示条消失，表单恢复默认空状态 |
| 正常提交成功 | 无 | 草稿自动清除，下次进入无提示 |
| 草稿过期（>24h） | 无 | 静默忽略，不显示提示条 |

### 交互流程

1. 用户进入记账页
2. `onShow` 检查 localStorage 是否有草稿
3. 如果有草稿且未过期 → 显示提示条，**表单不自动填充**
4. 用户点击「恢复」→ 回填 `transactionType`、`selectedCategory`、`displayAmount`、`remark`、`selectedDate`
5. 用户点击「放弃」→ 清空草稿，显示默认空表单
6. 用户正常提交成功后 → 清空草稿
7. 用户退出页面时 → `onUnmounted` 自动保存草稿
8. 用户点击取消 → 保存草稿后跳转

---

## 技术实现

### 新增文件

| 文件 | 说明 |
|------|------|
| `src/utils/draft.ts` | 草稿保存/恢复/清除/过期检查 |

### 修改文件

| 文件 | 改动 |
|------|------|
| `src/pages/record/index.vue` | 3 处：新增 `saveDraft` / `dismissDraft` / `restoreDraft` 方法；`onShow` 检查草稿；`onUnmounted` 保存草稿；`handleCancel` 保存草稿；`handleComplete` 成功后清除草稿；`handleCloseTransactionForm` 保存草稿；模板新增草稿提示条 |

### 数据结构

```typescript
interface RecordDraft {
  transactionType: 'income' | 'expense'
  categoryId: number | null
  categoryName: string
  categoryIcon: string
  displayAmount: string
  remark: string
  selectedDate: string
  accountId: number | null
  accountName: string
  accountIcon: string
  fromAccountId: number | null
  fromAccountName: string
  toAccountId: number | null
  toAccountName: string
  savedAt: number
}
```

### 保存时机

| 触发 | 行为 |
|------|------|
| `onUnmounted` | 保存当前所有 ref 状态 |
| `handleCancel` | 保存草稿后跳转首页 |
| `handleCloseTransactionForm` | 关闭弹窗时保存草稿 |

### 恢复时机

| 触发 | 行为 |
|------|------|
| `onShow` + 有效草稿 | 显示提示条，等待用户选择 |

### 清除时机

| 触发 | 行为 |
|------|------|
| `handleComplete` 成功 | `draft.remove()` |
| 用户点击「放弃」 | `draft.remove()` |
| 草稿过期（>24h） | `draft.hasValidDraft()` 返回 false，静默忽略 |

### 空状态优化

- 仅 `transactionType === 'expense'` 且 `selectedCategory`、`displayAmount`、`remark` 均为空时不保存草稿
- 切换到收入 Tab 但无其他操作时仍保存（`transactionType: 'income'` 属于有意义的变更）

---

## UI 设计规范

| 元素 | 色值 |
|------|------|
| 提示条背景 | `rgba(13, 148, 136, 0.08)`（基于 `var(--color-primary)`） |
| 提示文字 | `var(--color-text-primary)` |
| 恢复按钮背景 | `var(--color-primary)` |
| 恢复按钮文字 | `var(--color-text-inverse)` |
| 放弃按钮文字 | `var(--color-text-secondary)` |

- 提示条高度：`72rpx`（含 padding `16rpx 24rpx`）
- 动效：`slideDown` 200ms ease
- 按钮圆角：`24rpx`

---

## 边界情况

1. **提交成功后** → 清除草稿
2. **草稿已过期（24小时）** → 静默忽略
3. **存储已满** → localStorage 失败时 catch 静默处理
4. **切换 Tab** → 不触发草稿保存（仅在 `onUnmounted` / `handleCancel` / `handleCloseTransactionForm` 时保存）
5. **App 被杀** → 草稿保留（localStorage 持久化）
6. **草稿与当前输入冲突** → 弹窗询问，用户自主选择恢复或放弃
7. **空状态不保存** → 默认支出 + 无分类 + 无金额 + 无备注 = 不保存草稿
