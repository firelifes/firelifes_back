# 系统默认不可删除分类 - 利息支出/利息收入
> 文件：`default-categories.md` | 中文名称：系统默认不可删除的利息收支分类 | 所属模块：记账省心
> 版本：v1.0 | 状态：已完成 | 最后更新：2026-06-04

## 版本历史
| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v1.0 | 2026-06-04 | 初始版本：定义「利息支出」「利息收入」为系统默认分类，注册自动生成，禁止用户删除，仅可禁用 | AI |

---

## 功能概述

为支撑还贷款本金利息拆分、储蓄账户利息计算等业务场景，系统需要提供 **「利息支出」**（expense）和 **「利息收入」**（income）两个**系统默认分类**。

这两个分类在用户注册时由后端自动创建，是**不可删除**的系统默认分类，用户仅可通过分类设置页将其**禁用**（隐藏显示），但**不可彻底删除**。

### 业务背景

| 场景 | 用途 |
|------|------|
| **还贷款 - 本金利息拆分** | 利息部分自动归入「利息支出」分类，便于分析贷款利息负担 |
| **存款/理财利息到账** | 利息部分自动归入「利息收入」分类，便于追踪被动收入 |
| **财务分析** | 单独统计利息收支对净现金流的影响，评估资产/负债效率 |

---

## 核心规则

| 规则 | 说明 |
|------|------|
| **分类标识** | 支出：`expense_9_6` 利息支出；收入：`income_12_3` 利息收入 |
| **所属大类** | 支出 → 「金融理财」(groupId=9)；收入 → 「投资理财」(groupId=12) |
| **排序** | 利息支出：6；利息收入：3 |
| **用户可见性** | 用户注册后自动出现在分类列表 |
| **删除权限** | ❌ **不可删除**（系统强制保护） |
| **禁用权限** | ✅ 可禁用（用户主动隐藏） |
| **重命名权限** | ❌ **不可重命名**（保持全局一致性，利息统计口径统一） |
| **切换类型** | 利息支出/收入 不可互转（语义完全不同） |
| **图标** | 利息支出：`category-icon-lixi-zhichu`（向下箭头+百分比）；利息收入：`category-icon-lixi-shouru`（向上箭头+百分比） |

---

## 数据模型

### 1. 全局分类（`category` 表）

后端在 `seedGlobalData()` 初始化时插入：

| 字段 | 值 |
|------|------|
| id | `expense_9_6`（利息支出）<br/>`income_12_3`（利息收入） |
| name | 利息支出 / 利息收入 |
| groupId | 9（金融理财）/ 12（投资理财） |
| iconId | 54（利息支出图标）<br/>55（利息收入图标） |
| type | expense / income |
| isDefault | true |
| sortOrder | 6 / 3 |

### 2. 全局图标（`icon` 表）

| name | url | sortOrder | 用途 |
|------|-----|-----------|------|
| 利息支出 | `category-icon-lixi-zhichu` | 54 | 支出分类的利息图标 |
| 利息收入 | `category-icon-lixi-shouru` | 55 | 收入分类的利息图标 |

### 3. 用户分类（`user_category_customization` 表）

用户注册时由 `initUserCategories()` 复制全局数据，**`isUserCreated = false`** 标识为系统默认分类。

---

## 前端行为规范

### 1. 分类设置页

在 `pages/my/category-setting/category-list.vue` 中：

| 标识 | 系统默认分类显示 | 用户创建分类显示 |
|------|----------------|----------------|
| 默认徽章 | ✅ 显示「系统」或「默认」 | ❌ 不显示 |
| 编辑/重命名按钮 | ❌ 隐藏 | ✅ 显示 |
| 删除按钮 | ❌ **隐藏**（强制不可删除） | ✅ 显示 |
| 启用/禁用开关 | ✅ 显示（可隐藏） | ✅ 显示 |
| 切换类型按钮 | ❌ 隐藏 | ❌ 隐藏（语义固定） |

