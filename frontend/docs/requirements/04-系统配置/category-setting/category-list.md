# 子分类列表页
> 文件：`category-list.md` | 中文名称：子分类列表页 | 所属模块：系统配置（我的页面子模块）
> pages.json 路由：`pages/my/category-setting/category-list`（文件系统路径：`src/pages/my/category-setting/category-list.vue`）
> 上级页面路由：`pages/my/category-setting/category-group-list`（文件系统路径：`src/pages/my/category-setting/category-group-list.vue`）

> 版本：v1.4 | 状态：已完成 | 最后更新：2026-05-29

## 版本历史
| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v1.4 | 2026-05-29 | **标题栏统一**：替换 wd-navbar → 自定义 gradient 标题栏，全设置页统一样式（主题色渐变背景 + 白色文字 + 左侧返回） | AI-全栈 |
| v1.3 | 2026-05-24 | 状态更新：全部功能已实现（含拖拽排序）；修正行业对标表 | AI |
| v1.2 | 2026-05-23 | 补充分类列表排序规则（启用在上、禁用在下）；弹窗新增/编辑改为只读展示所属大类+收支类型；新增/编辑弹窗独立为 category-edit 文档 | AI |
| v1.1 | 2026-05-23 | 需求整理：补充拖拽排序需求，规范左滑操作按钮，完善交互细节 | AI |
| v1.0 | 2026-05-23 | 初始版本：子分类列表页需求文档 | AI |

---

## 一、功能概述

子分类列表页是进入某个分类大类后的子分类管理页面。页面顶部导航栏显示当前大类名称作为标题，左侧返回按钮返回上级分类大类列表页，右侧"+"按钮新增子分类。列表中每个子分类展示分类图标、分类名称、是否默认分类标识。左滑操作区域根据分类属性展示编辑、启用/禁用、删除按钮。支持拖拽排序，允许用户自定义子分类的展示顺序。

### 行业对标

| 功能 | 行业标准 | 当前实现 | 规划 |
|------|---------|--------|------|
| 子分类列表展示 |  行业标配 |  已实现 | — |
| 图标 + 名称 + 默认标识 |  常见 |  已实现 | — |
| 左滑操作（编辑/禁用/删除） |  行业标配 |  已实现 | — |
| 拖拽排序 |  MoneyWiz/YNAB 标配 |  已实现 | — |
| 弹窗新增/编辑（图标选择器） |  |  已实现 | — |

---

## 二、用户故事

1. **作为用户**，我希望能进入某个大类查看该大类下的所有子分类，包括图标、名称和是否为默认分类。
2. **作为用户**，我希望默认子分类不能被删除，但可以禁用不常用的默认子分类，保持分类体系的完整性。
3. **作为用户**，我希望能通过左滑操作快速编辑、禁用/启用或删除子分类。
4. **作为用户**，我希望能拖拽排序子分类，自定义子分类的显示顺序，让常用分类排在前面。

---

## 三、交互设计

### 3.1 页面结构

```
子分类列表页（进入"餐饮"大类）
┌────────────────────────────────────┐
│  ← 返回      餐饮          [+]     │ ← WdNavbar
├────────────────────────────────────┤
│  ┌────┐                           │
│  │   │  [默认] 餐饮         │ │ ← WdSwipeAction 左滑区域
│  └────┘                           │
│  拖拽手柄                           │
│                                     │
│  ┌────┐                           │
│  │   │  外卖              │  │ ← 用户自创子分类
│  └────┘                           │
│                                     │
│  ┌────┐                           │
│  │   │  [默认] 咖啡（已禁用）│ │ ← 默认子分类禁用态，60%透明度
│  └────┘                           │
│                                     │
│  ┌────┐                           │
│  │   │  甜点              │  │ ← 用户自创子分类
│  └────┘                           │
│                                     │
│  ··· 长按  手柄拖拽排序 ···       │
│                                     │
└────────────────────────────────────┘

左滑操作按钮（滑动`category-card`区域触发）：
┌───────────────────────┐
│  卡片主体（默认展示）    │  ← 左滑向左推移
└───────────────────────┘
                         ┌──────┬──────┐
  用户自创子分类：         │ 编辑  │ 删除  │
                         └──────┴──────┘
                         ┌──────┬──────┐
  默认子分类（启用）：      │ 编辑  │ 禁用  │
                         └──────┴──────┘
                         ┌──────┬──────┐
  默认子分类（禁用）：      │ 编辑  │ 启用  │
                         └──────┴──────┘
```

