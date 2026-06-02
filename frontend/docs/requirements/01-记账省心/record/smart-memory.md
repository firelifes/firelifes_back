# 记账智能记忆
> 文件：`smart-memory.md` | 中文名称：记账智能记忆（账户+日期） | 所属模块：记账省心
> 版本：v1.4 | 状态：已实现 | 最后更新：2026-05-28

## 版本历史
| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v1.0 | 2026-05-25 | 初始版本 | AI |
| v1.1 | 2026-05-28 | 新增30小时窗口策略：30小时内有记录则沿用上一条的账户+日期，超过30小时回退分类记忆或默认值 | AI |
| v1.2 | 2026-05-28 | 30小时窗口数据来源改为后端 `/record/latest`：取用户记录表中最新一条（按 `createdAt` 倒序），不再依赖本地存储 `saveLastRecord` | AI |
| v1.3 | 2026-05-28 | 去除所有 localStorage 缓存方案，改用页面加载守卫（PageLoadingGuard）：页面初始化期间阻止用户交互，等 API 数据就绪后才允许操作，彻底根除异步竞态问题 | AI |
| v1.4 | 2026-05-28 | **重大修复**：解决30小时窗口账户生效但日期未生效的问题；TransactionForm 日期渲染重构为直接从 props.date 计算；selectCategory 中30小时窗口同步日期；dismissDraft 改为应用30小时窗口；优化 dev:sit 脚本防孤儿进程；修复 category-frequency 全量查询问题；auth.service 增加防御性用户校验 | AI |

---

## 功能概述

记账时自动记忆用户上次的选择，减少连续记账时的重复操作。核心策略分为三层：

1. **30小时窗口策略（主策略）**：从后端获取用户最新一条记录。如果该记录的 `createdAt` 在30小时内 → 沿用其日期和账户；超过30小时 → 进入下一层
2. **账户按分类记忆（兜底策略）**：30小时内无记录时，每个分类记住上次使用的账户，选分类时自动带出
3. **日期持续记忆**：记账成功后不重置日期，下一笔默认沿用上一笔的日期

### 为什么要做

用户一周记一次账、批量补录这段时间的支出时，希望每次记账的账户和日期保持不变，只需改分类和金额。核心场景：

- **一周批量记账**：用户用微信集中消费了一周，周末打开App批量补录。进入记账页 → 调后端获取最新记录 → 自动恢复日期和微信账户 → 只需选分类+输金额即可完成每笔记账
- **跨天补录**：昨天用微信记了餐饮，今天再次打开记账 → 超过30小时 → 回退分类记忆：餐饮自动带微信

### 行业参考

| App | 策略 |
|-----|------|
| 钱迹 | 每个分类记住上次使用的账户，选分类时自动带出 |
| 秒速记账 | 按分类记忆账户，同时根据时间段预测分类 |
| 随手记 | 模板记账，预填所有字段 |

---

## 用户故事

### 30小时窗口策略
作为一周记一次账的用户，我打开记账页时，希望日期和账户自动沿用后端最新一条记录的状态（因为大概率还是用同一个账户、记同一段时间的账），只需要改分类和金额就能快速完成批量记账。

### 账户按分类记忆
作为用户，如果我最近30小时内没有记账，当我选择了「餐饮」分类并使用「微信」账户记了一笔支出后，下次再选「餐饮」时，希望账户自动选为「微信」，而不是每次都回到默认账户。

### 日期持续记忆
作为用户，当我连续记账时（记账成功 → 继续记下一笔），日期保持不变。比如补录5月15日的多笔支出，不需要每笔都重新选日期。

---

## 详细设计

### 一、30小时窗口策略（主策略）

#### 核心逻辑（v1.4 最新）