### 2. 记账页分类选择器

- 「利息支出」出现在支出 Tab 的「金融理财」组
- 「利息收入」出现在收入 Tab 的「投资理财」组
- 用户禁用后，分类选择器不显示该分类
- 重新启用后，分类选择器恢复显示

### 3. 还贷款 - 利息分类选择弹框

- 默认选中「利息支出」
- 用户可手动切换到其他支出分类
- 切换后该次还贷使用所选分类

---

## 后端实现规范

### 1. 启动时数据补刷机制

**触发时机**：
- 服务启动时自动执行 `seedGlobalData()`
- 用户登录或首次访问分类时执行 `initUserCategories()`
- 用户调用 `getUserCategories` 接口时执行**自动补漏检查**

**补漏逻辑**：
```
seedGlobalData():
  1. 检查全局图标：遍历 defaultIcons，如发现缺失则补充
  2. 检查全局大类：遍历 defaultGroups，如发现缺失则补充
  3. 检查全局分类：遍历 defaultCategories，如发现缺失则补充
  4. 输出日志：[启动] 已补充 X 个缺失的全局图标/大类/分类

initUserCategories(userId):
  1. 该用户已有分类 → 仅执行自动补漏（不重建）
  2. 该用户无分类 → 完整复制全局数据

getUserCategories(userId, type):
  调用前先执行 checkAndAddMissingDefaultCategories(userId)
  确保用户始终拥有最新版本的默认分类
```

### 2. 删除保护

**接口层**：`DELETE /category/:id` 必须校验 `isUserCreated === false` 时返回错误：

```typescript
// category.controller.ts
async deleteCategory(@Param('id') id: number, @Body() body) {
  const cat = await this.customizationModel.findOne({ where: { id, userId: body.userId } });
  if (!cat.isUserCreated) {
    throw new ForbiddenError('系统默认分类不可删除');
  }
  // ... 继续执行删除
}
```

**重命名保护**：类似 `PUT /category/:id` 接口，校验 `name` 修改时如果目标名是系统默认分类，禁止修改。

### 3. 跨环境数据迁移

**新环境部署**：
- 启动时执行 `seedGlobalData()`，自动创建完整的全局数据
- 旧用户首次访问分类时执行 `initUserCategories()`，复制完整默认数据
- 中间发布的分类（利息收入）通过**自动补漏逻辑**补充到所有用户

**已有用户补漏流程**：
```
用户登录
  → getUserCategories() 接口
    → checkAndAddMissingDefaultCategories(userId)
      → 查找所有 defaultCategories
      → 找到用户不存在的（如「利息收入」）
      → 自动创建该分类到用户
      → 输出日志：[分类检查] 用户 10086 缺少 1 个默认分类（利息收入），已自动补充
```

---

## 用户故事

### 用户故事 1：还贷款利息分类

**作为** 还房贷的用户，**我想要** 还贷款时系统自动选择「利息支出」分类，**以便** 我能准确统计每月的利息支出，便于优化贷款策略。

**验收标准**：
- [x] 打开还贷款表单，利息分类默认显示「利息支出」
- [x] 用户可切换到其他分类
- [x] 该分类在「金融理财」组中可见
- [x] 该分类不可被删除

### 用户故事 2：存款利息收入

**作为** 有活期存款/理财的用户，**我想要** 收到利息到账时直接选择「利息收入」分类，**以便** 单独追踪我的被动收入。

**验收标准**：
- [x] 记账时收入 Tab 中「投资理财」组下有「利息收入」分类
- [x] 该分类自带专属图标
- [x] 该分类不可被删除
- [x] 可在分类设置中禁用（隐藏）

### 用户故事 3：误删保护

**作为** 担心误操作的用户，**我想要** 系统默认分类不能被删除，**以便** 即使我误操作也不会丢失利息收支的统计口径。

