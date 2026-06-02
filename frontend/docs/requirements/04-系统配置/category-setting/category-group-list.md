# 分类大类列表页
> 文件：`category-group-list.md` | 中文名称：分类大类列表页 | 所属模块：系统配置（我的页面子模块）
> pages.json 路由：`pages/my/category-setting/category-group-list`（文件系统路径：`src/pages/my/category-setting/category-group-list.vue`）
> 子分类页 pages.json 路由：`pages/my/category-setting/category-list`（文件系统路径：`src/pages/my/category-setting/category-list.vue`）

> 版本：v3.3 | 状态：已完成 | 最后更新：2026-05-29

## 版本历史
| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v3.3 | 2026-05-29 | **标题栏统一**：替换 wd-navbar → 自定义 gradient 标题栏，全设置页统一为 `linear-gradient(135deg, var(--color-primary) → var(--color-primary-dark))` 主题色渐变背景 + 白色文字 | AI-全栈 |
| v3.2 | 2026-05-24 | 分类体系重构：支出/收入大类分区展示（10 支出 + 3 收入），页面结构新增分区 | AI |
| v3.1 | 2026-05-22 | 实现拖拽排序（drag handle ）、左滑按钮规范对齐（70rpx）、设计图补充左滑区域 | AI |
| v3.0 | 2026-05-22 | 行业对标更新：数据结构对齐代码、交互组件与实际代码一致、新增行业对标&测试清单、注释 pages.json 路由与文件路径的对应关系 | AI |
| v2.1 | 2026-05-14 | 完成开发：WdSwipeAction左滑交互、默认标识、禁用/启用切换 | AI |
| v2.0 | 2026-05-12 | 统一使用WotUI组件库，左滑交互模式，移除图标字段 | AI |
| v1.1 | 2026-05-12 | 添加子分类管理入口，完善分层导航设计 | AI |
| v1.0 | 2026-05-10 | 初始版本：分类大类列表页独立需求 | AI |

---

## 一、功能概述

分类大类列表页是分类体系的入口页面，展示所有用户分类大类（CategoryGroup），**按支出/收入分区展示**（10 个默认支出大类 + 3 个默认收入大类），支持新增、编辑、禁用/启用、删除大类。点击大类可进入该大类下的子分类列表页进行子分类管理。

### 行业对标（v3.0 新增）

对标 **挖财、随手记、MoneyWiz、YNAB** 等主流记账应用：

| 功能 | 行业标准 | 当前实现 | 规划 |
|------|---------|--------|------|
| 大类列表展示 |  |  已实现 | — |
| 支出/收入大类分区 |  行业标配 |  待实现（v3.2） | 10 支出 + 3 收入分区 |
| 左滑操作（编辑/删除/禁用） |  |  已实现 | — |
| 拖拽排序 |  行业标配 |  已实现（v3.1） | — |
| 子分类数量展示 |  常见 |  已实现（v3.1） | — |

---

## 二、用户故事

1. **作为用户**，我希望能方便地查看和管理我的分类大类和子分类，这样可以让我的记账分类更有条理。
2. **作为用户**，我希望默认分类不能被误删，但可以禁用不需要的分类，保持分类体系的完整性。
3. **作为用户**，我希望能一眼看到每个大类下有多少子分类，了解分类结构的层次。

---

## 三、交互设计

### 3.1 页面结构（v3.2 新增支出/收入分区）

```
分类大类列表页
┌────────────────────────────────────┐
│  ← 返回     分类设置       [+]     │ ← WdNavbar
├────────────────────────────────────┤
│   支出大类                        │ ← 分区标题
├────────────────────────────────────┤
│  ┌──────────────────────────────┐  │
│  │ [默认] 饮食消费       5个 ›  │  │ ← WdSwipeAction 左滑区域
│  └──────────────────────────────┘  │
│  ┌──────┐  ┌──────┐              │
│  │ 编辑 │  │ 禁用 │              │ ← 默认分类：编辑+禁用
│  └──────┘  └──────┘              │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ [默认] 居家居住       4个 ›  │  │
│  └──────────────────────────────┘  │
│  ···                               │
│  ┌──────────────────────────────┐  │
│  │ [默认] 其他支出       5个 ›  │  │
│  └──────────────────────────────┘  │
│                                     │
│   收入大类                        │ ← 分区标题
├────────────────────────────────────┤
│  ┌──────────────────────────────┐  │
│  │ [默认] 薪资报酬       4个 ›  │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ [默认] 投资理财       2个 ›  │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ [默认] 其他收入       2个 ›  │  │
│  └──────────────────────────────┘  │
│                                     │
└────────────────────────────────────┘
```