```
打开记账页（onShow）
  ├─ pageLoading = true（页面加载守卫开启，阻止所有交互）
  │
  ├─ ① await fetchLatestRecord()  ← 永远第一个执行，确保 API 数据就绪
  │
  ├─ ② 草稿有效 → draft.load() → 显示草稿banner → pageLoading = false
  │
  ├─ ③ 刚完成记账（justCompleted）
  │    └─ await applyRecentRecord() → partialReset()
  │    └─ pageLoading = false
  │
  └─ ④ 用户主动进入
       └─ await applyRecentRecord()
            ├─ 30小时内有记录 → 恢复日期+交易类型+账户，清空分类/金额/备注
            └─ 超过30小时或首次使用 → resetForm()
       └─ pageLoading = false

放弃草稿（dismissDraft）:
  └─ await applyRecentRecord()
       ├─ 30小时内有记录 → 恢复日期+交易类型+账户
       └─ 超过30小时 → resetForm()

选择分类时（selectCategory）
  ├─ pageLoading = true → 提示"页面初始化中"并return
  ├─ 30小时窗口命中当前类型 → 匹配账户 AND 同步日期 selectedDate = recent.date
  └─ 未命中 → 分类记忆 → 默认账户
```

#### 关键修复说明（v1.4）

1. **fetchLatestRecord 提前到 onShow 最顶部执行**：确保 `latestRecord` 在任何分支（包括草稿分支）执行前都已就绪

2. **dismissDraft 改为 async 并应用 30 小时窗口**：放弃草稿后尝试 30h 窗口，而非直接 resetForm

3. **selectCategory 中同步日期**：
   - 30 小时窗口命中时，同时设置 `selectedAccount` 和 `selectedDate`
   - 解决 onShow 中 applyRecentRecord 因某些路径未执行导致的日期丢失
   - 账户和日期作为原子操作同步

4. **TransactionForm 日期渲染重构**：
   - 删除内部 `currentDate` ref 和 `hasSelectedDate` ref
   - 删除 `watch(props.date)` 同步逻辑
   - `formattedDate` computed 直接从 `props.date` 计算，无中间状态阻隔
   - 彻底解决 TransactionForm 初始化时序导致的日期显示错误

#### 页面加载守卫机制

`pageLoading` 状态在 `onShow` 异步初始化期间阻止用户交互，确保 `latestRecord` 数据就绪后才允许点击分类。

#### 数据来源：后端 `/record/latest`

仅使用后端 API，**不使用任何 localStorage 缓存**。

#### 数据模型

```typescript
interface RecordData {
  id: number
  typeId: number
  date: string        // 记账日期，如 "2026-05-26"
  amount: number
  type: RecordType    // 'expense' | 'income' | 'transfer' | 'repayment' | ...
  accountId?: number  // 支出/收入账户
  toAccountId?: number
  remark?: string
  createdAt?: string  // 服务端记录创建时间，用于30小时判断
}
```

#### 30小时判断

使用 `record.createdAt`（服务端时间）与 `Date.now()`（客户端时间）比较。30小时 = 30 × 60 × 60 × 1000ms。

---

### 二、账户按分类记忆（兜底策略）

与 v1.3 逻辑一致，无变更。

---

### 三、日期持续记忆

与 v1.3 逻辑一致，无变更。

---

## 交互流程

### 批量记账流程（核心场景）

```
用户用微信在5月26日记过账。5月28日23:00打开记账页面（在30小时内）：
  打开记账页 → pageLoading=true
  → await fetchLatestRecord() → 后端返回 {date:"2026-05-26", accountId:4(微信), createdAt: 2小时前}
  → await applyRecentRecord() → selectedDate="2026-05-26", selectedAccount={微信}
  → pageLoading=false

  → 选分类「购物」→ 30h窗口命中 expense + accountId=4
    → selectedAccount={微信} + selectedDate="2026-05-26"（原子同步）
  → showTransactionForm=true
  → TransactionForm props.date="2026-05-26" → formattedDate显示 "2026/05/26" 

  → 输入金额 → 完成记账
  → justCompleted=true → reLaunch
  → onShow → 刚存的那条 → 30h内 → 日期保持5月26日
```

---

## 账户决策完整优先级

