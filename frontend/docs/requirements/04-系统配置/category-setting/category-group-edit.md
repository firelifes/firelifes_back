
# 分类大类编辑页
&gt; 文件：`category-group-edit.md` | 中文名称：分类大类编辑 | 所属模块：系统配置（我的页面子模块）
&gt; 页面路径：`src/pages/my/category-setting/category-group-edit.vue`（底部弹窗组件）

&gt; 版本：v1.1 | 状态：已完成 | 最后更新：2026-05-24

## 版本历史
| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v1.1 | 2026-05-24 | 状态更新：功能已实现为底部弹窗组件；修正页面路径 | AI |
| v1.0 | 2026-05-10 | 初始版本：分类大类编辑页独立需求 | AI |

---

## 功能概述
分类大类编辑以**底部弹窗（Sheet）**形式实现，从 `category-group-list.vue` 中调用。支持新增大类和编辑两种模式。

> **实现差异**：需求原设计为独立页面（WdNavbar），实际实现为底部弹窗组件。轻量化交互体验更好，用户无需跳转页面即可完成新增/编辑。

## 用户故事
作为用户，我希望能灵活添加和修改分类大类信息，这样可以让我的记账分类更有条理。

---

## 交互设计

### 页面结构（实际实现：底部弹窗）

```
分类大类编辑弹窗（底部 Sheet）
┌────────────────────────────────────┐
│  新增大类 / 编辑大类          ×   │  ← 弹窗标题栏
├────────────────────────────────────┤
│  大类名称                          │
│  ┌──────────────────────────────┐  │
│  │ 请输入大类名称            [x] │  │  ← input, maxlength=20
│  └──────────────────────────────┘  │
│                                    │
│  分类类型                          │
│  ┌──────────────────────────────┐  │
│  │ [支出]  [收入]               │  │  ← pill标签，编辑模式只读
│  └──────────────────────────────┘  │
│                                    │
├────────────────────────────────────┤
│  [ 取消 ]          [ 创建/保存 ]  │  ← 底部双按钮
└────────────────────────────────────┘
```

### 页面模式

- **新增模式**：标题显示"新增大类"，所有字段为空，图标默认选中，类型默认支出，保存后创建新分类
- **编辑模式**：标题显示"编辑大类"，通过路由参数 `id` 加载已有分类数据并填充表单，保存后更新

### 表单字段与验证

| 字段 | 必填 | 验证规则 | 说明 |
|------|------|---------|------|
| 大类名称 |  | 1-20字符 | 非空且不超过20字符 |
| 分类类型 |  | 二选一 | 支出 / 收入，pill标签样式 |


### 交互细节

- **默认值填充**：类型默认expense（支出）
- **保存按钮**：自定义双按钮栏，取消按钮 + 创建/保存按钮，`canSave` 控制确认按钮可用性
- **保存反馈**：调用API成功后toast提示"创建成功"/"修改成功"，1.5秒后自动 `navigateBack` 返回列表页
- **清除按钮**：WdInput 组件 `showClear` 属性提供一键清除功能

---

## UI 组件使用

| 组件 | 用途 | 关键属性 |
|------|------|---------|
| 自定义弹窗 | 底部 Sheet 容器 | `v-if="visible"`, `position: fixed; bottom: 0` |
| 自定义 input | 大类名称输入 | `v-model`, `placeholder`, `maxlength=20` |
| 自定义按钮 | 取消/创建（保存） | `@click` 事件绑定，`canSave` 控制 disabled |

---

## UI 设计规范

### 布局
- 弹窗蒙层：`position: fixed; top/left/right/bottom: 0; background: rgba(0,0,0,0.5)`
- 弹窗面板：`width: 100%`, `border-radius: 32rpx 32rpx 0 0`, 从底部滑入动画
- 表单容器：`var(--color-bg-card)` 背景，padding `32rpx`，flex column 布局
- 表单行间距：`32rpx`
- 底部按钮：双按钮布局，`flex: 1`，高度 `88rpx`，圆角 `16rpx`

### 颜色（遵循项目 Token 体系）
- 页面背景：var(--color-bg-page)
- 表单容器背景：var(--color-bg-card)
- 输入框背景：var(--color-bg-card)（通过 WdInput `customStyle` 设置）
- 选中边框：var(--color-primary)
- 选中背景：rgba(0, 191, 255, 0.1)
- 标签文字：var(--color-text-primary)
- 占位文字：var(--color-text-secondary)
- 保存按钮：`禁用态: canSave=false 灰色`、`加载中: saving=true 不可点击`、`正常: var(--color-primary) 渐变`
- 输入框背景：var(--color-bg-card)（通过 WdInput `customStyle` 设置）