> **v3.2 变更：** 大类列表按 `type` 字段分区展示，支出大类（）在上，收入大类（）在下。新增大类时需选择 type（支出/收入）。

### 3.2 分类大类卡片展示

每个分类大类卡片使用 `WdSwipeAction` 组件，左侧配拖拽手柄：

| 元素 | 说明 |
|------|------|
| **拖拽手柄** | 左侧 `` 图标（48rpx 宽），长按拖拽可排序 |
| **默认标识** | `isUserCreated: false` 的分类显示蓝色"默认"徽章（在名称左侧） |
| **名称** | 分类大类名称（32rpx，加粗，var(--color-text-primary)） |
| **子分类数量** | 副标题显示"X个子分类"（通过并行获取每个大类下的子分类数） |
| **禁用状态** | `isEnabled: false` 时卡片 60% 透明度 + 警告色"已禁用"标签 |
| **右箭头** | 纯文本 `›`，提示可点击进入子分类列表 |

### 3.3 拖拽排序（v3.1 新增）

- **触发方式**：长按左侧 `` 手柄拖拽
- **视觉反馈**：拖拽中的行 `opacity: 0.85` + `transform: scale(1.02)`，手柄变为蓝色
- **排序逻辑**：手指移动时实时计算目标位置并交换数组元素
- **持久化**：松手后调用 `reorderGroups` API 将新顺序提交到服务端
- **失败回滚**：API 失败时重新加载列表恢复原顺序

### 3.4 左滑操作区

根据不同分类属性，左滑显示不同操作按钮（总宽度 140rpx，每个按钮 70rpx）：

| 分类属性 | 左滑按钮 |
|---------|---------|
| 用户自创 + 启用 | 编辑（var(--color-primary)）+ 删除（var(--color-danger)） |
| 用户自创 + 禁用 | 编辑（var(--color-primary)）+ 删除（var(--color-danger)） |
| 默认 + 启用 | 编辑（var(--color-primary)）+ 禁用（var(--color-warning)） |
| 默认 + 禁用 | 编辑（var(--color-primary)）+ 启用（var(--color-warning)） |

### 3.5 卡片交互

| 操作 | 触发方式 | 行为 |
|------|---------|------|
| 进入子分类 | 点击卡片主体区域 | 跳转 `pages/my/category-setting/category-list?groupId=X&groupName=XX` |
| 新增大类 | 点击右上角"+" | 弹出底部 Sheet 弹窗，输入名称 |
| 编辑大类 | 左滑 → 编辑按钮 | 弹出底部 Sheet 弹窗，预填名称 |
| 禁用/启用 | 左滑 → 禁用/启用按钮 | 调用 toggle API，刷新列表 |
| 删除大类 | 左滑 → 删除按钮 | 弹出确认弹窗，确认后调用 delete API |

### 3.6 交互流程

1. **页面加载（onMounted / onShow）**
   - 调用 `getUserGroups()` 加载大类列表
   - 加载中显示  加载状态
   - 无大类时显示  空状态引导

2. **新增大类（点击"+"）**
   - 弹出 `uni.showModal`（`editable: true` 模式）
   - 校验：名称非空、不重复
   - 成功后 toast + 刷新列表

3. **编辑大类（左滑 → 编辑）**
   - 弹出 `uni.showModal`（`editable: true`，预填当前名称）
   - 校验：名称非空、不与其他大类重复
   - 成功后 toast + 刷新列表

4. **禁用/启用（左滑 → 禁用/启用按钮）**
   - 调用 `toggleUserGroup(id)` API
   - toast 提示"已启用"/"已禁用"
   - 刷新列表

5. **删除大类（左滑 → 删除按钮）**
   - 仅 `isUserCreated: true` 的分类显示删除按钮
   - 弹出 `uni.showModal` 确认弹窗："确定要删除此分类吗？"
   - **边界：如果大类下有子分类，后端应返回错误，前端提示"请先删除该大类下的子分类"**
   - 成功后 toast + 刷新列表