```
选择分类 → 获取账户列表后：
  1. 转账/还债：查分类记忆 → 查默认账户
  2. 支出：已选账户在列表中 → 保留 | 否则 30h窗口匹配（同步日期） → 分类记忆 → 默认账户
  3. 收入：同上
```

---

## 修改文件清单（v1.4）

### 前端修改
| 文件 | 路径 | 变更 |
|------|------|------|
| `index.vue` | `src/pages/record/index.vue` | 1. onShow: `fetchLatestRecord` 移至最顶部<br>2. dismissDraft: async + 应用30h窗口<br>3. selectCategory: 30h窗口同步 selectedDate<br>4. 添加 `[SmartMemory]` 调试日志 |
| `TransactionForm.vue` | `src/pages/record/components/TransactionForm.vue` | 删除内部日期状态 currentDate/hasSelectedDate，formattedDate 直接从 props.date 计算 |
| `category-frequency.ts` | `src/utils/category-frequency.ts` | getAllRecords → 按月份分页查询（getRecordsByMonth） |
| `package.json` | `firelifes_back/package.json` | dev/dev:sit/kill 脚本增加孤儿进程清理 |

### 后端修改
| 文件 | 路径 | 变更 |
|------|------|------|
| `auth.service.ts` | `src/service/auth.service.ts` | 登录增加防御性 user 对象校验 |
| `package.json` | `package.json` | dev/dev:sit/kill 脚本清理 mwtsc/wrap.js/bootstrap.js 孤儿进程 |

### 后端接口（无变更）
| 接口 | 方法 | 说明 |
|------|------|------|
| `/record/latest` | GET | 路由在 `/record` 之前，返回最新一条记录 |
| `/record` | GET | 返回全部记录（仅其他页面使用，记账页不调用） |

---

## 边界情况

1. **后端 `/record/latest` 返回 null**（新用户无记录）→ `resetForm()`
2. **后端接口超时/异常** → `latestRecord.value` = null → 回退默认逻辑
3. **最新记录的账户已被删除/隐藏** → selectCategory 中匹配失败 → 回退分类记忆 → 默认账户
4. **用户切换支出/收入tab** → 清空分类和账户选择
5. **草稿恢复** → 草稿优先级最高，但 fetchLatestRecord 仍会执行以填充 latestRecord
6. **多设备记账** → 设备A记一笔后，设备B打开 → 调后端获取最新记录 → 同样恢复
7. **selectCategory 守卫**：pageLoading 期间拒绝交互，避免异步竞态

---

## 与现有功能的关系

| 现有功能 | 影响 |
|---------|------|
| 默认账户 | 作为最后回退方案（30h无匹配 → 分类无记忆 → 默认账户） |
| 分类记忆 | 30小时窗口未命中时的兜底策略 |
| 草稿自动保存 | 草稿保存/恢复逻辑不变，放弃草稿后尝试30h窗口 |
| 记账成功跳转 | 跳转行为不变，reLaunch 后 onShow 触发30h窗口恢复 |
| 编辑记录 | 不受影响，编辑页有独立的日期/账户逻辑 |
| 常用分类（CategorySelector） | 改用按月份分页查询，不再拉全部记录 |

---

## 开发调试

所有 30 小时窗口相关逻辑使用 `[SmartMemory]` 前缀的 console.log，便于在浏览器 DevTools 中筛选追踪。关键日志包括：
- `[SmartMemory] onShow 触发` - 页面进入
- `[SmartMemory] fetchLatestRecord 开始/结果` - API 调用
- `[SmartMemory] applyRecentRecord` - 30h 窗口应用
- `[SmartMemory] selectCategory 30h窗口检查/匹配/同步日期` - 分类选择
- `[TransactionForm] formattedDate computed` - 日期渲染

## 开发环境启动

由于 `mwtsc --watch` 可能产生孤儿进程，`npm run dev:sit` 脚本已增强为启动前自动清理：
```bash
# 自动清理孤儿进程 + 启动后端
npm run dev:sit

# 清理所有占用 7001 的进程
npm run kill
```