### 3.2 子分类卡片展示

每个子分类卡片使用 `WdSwipeAction` 组件包裹，左侧配拖拽手柄：

| 元素 | 说明 |
|------|------|
| **拖拽手柄** | 卡片左侧 `` 图标（48rpx 宽），长按触发拖拽排序，拖拽中变为蓝色 |
| **分类图标** | 展示子分类对应的 emoji 图标，置于 88rpx × 88rpx 圆角容器内，渐变浅蓝背景 |
| **分类名称** | 子分类名称（32rpx，加粗，var(--color-text-primary)） |
| **默认标识** | `isUserCreated: false` 的子分类显示"默认"徽章，位于名称右侧 |
| **禁用标识** | `isEnabled: false` 时显示"已禁用"标签（var(--color-warning)） |

### 3.3 列表排序规则（v1.2 新增）

子分类列表遵循以下排序规则，与分类大类列表保持一致：

1. **启用分类优先**：`isEnabled: true` 的子分类排在前面，`isEnabled: false` 的排在后面
2. **启用区内按 order 排序**：启用的子分类之间按 `order` 字段升序排列
3. **禁用区内按 order 排序**：禁用的子分类之间同样按 `order` 字段升序排列
4. **拖拽排序仅在启用区内生效**：拖拽调整的是启用子分类之间的相对顺序，不影响禁用区的排列
5. **排序时机**：每次加载列表数据时，前端对 `getCategoriesByGroup` 返回的数据执行排序；后端也按此规则返回

```
排序示意：
┌──────────────────────────────┐
│  餐饮           [默认]    │ ← enabled: true,  order: 1
│  外卖                    │ ← enabled: true,  order: 2
│  甜点                    │ ← enabled: true,  order: 3
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │ ← 分隔（仅示意，UI 无实际分隔线）
│  咖啡（已禁用） [默认]    │ ← enabled: false, order: 1
│  饮品（已禁用）          │ ← enabled: false, order: 2
└──────────────────────────────┘
```

### 3.4 拖拽排序（ 已实现）

- **触发方式**：长按左侧 `` 手柄拖拽
- **视觉反馈**：
  - 拖拽中的行：`opacity: 0.85` + `transform: scale(1.02)`，手柄变为主色（var(--color-primary)）
  - 目标位置：其他行平滑让位，通过 `transition` 动效过渡
- **排序逻辑**：手指移动时实时计算目标位置，交换数组元素，更新视图
- **持久化**：松手后调用 `reorderCategories` API 将新顺序提交到服务端
- **失败回滚**：API 失败时重新加载列表恢复原顺序，toast 提示"排序失败"

### 3.5 左滑操作区

根据不同子分类属性，左滑显示不同操作按钮（总宽度 140rpx，每个按钮 70rpx）：

| 子分类属性 | 左滑按钮 |
|---------|---------|
| 用户自创 + 启用 | 编辑（var(--color-primary)）+ 删除（var(--color-danger)） |
| 用户自创 + 禁用 | 编辑（var(--color-primary)）+ 删除（var(--color-danger)） |
| 默认 + 启用 | 编辑（var(--color-primary)）+ 禁用（var(--color-warning)） |
| 默认 + 禁用 | 编辑（var(--color-primary)）+ 启用（var(--color-warning)） |

> **注意**：用户自创子分类不提供"禁用"功能（可直接删除），默认子分类不提供"删除"功能（保证分类体系完整性）。

### 3.6 新增/编辑子分类弹窗

>  弹窗的详细交互设计、UI 规范、数据结构请参见独立文档：[category-edit.md](./category-edit.md)

弹窗核心规则：