### 3.7 状态变化

| 状态 | 触发条件 | 行为 |
|------|----------|------|
| 加载中 | 请求数据中 | 显示  图标 + "加载中..." |
| 空态 | 无分类大类 | 显示  图标 + "添加你的第一个分类" |
| 正常 | 有分类 | 显示分类列表 |
| 删除确认 | 点击删除 | `uni.showModal` 确认弹窗 |
| 删除完成 | 确认删除 | toast"删除成功" + 刷新列表 |
| 禁用/启用完成 | 点击禁用/启用 | toast"已启用/已禁用" + 刷新列表 |

---

## 四、UI 组件使用

页面使用 WotUI (`@wot-ui/ui`) 组件库，通过 `@uni-helper/vite-plugin-uni-components` 自动按需导入。

### 4.1 实际使用的组件

| 组件 | 用途 | 关键属性 |
|------|------|---------|
| `wd-navbar` | 顶部导航栏 | `title="分类设置"`, `left-arrow`, `fixed`, `placeholder`, `bordered`, `safe-area-inset-top`, `right-text="+"`, `@click-right`, `@click-left` |
| `wd-swipe-action` | 左滑单元格 | `:right-width="140"`, `#default`（卡片主体）, `#right`（操作按钮） |

### 4.2 自定义实现部分

| 实现 | 说明 |
|------|------|
| 操作按钮 | 自定义 `.swipe-btn` 视图（非 WdButton），宽 70rpx |
| 箭头 | 纯文本 `›`（非 WdIcon），字号 44rpx，var(--color-text-secondary) |
| 弹窗 | 大类新增/编辑使用 `uni.showModal`（`editable: true`）；子分类新增/编辑使用自定义底部 Sheet 弹窗 |
| 默认徽章 | 自定义 `.default-badge`，蓝底白字"默认" |

> **注意**：页面容器需设置 `overflow-x: hidden` 禁止横向滚动，避免与 WdSwipeAction 冲突。

---

## 五、UI 设计规范

### 5.1 布局
| 属性 | 值 |
|------|-----|
| 页面背景 | var(--color-bg-page) |
| 导航栏 | WdNavbar，`fixed` + `placeholder` 固定顶部 |
| 内容区 | padding: 24rpx |
| 分类卡片 | 高度 120rpx，圆角 20rpx，padding 0 32rpx |
| 卡片间距 | 20rpx |
| 卡片阴影 | 0 4rpx 12rpx rgba(0,0,0,0.04) |
| 左滑区域 | 宽度 140rpx（编辑 70rpx + 操作 70rpx） |
| 拖拽手柄 | 宽度 48rpx，高度跟随卡片， 图标 32rpx，颜色 var(--color-text-secondary)（拖拽中 var(--color-primary)） |

### 5.2 颜色（遵循项目 Token 体系）
| 用途 | CSS Variable |
|------|------|
| 页面背景 | var(--color-bg-page) |
| 卡片背景 | var(--color-bg-card) |
| 编辑按钮、默认徽章、确定按钮 | var(--color-primary) |
| 主色渐变 | linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%) |
| 删除按钮 | var(--color-danger) |
| 禁用/启用按钮、禁用标签 | var(--color-warning) |
| 主要文案 | var(--color-text-primary) |
| 次要文案 | var(--color-text-secondary) |
| 箭头颜色 | var(--color-text-secondary) |
| 卡片按压态 | 变浅 |

### 5.3 字体
| 用途 | 字号 | 字重 | 颜色 |
|------|------|------|------|
| 分类名称 | 32rpx | 600 | var(--color-text-primary) |
| 默认徽章文字 | 20rpx | 500 | var(--color-text-inverse) |
| 禁用标签 | 24rpx | — | var(--color-warning) |
| 操作按钮文字 | 26rpx | 500 | var(--color-text-inverse) |
| 加载/空状态图标 | 120rpx | — | opacity 0.4 |
| 加载/空状态文字 | 28rpx | — | var(--color-text-secondary) |

### 5.4 动效
| 动效 | 实现 |
|------|------|
| 卡片按压反馈 | `:active` 状态背景变浅 |
| WdSwipeAction 滑动 | 组件自带过渡动画 |
| 空状态/加载状态 | 静态展示，无需额外动效 |

---