### 字体
- 弹窗标题：`34rpx`，`font-weight: 600`，`var(--color-text-primary)`
- 表单标签：`28rpx`，`font-weight: 500`，`var(--color-text-primary)`
- 输入文字：`28rpx`，`var(--color-text-primary)`，placeholder `var(--color-text-secondary)`
- 类型标签文字：`26rpx`，`var(--color-text-primary)`（选中态 `var(--color-primary)`，`font-weight: 500`）
- 底部按钮：`30rpx`，`font-weight: 500`

### 交互状态
- 类型标签默认：背景 `var(--color-bg-card)`，无边框
- 类型标签选中：边框 `2rpx var(--color-primary)`，背景 `rgba(0, 191, 255, 0.1)`，文字 `var(--color-primary)`
- 编辑模式类型标签：只读样式，选中项高亮显示，其他半透明
- 取消按钮：`var(--color-border-light)` 背景，文字 `var(--color-text-secondary)`
- 确认按钮正常：`var(--color-primary)` 渐变背景
- 确认按钮禁用：`opacity: 0.5`，不可点击

### 动效
- 弹窗打开：蒙层 `fadeIn 0.2s ease` + 面板 `slideUp 0.3s ease`
- 类型选中切换：`transition all 0.2s ease`

---

## 数据结构

### 分类类型定义

```typescript
// 分类类型枚举
export type CategoryType = 'expense' | 'income';

// 分类大类数据结构
export interface CategoryGroup {
  id: number;
  name: string;
  icon: string;
  type: CategoryType;
  order: number;
  isDefault: boolean;
  isVisible: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// 创建/编辑分类的请求参数
export interface CategoryGroupRequest {
  name: string;
  icon: string;
  type: CategoryType;
}

// 分类类型选项
export const CATEGORY_TYPE_OPTIONS = [
  { value: 'expense' as CategoryType, label: '支出' },
  { value: 'income' as CategoryType, label: '收入' }
]

// 预设图标
export const CATEGORY_ICONS = [
  '', '', '', '', '', '', '', '', '', '', ''
]
```

---

## API 接口（`src/api/category.ts`）

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| getCategoryGroupDetail | GET | `/api/category-groups/:id` | 获取分类详情（编辑模式加载数据） |
| createCategoryGroup | POST | `/api/category-groups` | 创建新分类 |
| updateCategoryGroup | PUT | `/api/category-groups/:id` | 更新分类信息 |

### 请求/响应格式

```typescript
// 创建/更新请求体（CategoryGroupRequest）
{
  name: string;        // 大类名称
  icon: string;        // 图标emoji
  type: CategoryType;  // 分类类型
}

// 响应体
{
  success: boolean;
  message: string;
  data: CategoryGroup;
}
```

---

## 页面逻辑流程

### 新增模式
1. 进入页面（无 `id` 参数）
2. 初始化表单：图标=，类型=expense
3. 用户填写表单
4. `canSave` 计算属性校验：名称非空 &amp;&amp; 名称≤20字符
5. 点击保存 → `saving = true` → 调用 `createCategoryGroup` API
6. 成功 → toast "创建成功" → 1.5s后 `navigateBack`
7. 失败 → toast 显示错误信息 → `saving = false`

### 编辑模式
1. 进入页面（带 `id` 参数）
2. `onLoad` 中调用 `loadCategoryGroupDetail(id)` 加载分类详情
3. 将返回数据填充到 `formData`
4. 用户修改表单
5. 点击保存 → `saving = true` → 调用 `updateCategoryGroup(id, formData)` API
6. 成功 → toast "修改成功" → 1.5s后 `navigateBack`
7. 失败 → toast 显示错误信息 → `saving = false`

### 保存按钮可用条件
```typescript
const saving = ref(false);

const canSave = computed(() =&gt; {
  return formData.value.name.trim().length &gt; 0 &amp;&amp;
         formData.value.name.length &lt;= 20;
});

// 确认按钮绑定：`:class="{ 'footer-btn-disabled': !canSave }"` `@click="handleSave"`
```

---

## 边界情况

1. **网络错误**：catch 捕获后 toast "网络错误"，`saving = false`
2. **分类不存在**：API 返回 success=false，toast 显示 message
3. **名称为空**：canSave 为 false，确认按钮置灰不可点击
4. **名称超长**：WdInput `maxlength=20` 自动限制，canSave 为 false
5. **编辑模式加载失败**：toast 提示错误信息，用户可手动返回
6. **重复提交防护**：`saving` 状态为 true 时 `handleSave` 直接 return，防止重复提交
7. **重复名称**：点击保存时提示："该分类名称已存在"