1. **新增/编辑共用同一个底部 Sheet 弹窗**，标题区分"新增子分类"/"编辑子分类"
2. **所属大类和收支类型为只读展示**，不可修改：
   - **所属大类**：从上级页面路由参数 `groupName` 获取，展示在弹窗顶部，灰色底标签样式
   - **收支类型**：从 `groupType` 路由参数获取（或从父级大类数据），展示" 支出"或" 收入"，灰色底标签样式
   - 这两个字段跟随所属大类，新增/编辑时均不可修改，仅作信息展示
3. **可编辑字段**：图标选择（横向滚动选择器）、分类名称（输入框）
4. **弹窗模式区分**：
   - 新增模式：名称输入框为空，图标默认选中第一个
   - 编辑模式：名称输入框预填当前值，图标预填当前值

```
新增子分类弹窗（只读展示大类+类型）
┌────────────────────────────────────┐
│  新增子分类 / 编辑子分类       ×   │
├────────────────────────────────────┤
│  所属大类   [ 餐饮 ]               │ ← 只读，灰色底标签
│  收支类型   [  支出 ]            │ ← 只读，灰色底标签
│                                      │
│  选择图标                            │
│  ┌──┬──┬──┬──┬──┬──┐  ← 横向滚动  │
│  │││││││               │
│  └──┴──┴──┴──┴──┴──┘               │
│                                      │
│  分类名称                            │
│  ┌────────────────────────────┐     │
│  │ 请输入分类名称              │    │
│  └────────────────────────────┘     │
│                                      │
├────────────────────────────────────┤
│  [ 取消 ]        [ 确定 ]          │
└────────────────────────────────────┘
```

### 3.7 交互流程

1. **页面加载**
   - 从上级页面路由参数获取 `groupId` 和 `groupName`
   - 并行加载：分类列表（`getCategoriesByGroup`）+ 图标列表（`getUserIcons`）
   - 加载中显示  状态，空数据显示  "添加你的第一个子分类"

2. **新增子分类（点击"+"）**
   - 弹出底部 Sheet 弹窗
   - 校验：名称非空、图标已选、名称不与同级子分类重复
   - 成功后 toast"新增成功" + 刷新列表 + 关闭弹窗

3. **编辑子分类（左滑 → 编辑）**
   - 弹出底部 Sheet 弹窗，预填当前数据
   - 校验：名称非空、图标已选、名称不与同级其他子分类重复
   - 成功后 toast"编辑成功" + 刷新列表 + 关闭弹窗

4. **禁用/启用（左滑 → 禁用/启用按钮）**
   - 调用 `toggleCategory(id)` API
   - toast 提示"已启用"/"已禁用"
   - 刷新列表

5. **删除子分类（左滑 → 删除按钮）**
   - 仅 `isUserCreated: true` 的子分类显示删除按钮
   - 弹出 `uni.showModal` 确认弹窗："确定要删除此分类吗？"
   - 成功后 toast"删除成功" + 刷新列表

6. **拖拽排序（长按  手柄）**
   - 长按触发拖拽模式，实时计算目标位置
   - 松手后调用 `reorderCategories` API 提交新顺序
   - 失败时重新加载列表恢复原顺序

### 3.8 状态变化

| 状态 | 触发条件 | 行为 |
|------|----------|------|
| 加载中 | 请求数据中 | 显示  图标 + "加载中..." |
| 空态 | 无子分类 | 显示  图标 + "添加你的第一个子分类" |
| 正常 | 有子分类 | 显示分类列表，支持左滑操作 |
| 拖拽中 | 长按拖拽手柄 | 当前行高亮，其他行实时让位 |
| 新增弹窗 | 点击"+" | 底部 Sheet 弹出，图标列表 + 名称输入 + 类型选择 |
| 编辑弹窗 | 点击编辑按钮 | 底部 Sheet 弹出，预填数据，无类型选择 |
| 删除确认 | 点击删除 | `uni.showModal` 确认弹窗 |

---

## 四、UI 组件使用

页面使用 WotUI (`@wot-ui/ui`) 组件库，通过 `@uni-helper/vite-plugin-uni-components` 自动按需导入。

### 4.1 实际使用的组件