## 六、数据结构

### 6.1 分类大类（UserCategoryGroup）

```typescript
// src/api/category.ts
export interface UserCategoryGroup {
  id: number;
  name: string;                 // 大类名称
  sortOrder: number;            // 排序
  isEnabled: boolean;           // 是否启用（禁用后记账时不显示）
  isUserCreated: boolean;       // 是否用户自创（false=系统默认，不允许删除）
  createdAt: string;
  updatedAt: string;
}
```

> **v3.0 关键变更**：`isUserCreated` 字段区分默认分类与用户自创分类，默认分类 `isUserCreated: false` 不显示删除按钮，只能禁用/启用。

### 6.2 子分类（UserCategory）

```typescript
// src/api/category.ts
export interface UserCategory {
  id: number;
  userId: number;
  name: string;                 // 子分类名称
  iconId: number;               // 图标ID
  icon?: { id: number; url: string };  // 关联图标（emoji或图片URL）
  type: 'income' | 'expense';   // 收入/支出
  groupId: number;              // 所属大类ID
  sortOrder: number;            // 排序
  isEnabled: boolean;           // 是否启用
  isUserCreated: boolean;       // 是否用户自创（false=默认，不允许删除）
  createdAt: string;
  updatedAt: string;
}
```

### 6.3 图标（UserIcon）

```typescript
export interface UserIcon {
  id: number;
  userId: number;
  name: string;
  url: string;                  // emoji 字符或图片URL
  iconType: 'emoji' | 'image';  // 图标类型
  sortOrder: number;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## 七、API 接口

> 全部接口定义见 `src/api/category.ts`

### 7.1 分类大类接口

| 方法名 | 方法 | 路径 | 说明 |
|--------|------|------|------|
| `getUserGroups` | GET | `/api/category/user/groups/all` | 获取用户分类大类列表 |
| `createUserGroup` | POST | `/api/category/user/groups` | 创建分类大类 |
| `updateUserGroup` | PUT | `/api/category/user/groups/:id` | 更新分类大类名称 |
| `toggleUserGroup` | POST | `/api/category/user/groups/:id/toggle` | **切换启用/禁用状态** |
| `deleteUserGroup` | DELETE | `/api/category/user/groups/:id` | 删除分类大类（仅用户自创） |
| `reorderGroups` | POST | `/api/category/user/groups/reorder` | **v3.1 新增：重新排序分类大类** |

### 7.2 子分类接口

| 方法名 | 方法 | 路径 | 说明 |
|--------|------|------|------|
| `getCategoriesByGroup` | GET | `/api/category/group/:groupId` | 获取指定大类下的子分类列表 |
| `createCategory` | POST | `/api/category/user` | 创建子分类 |
| `updateCategory` | PUT | `/api/category/user/:id` | 更新子分类 |
| `toggleCategory` | POST | `/api/category/user/:id/toggle` | **切换子分类启用/禁用状态** |
| `deleteCategory` | DELETE | `/api/category/user/:id` | 删除子分类（仅用户自创） |

### 7.3 图标接口

| 方法名 | 方法 | 路径 | 说明 |
|--------|------|------|------|
| `getUserIcons` | GET | `/user/icons` | 获取用户图标列表（子分类新增/编辑时使用） |

### 7.4 通用响应格式

```typescript
{
  success: boolean;
  message: string;
  data: T;
}
```

### 7.5 请求体

```typescript
// 创建/更新大类
{ name: string }

// 重新排序大类（v3.1）
{ orderedIds: number[] }

// 创建子分类
{ name: string; groupId: number; iconId: number; type: 'income' | 'expense' }