**验收标准**：
- [x] 分类设置页，系统默认分类没有删除按钮
- [x] 即使通过 API 调用删除，系统返回「系统默认分类不可删除」错误
- [x] 该分类的 isUserCreated 标志为 false

---

## 数据流转图

```
后端启动
  │
  └── seedGlobalData()          ← 全局数据（图标/大类/分类）
        │
        ├── 写入 54 个全局图标（包括利息支出/收入）
        ├── 写入 13 个全局大类
        └── 写入 51 个全局分类（包括利息支出/收入）

用户注册
  │
  └── initUserCategories(userId)  ← 用户数据（从全局复制）
        │
        ├── 复制 13 个用户大类（isUserCreated=false）
        ├── 复制 54 个用户图标
        └── 复制 51 个用户分类（isUserCreated=false）

用户访问记账
  │
  └── getUserCategories(userId, type)
        │
        ├── 1. checkAndAddMissingDefaultCategories()  ← 自动补漏
        │     └── 发现缺失分类（如「利息收入」）→ 自动补充
        │
        └── 2. 返回用户分类列表
```

---

## 测试要点

| # | 场景 | 步骤 | 预期 |
|---|------|------|------|
| 1 | 新用户默认分类 | 新注册账号 → 记账页 | 支出 Tab「金融理财」有「利息支出」；收入 Tab「投资理财」有「利息收入」 |
| 2 | 旧用户自动补漏 | 已注册但缺少「利息收入」的老用户 → 访问记账页 | 系统自动补充「利息收入」到该用户 |
| 3 | 不可删除 | 分类设置页 → 长按「利息支出」/「利息收入」 | 只显示「禁用」选项，不显示「删除」 |
| 4 | API 删除保护 | 调用 `DELETE /category/:id` 删除系统默认分类 | 返回 403 错误「系统默认分类不可删除」 |
| 5 | 禁用后 | 分类设置页 → 关闭「利息收入」 → 记账页 | 收入 Tab 中「利息收入」不显示 |
| 6 | 重新启用 | 分类设置页 → 开启「利息收入」 → 记账页 | 收入 Tab 中「利息收入」恢复显示 |
| 7 | 还贷款默认选中 | 还贷款 → 弹框 | 利息分类默认显示「利息支出」 |
| 8 | 新环境部署 | 全新部署后端 → 启动 | 全局数据自动 seed，包括「利息支出/收入」 |
| 9 | 跨环境同步 | 旧数据库升级 → 启动 | 自动补漏机制工作正常，缺失的利息收入被补充 |

---

## 边界情况

1. **用户已经手动创建了同名的「利息支出」** → 不做合并，`isUserCreated` 保持 true
2. **全局分类被禁用** → 用户层面该分类也不可见
3. **用户禁用了系统默认分类** → 业务逻辑中如果需要该分类（如还贷款），仍可使用，只是 UI 中不展示
4. **图标的 url 字段变化** → 通过 sortOrder 关联图标，可能导致历史数据关联错误，需要保留 sortOrder 稳定

---

## 关联文件

### 后端
- `backend/src/service/category.service.ts` - seedGlobalData() / initUserCategories() / checkAndAddMissingDefaultCategories()
- `backend/src/controller/category.controller.ts` - 删除保护校验
- `backend/src/entity/category.entity.ts` - 分类实体
- `backend/src/entity/icon.entity.ts` - 图标实体

### 前端
- `frontend/src/utils/category-icon-map.ts` - 图标映射表
- `frontend/src/styles/category-icons.css` - SVG 图标样式
- `frontend/src/pages/my/category-setting/category-list.vue` - 分类列表（不可删除）
- `frontend/src/pages/record/components/RepaymentSplitForm.vue` - 还贷款利息分类选择

### 文档
- `frontend/docs/requirements/01-记账省心/record/transfer-operations.md` - 还贷款相关
- `frontend/docs/requirements/01-记账省心/record/category-pinned.md` - 常用分类置顶