| 组件 | 用途 | 关键属性 |
|------|------|---------|
| `wd-navbar` | 顶部导航栏 | `:title="groupName"`, `left-arrow`, `fixed`, `placeholder`, `bordered`, `safe-area-inset-top`, `right-text="+"`, `@click-right`, `@click-left` |
| `wd-swipe-action` | 左滑单元格 | `:right-width="140"`, `#default`（卡片主体），`#right`（操作按钮） |

### 4.2 自定义实现部分

| 实现 | 说明 |
|------|------|
| 操作按钮 | 自定义 `.swipe-btn` 视图（非 WdButton），宽 70rpx |
| 拖拽手柄 | 自定义 `.drag-handle` 文本 ，宽 48rpx，居中 |
| 默认徽章 | 自定义 `.default-badge`，蓝底白字"默认" |
| 弹窗 | 自定义底部 Sheet 弹窗，含图标横向滚动选择器、名称输入框、类型切换（仅新增模式） |
| 图标选择器 | 自定义横向滚动 `scroll-view`，从 API 获取的图标列表渲染 |

> **注意**：页面容器需设置 `overflow-x: hidden` 禁止横向滚动，避免与 WdSwipeAction 冲突。

---

## 五、UI 设计规范

### 5.1 布局

| 属性 | 值 |
|------|-----|
| 页面背景 | var(--color-bg-page) |
| 导航栏 | WdNavbar，`fixed` + `placeholder` 固定顶部 |
| 内容区 | padding: 24rpx |
| 卡片高度 | 120rpx |
| 卡片圆角 | 20rpx |
| 卡片内边距 | 0 32rpx |
| 卡片间距 | 20rpx |
| 卡片阴影 | 0 4rpx 12rpx rgba(0,0,0,0.04) |
| 左滑区域 | 宽度 140rpx（编辑按钮 70rpx + 操作按钮 70rpx） |
| 拖拽手柄 | 宽度 48rpx， 图标 32rpx，颜色 var(--color-text-secondary)（拖拽中 var(--color-primary)） |

### 5.2 颜色（遵循项目 Token 体系，详见 `theme-settings/theme.md`）

| 用途 | CSS Variable |
|------|------|
| 主色调 | var(--color-primary) |
| 页面背景 | var(--color-bg-page) |
| 卡片背景 | var(--color-bg-card) |
| 标题文字 | var(--color-text-primary) |
| 辅助文字 | var(--color-text-secondary) |
| 编辑按钮 | var(--color-primary) |
| 删除按钮 | var(--color-danger) |
| 禁用/启用按钮 | var(--color-warning) |
| 默认徽章 | linear-gradient(var(--color-primary), var(--color-primary-dark)) |
| 拖拽手柄 | var(--color-text-secondary)（默认）→ var(--color-primary)（拖拽中） |
| 禁用卡片透明度 | opacity: 0.6 |

### 5.3 字体

| 元素 | 规范 |
|------|------|
| 卡片标题 | 32rpx，font-weight 600，var(--color-text-primary) |
| 默认徽章文字 | 20rpx，font-weight 500，var(--color-text-inverse) |
| 禁用标签 | 24rpx，var(--color-warning) |
| 操作按钮文字 | 26rpx，font-weight 500，var(--color-text-inverse) |
| 拖拽手柄 | 32rpx，var(--color-text-secondary) / var(--color-primary)（拖拽中） |
| 弹窗标题 | 34rpx，font-weight 600，var(--color-text-primary) |
| 弹窗标签 | 28rpx，var(--color-text-secondary) |
| 表单输入 | 28rpx，var(--color-text-primary) |
| 弹窗按钮 | 30rpx，font-weight 500 |

### 5.4 图标容器

| 属性 | 值 |
|------|-----|
| 容器尺寸 | 88rpx × 88rpx |
| 容器圆角 | 20rpx |
| 容器背景 | 线性渐变 rgba(0, 191, 255, 0.1) → rgba(0, 153, 204, 0.1) |
| 图标字号 | 48rpx |

### 5.5 弹窗规范