// 更新子分类
{ name: string; iconId: number }
```

---

## 八、子分类列表页（关联页面）

### 8.1 页面路径

`pages/my/category-setting/category-list`（文件系统路径：`src/pages/my/category-setting/category-list.vue`）

> **v3.0 注释**：`pages.json` 中注册的路由为 `pages/my/category-setting/category-list`，代码中 `navigateTo` / `navigateBack` 均使用此路由。

### 8.2 页面结构

```
子分类列表页
┌────────────────────────────────────┐
│  ← 返回     [大类名称]      [+]     │ ← WdNavbar，标题动态显示大类名
├────────────────────────────────────┤
│  ┌──────────────────────────────┐  │
│  │ [] 早餐       [默认]      │  │ ← 默认子分类，有默认徽章
│  └──────────────────────────────┘  │
│  ┌──────┐  ┌──────┐              │
│  │ 编辑 │  │ 禁用 │              │ ← 默认分类：编辑+禁用
│  └──────┘  └──────┘              │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ [] 咖啡                    │  │ ← 用户自创，无默认徽章
│  └──────────────────────────────┘  │
│  ┌──────┐  ┌──────┐              │
│  │ 编辑 │  │ 删除 │              │ ← 用户自创：编辑+删除
│  └──────┘  └──────┘              │
│                                     │
└────────────────────────────────────┘
```

### 8.3 子分类新增/编辑弹窗

子分类页使用**自定义底部 Sheet 弹窗**（非 WdDialog 或 uni.showModal），弹窗包含：

| 区域 | 说明 |
|------|------|
| 弹窗标题 | "新增子分类" / "编辑子分类" |
| 图标选择器 | 横向滚动选择图标（emoji），选中项蓝色边框高亮 |
| 分类名称 | `<input>` 输入框，maxlength 20 |
| 分类类型 | 仅新增时显示：支出/收入 二选一（pill 标签样式） |
| 底部按钮 | 取消（灰色）+ 确定（蓝色渐变） |

---

## 九、与现有功能的关联

### 9.1 依赖关系
| 依赖 | 说明 |
|------|------|
| 用户认证 | 依赖 userStore 认证状态 |
| 我的页面入口 | `pages/my/index.vue` 中的"分类设置"入口 |

### 9.2 文件清单
| 文件 | 路径（文件系统 / pages.json路由） | 说明 |
|------|------|------|
| 大类列表页 | `src/pages/my/category-setting/category-group-list.vue` → `pages/my/category-setting/category-group-list` | 本需求对应页面 |
| 子分类列表页 | `src/pages/my/category-setting/category-list.vue` → `pages/my/category-setting/category-list` | 子分类管理页面 |
| 分类 API | `src/api/category.ts` | 分类相关全部接口 |
| 导航工具 | `src/utils/navigate.ts` | 返回兜底路由映射 |
| 需求文档 - 大类编辑 | `docs/requirements/04-系统配置/category-setting/category-group-edit.md` | 大类编辑页（设计中） |

---

## 十、边界情况与测试清单

### 10.1 边界情况

| # | 场景 | 预期行为 |
|---|------|---------|
| 1 | 未登录状态 | 不显示分类列表，提示登录 |
| 2 | 网络错误 | catch 后 toast "网络错误，请重试" |
| 3 | 空状态（无分类大类） | 显示  + "添加你的第一个分类" |
| 4 | 删除大类时有子分类 | 后端返回错误，前端 toast "请先删除该大类下的子分类" |
| 5 | 删除默认分类（isUserCreated: false） | 不显示删除按钮，无法触发删除 |
| 6 | 名称为空提交 | toast "请输入分类名称" |
| 7 | 名称重复提交 | toast "分类名称已存在" |
| 8 | 名称超长 | uni.showModal 的 editable 模式无 maxlength 限制，需依赖后端校验 |
| 9 | 快速连续点击保存 | 需在前端做防重复提交防护（当前依赖后端） |
| 10 | 图标列表为空 | 子分类新增时图标选择器为空，需兜底"无可用图标" |
| 11 | 页面横向滚动冲突 | 根容器 `overflow-x: hidden` 禁止横向滚动 |

### 10.2 测试用例清单（v3.0 新增）

| 编号 | 测试场景 | 优先级 | 前置条件 | 操作步骤 | 预期结果 |
|------|---------|--------|---------|---------|---------|
| TC-CGL-01 | 大类列表正常加载 | P0 | 用户已登录，有大类数据 | 进入分类设置页 | 显示所有大类卡片 |
| TC-CGL-02 | 空状态展示 | P0 | 用户已登录，无自定义大类 | 进入分类设置页 | 显示空状态引导 |
| TC-CGL-03 | 新增大类-正常 | P0 | 有图标数据 | 点击+，输入名称，确定 | toast "新增成功"，列表刷新 |
| TC-CGL-04 | 新增大类-空名称 | P1 | — | 点击+，不输入名称，确定 | toast "请输入分类名称" |
| TC-CGL-05 | 新增大类-重复名称 | P1 | 已有"餐饮"大类 | 输入"餐饮"，确定 | toast "分类名称已存在" |
| TC-CGL-06 | 编辑大类-正常 | P0 | 已有大类 | 左滑"餐饮"，点击编辑，修改为"美食"，确定 | toast "编辑成功" |
| TC-CGL-07 | 编辑大类-重复名称 | P1 | 有"餐饮"和"交通" | 编辑"餐饮"为"交通" | toast "分类名称已存在" |
| TC-CGL-08 | 禁用默认大类 | P0 | 默认大类启用中 | 左滑默认大类，点击禁用 | toast "已禁用"，卡片变半透明 |
| TC-CGL-09 | 启用默认大类 | P0 | 默认大类已禁用 | 左滑默认大类，点击启用 | toast "已启用"，卡片恢复正常 |
| TC-CGL-10 | 删除用户自创大类 | P0 | 用户自创大类，无子分类 | 左滑，点击删除，确认 | toast "删除成功" |
| TC-CGL-11 | 删除有子分类的大类 | P1 | 用户自创大类，有子分类 | 左滑，点击删除，确认 | toast "请先删除该大类下的子分类" |
| TC-CGL-12 | 默认大类无删除按钮 | P0 | 默认大类 | 左滑默认大类 | 只显示"编辑"+"禁用"，不显示"删除" |
| TC-CGL-13 | 点击卡片进入子分类 | P0 | 有大类 | 点击卡片 | 跳转子分类列表页，导航标题正确 |
| TC-CGL-14 | 网络错误处理 | P1 | 断网 | 进入分类设置页 | toast "网络错误"，页面保持 |
| TC-CGL-15 | 左滑冒泡阻止 | P1 | 有大类 | 左滑后点击编辑 | 弹出编辑弹窗，不跳转子分类页 |
| TC-CGL-16 | 拖拽排序 | P0 | 有 3+ 大类 | 长按  拖拽到新位置松手 | 列表顺序更新，刷新后保持 |

---

## 十一、实现要点

### 11.1 页面路由映射

`src/utils/navigate.ts` 中的兜底路由需与实际路径一致：

```typescript
const PAGE_BACKUP_MAP: Record<string, string> = {
  '/pages/my/category-setting/category-list': '/pages/my/category-setting/category-group-list',
  '/pages/my/category-setting/category-group-list': '/pages/my/index',
  // ... 其他映射
};
```

### 11.2 大类列表页关键代码结构

```typescript
// 加载列表
async function loadGroups() {
  loading.value = true
  try {
    const res = await categoryApi.getUserGroups()
    if (res.success) { groups.value = res.data }
    else { uni.showToast({ title: res.message || '获取分类列表失败', icon: 'none' }) }
  } catch (err) { uni.showToast({ title: '网络错误', icon: 'none' }) }
  finally { loading.value = false }
}

// 跳转子分类
function goToCategoryList(group: UserCategoryGroup) {
  uni.navigateTo({
    url: `/pages/my/category-setting/category-list?groupId=${group.id}&groupName=${encodeURIComponent(group.name)}`
  })
}

// 新增/编辑使用 uni.showModal editable 模式
// 禁用/启用调用 toggleUserGroup API
// 删除调用 deleteUserGroup API（带确认弹窗）
```

### 11.3 禁止横向滚动

```css
.page-container {
  overflow-x: hidden; /* 关键：禁止页面横向滚动，避免与 WdSwipeAction 冲突 */
  min-height: 100vh;
  background-color: var(--color-bg-page);
}
```

### 11.4 左滑操作按钮差异逻辑

```vue
<template #right>
  <view class="swipe-actions">
    <view class="swipe-btn swipe-btn-edit" @click.stop="handleEdit(group)">
      <text class="swipe-btn-text">编辑</text>
    </view>
    <view
      v-if="group.isUserCreated"
      class="swipe-btn swipe-btn-delete"
      @click.stop="handleDelete(group)"
    >
      <text class="swipe-btn-text">删除</text>
    </view>
    <view
      v-else
      class="swipe-btn swipe-btn-toggle"
      @click.stop="handleToggle(group)"
    >
      <text class="swipe-btn-text">{{ group.isEnabled ? '禁用' : '启用' }}</text>
    </view>
  </view>
</template>
```