| 属性 | 值 |
|------|-----|
| 遮罩背景 | rgba(0, 0, 0, 0.5) |
| 弹窗圆角 | 32rpx（顶部） |
| 弹窗最大高度 | 80vh |
| 弹窗内容区 | padding: 32rpx，flex-direction: column，gap: 32rpx |
| 图标选择项 | 96rpx × 96rpx，圆角 20rpx，gap: 16rpx |
| 图标选中态 | 边框 2rpx var(--color-primary)，渐变浅主色背景 |
| 名称输入框 | 高度 88rpx，背景 var(--color-bg-card)，圆角 16rpx，padding 0 24rpx |
| 类型按钮 | flex: 1，高度 96rpx，圆角 16rpx |
| 类型按钮选中态 | 边框 2rpx var(--color-primary)，渐变浅主色背景，文字色 var(--color-primary) |
| 底部按钮区 | 双按钮，flex: 1，高度 88rpx，圆角 16rpx |
| 取消按钮 | 背景 var(--color-border-light)，文字 var(--color-text-secondary) |
| 确定按钮 | 渐变 var(--color-primary) → var(--color-primary-dark)，文字 var(--color-text-inverse) |

### 5.6 动效

| 元素 | 动效 |
|------|------|
| 弹窗遮罩 | `fadeIn` 0.2s ease |
| 弹窗面板 | `slideUp` 0.3s ease（底部滑入） |
| 卡片按下 | `:active` 背景变浅 |
| 按钮按下 | `:active` opacity: 0.8 + transform: scale(0.98) |
| 图标/类型选中 | transition all 150ms ease |
| 拖拽中行 | transform: scale(1.02) + opacity: 0.85 |
| 其他行让位 | transition transform 200ms ease |

---

## 六、数据结构

### 子分类类型定义

```typescript
// 子分类数据结构（UserCategory）
export interface UserCategory {
  id: number;
  name: string;
  iconId: number;
  icon?: UserIcon;        // 关联的图标对象
  groupId: number;        // 所属大类 ID
  type: 'income' | 'expense';
  userId: number;
  order: number;          // 排序序号（拖拽排序用）
  isUserCreated: boolean;  // 是否为用户自创（false 为默认分类）
  isEnabled: boolean;      // 是否启用
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// 图标数据结构（UserIcon）
export interface UserIcon {
  id: number;
  url: string;            // emoji 图标，如 ""
}
```

### 请求/响应参数

```typescript
// 创建子分类
interface CreateCategoryRequest {
  name: string;
  groupId: number;
  iconId: number;
  type: 'income' | 'expense';
}

// 编辑子分类
interface UpdateCategoryRequest {
  name: string;
  iconId: number;
}

// 拖拽排序
interface ReorderCategoriesRequest {
  groupId: number;
  categoryIds: number[];  // 按目标顺序排列的子分类 ID 列表
}
```

---

## 七、API 接口

路径：`src/api/category.ts`

| 接口 | 函数名 | 方法 | 路径 | 说明 |
|------|--------|------|------|------|
| 获取图标列表 | `getUserIcons` | GET | `/api/user-icons` | 获取用户可用图标 |
| 获取子分类列表 | `getCategoriesByGroup` | GET | `/api/categories?groupId=X` | 按大类获取子分类 |
| 创建子分类 | `createCategory` | POST | `/api/categories` | 新增子分类 |
| 编辑子分类 | `updateCategory` | PUT | `/api/categories/:id` | 编辑子分类（名称+图标） |
| 禁用/启用 | `toggleCategory` | PUT | `/api/categories/:id/toggle` | 切换启用状态 |
| 删除子分类 | `deleteCategory` | DELETE | `/api/categories/:id` | 删除子分类（仅自创） |
| 拖拽排序 | `reorderCategories` | PUT | `/api/categories/reorder` | 更新子分类排列顺序 |

---

## 八、路由参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `groupId` | number |  | 所属大类 ID |
| `groupName` | string |  | 大类名称（导航栏标题，需 URL 编码） |
| `groupType` | string |  | 大类收支类型（`income` 或 `expense`），用于弹窗只读展示 |

---

## 九、边界与异常处理

| 场景 | 处理方式 |
|------|---------|
| 名称重复校验 | 新增/编辑时前端校验，与同级子分类名称不能重复 |
| 名称为空 | 前端 trim 后校验，空字符串 toast 提示"请输入分类名称" |
| 图标未选 | 前端校验，toast 提示"请选择图标" |
| 默认子分类删除 | 前端不展示删除按钮，`isUserCreated: false` 的子分类仅展示编辑+禁用/启用 |
| 启用状态切换 | `isUserCreated: false` 的分类切换启用/禁用；用户自创分类不提供禁用 |
| 网络错误 | toast 提示"网络错误"，保持当前列表状态不刷新 |
| API 返回失败 | toast 显示后端返回的 `message` 字段 |
| 拖拽排序失败 | 重新调用 `getCategoriesByGroup` 加载列表，恢复原顺序，toast "排序失败" |
| 空列表 | 显示空状态引导"添加你的第一个子分类" |
| 弹窗关闭 | 点击遮罩层、× 按钮、取消按钮均可关闭，不保存编辑内容 |
| 路由参数缺失 | `groupId` 为 0 时不做请求，等待 `onShow` 重新获取 |

---

## 十、测试清单

### 功能测试

| ID | 测试项 | 预期结果 |
|----|--------|---------|
| FT-01 | 页面加载正常 | 显示导航栏标题（大类名称）、子分类列表 |
| FT-02 | 加载中状态 | 显示  + "加载中..." |
| FT-03 | 空列表状态 | 显示  + "添加你的第一个子分类" |
| FT-04 | 卡片展示 | 图标 + 名称 + 默认徽章（默认分类时显示）|
| FT-05 | 禁用状态展示 | 禁用子分类卡片 opacity: 0.6，显示"已禁用"标签 |
| FT-06 | 左滑操作（用户自创） | 左滑显示编辑（蓝）+ 删除（红）按钮 |
| FT-07 | 左滑操作（默认启用） | 左滑显示编辑（蓝）+ 禁用（黄）按钮 |
| FT-08 | 左滑操作（默认禁用） | 左滑显示编辑（蓝）+ 启用（黄）按钮 |
| FT-09 | 新增子分类 | 点击"+"弹出弹窗，填写图标+名称+类型，确定成功 |
| FT-10 | 编辑子分类 | 左滑编辑弹出弹窗，预填数据，名称可修改，类型不可修改 |
| FT-11 | 删除子分类 | 左滑删除弹出确认弹窗，确认后 toast"删除成功" |
| FT-12 | 禁用子分类 | 左滑禁用按钮，toast"已禁用"，卡片变灰 |
| FT-13 | 启用子分类 | 左滑启用按钮，toast"已启用"，卡片恢复 |
| FT-14 | 拖拽排序 | 长按  手柄，拖拽到目标位置松手，顺序更新 |
| FT-15 | 拖拽排序失败回滚 | API 失败时恢复原顺序，toast"排序失败" |

### 异常测试

| ID | 测试项 | 预期结果 |
|----|--------|---------|
| ET-01 | 名称为空提交 | toast"请输入分类名称" |
| ET-02 | 名称重复提交 | toast"子分类名称已存在" |
| ET-03 | 图标未选提交 | toast"请选择图标" |
| ET-04 | 网络异常 | 获取列表/操作失败 toast"网络错误" |
| ET-05 | 路由参数缺失 | 不发起请求，等 onShow 重新获取 |

### UI 测试

| ID | 测试项 | 预期结果 |
|----|--------|---------|
| UT-01 | 弹窗动画 | 遮罩 fadeIn 0.2s，面板 slideUp 0.3s |
| UT-02 | 图标选中态 | 边框 2rpx var(--color-primary) + 渐变浅主色背景 |
| UT-03 | 类型选中态 | 边框 2rpx var(--color-primary) + 渐变浅主色背景 + 文字 var(--color-primary) |
| UT-04 | 按钮按下态 | opacity: 0.8 + transform: scale(0.98) |
| UT-05 | 拖拽手柄状态 | 默认 var(--color-text-secondary)，拖拽中 var(--color-primary) |
| UT-06 | 拖拽行视觉 | opacity: 0.85 + transform: scale(1.02) |