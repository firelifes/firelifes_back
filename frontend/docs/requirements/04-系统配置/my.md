# 个人中心页
> 文件：`settings.md` | 中文名称：个人中心页（我的页面） | 所属模块：系统配置 | 页面路径：`pages/my/index`

> 版本：v2.0 | 状态：已完成 | 最后更新：2026-05-28

## 版本历史

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v2.0 | 2026-05-28 | 全部菜单图标从 emoji 替换为 SVG 图标（Lucide 风格），同步更新 my.pen 设计稿 | AI |
| v1.2 | 2026-05-24 | 新增主题设置菜单项（），代码/设计稿/文档同步 | AI |
| v1.1 | 2026-05-21 | 隐藏系统导航栏（`navigationStyle: "custom"`），用户卡片从屏幕顶部渐变展开，适配安全区；代码/设计/文档同步 | AI-UI设计 |
| v1.0 | 2026-05-21 | 全面更新：同步代码实际实现（用户卡片渐变+菜单+预算设置+CustomTabbar 5tab）、新增 Pencil 设计稿 `designs/my/my.pen`、补充完整 UI 规范 | AI |
| v0.3 | 2026-05-10 | 分类设置文档结构与账户设置保持一致 | AI |
| v0.2 | 2026-05-10 | 增加分类设置菜单项 | AI |
| v0.1 | 2026-05-09 | 初始版本：我的页面基本结构（用户信息+账户设置+退出登录） | AI |

---

>  **Pencil 设计稿**: `designs/my/my.pen` — 在编辑器中使用 Pencil 插件打开，可视化查看「我的」页面完整布局。

## 功能概述

「我的」页面是用户的个人中心入口，包含：用户信息卡片（渐变蓝底）、菜单列表（分类设置/账户设置/预算设置/主题设置）、退出登录按钮。底部固定 CustomTabbar（5 tab：明细/统计/记账/资产/我的）。

## 用户故事

作为用户，我希望在「我的」页面看到自己的基本信息，并能快速进入分类设置、账户管理、预算设置和主题设置，这样我可以维护我的记账体系并个性化界面外观。

## 交互设计

### 页面结构

```
我的页面 (pages/my/index) 375×700, var(--color-bg-page)
┌────────────────────────────────────┐  ← 系统导航栏已隐藏 (navigationStyle: custom)
│  ┌──────────────────────────────┐  │     用户卡片从屏幕顶部直接展开
│  │  ┌────┐                      │  │ ← UserCard (渐变主色底, 高200px)
│  │  │  │  用户昵称             │  │   60×60 圆形白色头像
│  │  └────┘  138****8888         │  │   昵称 18px 白色加粗
│  │                               │  │   手机号 13px 半透明白
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  分类设置              ›  │  │ ← MenuList (var(--color-bg-card), 圆角12px)
│  │ ─────────────────────────── │  │   emoji 22px + 文字 15px
│  │  账户设置              ›  │  │   右侧箭头 › 20px var(--color-text-secondary)
│  │ ─────────────────────────── │  │   行间 1px 灰分割线
│  │  预算设置              ›  │  │
│  │ ─────────────────────────── │  │
│  │  主题设置              ›  │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │         退出登录              │  │ ← LogoutBtn (var(--color-bg-card), 圆角12px, 48px高)
│  └──────────────────────────────┘  │   var(--color-danger) 文字
│                                     │
├────────────────────────────────────┤
│  明细 │ 统计 │ 记账 │ 资产 │ 我的  │ ← CustomTabbar (var(--color-bg-card), 48px高)
│  (灰) │ (灰) │ (灰) │ (灰) │(主)  │   "我的" 主色高亮
└────────────────────────────────────┘
```

### 交互流程

```
我的页面
├── 用户信息卡片（渐变主色底 var(--color-primary) → var(--color-primary-dark)）
│   ├── 已登录 → 显示头像、昵称、手机号
│   └── 未登录 → 显示默认头像 + "点击登录" → 跳转 /pages/login/index
├──  分类设置 [→]
│   └── 点击跳转 → /pages/my/category-group-list
├──  账户设置 [→]
│   └── 点击跳转 → /pages/my/account-setting/account-list
├──  预算设置 [→]
│   └── 点击跳转 → /pages/detail/budget/budget-setting
├──  主题设置 [→]
│   └── 点击跳转 → /pages/my/theme-setting/theme
├── 退出登录
│   └── 点击 → WdDialog 确认弹窗 → 调用 logout() API → 清除 store → 跳转登录页
└── CustomTabbar（固定底部，5 tab，当前"我的"高亮）
```

### 状态变化

| 状态 | 触发条件 | 行为 |
|------|----------|------|
| 已登录 | `userStore.isLoggedIn() === true` | 显示用户头像+昵称+手机号+菜单+退出登录 |
| 未登录 | `userStore.isLoggedIn() === false` | 卡片显示"点击登录"，隐藏退出登录按钮 |
| 点击登录 | 未登录时点击卡片 | `uni.redirectTo('/pages/login/index')` |
| 退出确认 | 点击退出登录 | `uni.showModal` 弹窗："确定要退出登录吗？" |
| 退出完成 | 确认退出 | 调用 `logout()` API → `userStore.clearAuth()` → redirect 登录页 |
| 菜单按压 | 点击菜单项 | `:active` 背景 `rgba(0,191,255,0.05)` + `scale(0.99)` |
| 退出按压 | 点击退出登录 | `:active` 背景 `var(--color-danger)` 浅色版 + `scale(0.99)` |

---

## UI 设计规范

### 布局
- **导航栏**：系统导航栏隐藏（`navigationStyle: "custom"`），用户卡片从屏幕顶部直接展开，顶部 padding 通过 `env(safe-area-inset-top)` 适配刘海屏/灵动岛
- 页面底色：`var(--color-bg-page)`（与全局一致）
- 页面全高：`min-height: 100vh`，底部 `padding-bottom: 80px`（给 CustomTabbar 留空间）
- CustomTabbar：`position: fixed; bottom: 0; z-index: 999`

### 用户卡片 (UserCard)
| 属性 | 值 |
|------|-----|
| 背景 | `linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)` |
| 高度 | 200px（`padding: calc(80rpx + env(safe-area-inset-top)) 32rpx 80rpx`） |
| 阴影 | `0 8rpx 24rpx rgba(0, 191, 255, 0.25)` |
| 头像 | 120rpx × 120rpx，`border-radius: 60rpx`，白色边框 `4rpx rgba(255,255,255,0.9)`，右侧间距 `24rpx` |
| 昵称 | `36rpx` `var(--color-text-inverse)` `font-weight: 700`，下间距 `8rpx` |
| 手机号 | `26rpx` `rgba(255,255,255,0.85)` |
| 未登录光标 | `cursor: pointer` |

### 菜单列表 (MenuList)
| 属性 | 值 |
|------|-----|
| 背景 | `var(--color-bg-card)` |
| 圆角 | `20rpx` |
| 外边距 | `margin: 24rpx` |
| 阴影 | `0 4rpx 12rpx rgba(0,0,0,0.04)` |
| 菜单项高度 | `96rpx` |
| 菜单项内边距 | `0 28rpx` |
| emoji 图标 | `font-size: 44rpx`，宽度 `64rpx`，右侧间距 `20rpx` |
| 菜单文字 | `30rpx` `var(--color-text-primary)` `font-weight: 500` |
| 分割线 | `1rpx solid var(--color-border-light)`（最后一项无分割线） |
| 箭头 › | `36rpx` `var(--color-text-secondary)` |
| 按压态 | `background: rgba(0,191,255,0.05)` + `transform: scale(0.99)` |

### 退出登录按钮 (LogoutBtn)
| 属性 | 值 |
|------|-----|
| 背景 | `var(--color-bg-card)` |
| 圆角 | `20rpx` |
| 外边距 | `margin: 40rpx 24rpx` |
| 内边距 | `32rpx` |
| 文字 | `32rpx` `var(--color-danger)` `font-weight: 500`，居中 |
| 阴影 | `0 4rpx 12rpx rgba(0,0,0,0.04)` |
| 按压态 | `transform: scale(0.99)` + `background: var(--color-danger-light)` |

### CustomTabbar
| 属性 | 值 |
|------|-----|
| 文件 | `src/components/CustomTabbar.vue` |
| 位置 | `position: fixed; bottom: 0; left: 0; right: 0` |
| 高度 | 60px（`height: 60px`） |
| 背景 | `var(--color-bg-card)`，顶部 `1px solid var(--color-border)` |
| z-index | `999` |
| Tab 列表 | 明细(icon-zhangdan) / 统计(icon-tongji) / 记账(icon-...) / 资产(icon-zichan) / 我的(icon-wode) |
| 选中色 | `var(--color-primary)` |
| 未选中色 | `var(--color-text-secondary)`，`opacity: 0.7` |
| 图标尺寸 | `24px` |

### 菜单项配置

| 序号 | 菜单项 | SVG图标 | 点击跳转 | 说明 |
|------|--------|---------|---------|------|
| 1 | 分类设置 | `category-icon-fenleishezhi`（文件夹+标签） | `pages/my/category-setting/index` | 管理支出/收入分类，自定义排序与分组 |
| 2 | 账户设置 | `category-icon-zhanghushezhi`（银行卡+对勾） | `pages/my/account-setting/index` | 添加/编辑/删除账户，设置默认账户 |
| 3 | 预算设置 | `category-icon-yusuan`（靶心） | `pages/detail/budget/budget-setting` | 配置月/年预算，预警阈值 |
| 4 | 主题设置 | `category-icon-zhutishezhi`（调色板） | `pages/my/theme-setting/theme` | 切换主题色/暗黑模式，自定义配色 |

---

## 技术实现

### 组件依赖
| 组件 | 用途 |
|------|------|
| `CustomTabbar` | 底部5Tab固定导航栏 |
| `useUserStore` (Pinia) | 用户认证状态管理 |

### API 依赖
| 函数 | 用途 |
|------|------|
| `logout()` | 退出登录（清除后端 session） |
| `userStore.clearAuth()` | 清除本地认证信息（token/用户数据） |

### 关键代码
```typescript
// 未登录 → 点击卡片跳转登录
const handleUserCardClick = () => {
  if (!userStore.isLoggedIn()) {
    uni.redirectTo({ url: '/pages/login/index' })
  }
}

// 退出登录
const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: async (res) => {
      if (res.confirm) {
        await logout()
        userStore.clearAuth()
        uni.redirectTo({ url: '/pages/login/login' })
      }
    }
  })
}

// 跳转主题设置
const navigateToTheme = () => {
  uni.navigateTo({
    url: '/pages/my/theme-setting/theme'
  })
}
```

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `src/pages/my/index.vue` | 我的页面主文件 |
| `src/pages/my/theme-setting/theme.vue` | 主题设置页 |
| `src/components/CustomTabbar.vue` | 底部导航栏（共用组件） |
| `src/stores/user.ts` | 用户认证状态管理（Pinia） |
| `src/api/auth.ts` | 认证 API（含 logout） |
| `designs/my/my.pen` |  Pencil 设计稿 |

---

## 边界情况

1. **未登录状态** → 用户卡片显示"点击登录"，隐藏退出登录按钮，点击卡片跳转登录页
2. **头像加载失败** → 兜底默认头像 `/static/logo.png`
3. **昵称为空** → 显示 `userStore.user?.username || '未设置昵称'`
4. **退出登录异常** → catch 后仍执行 `clearAuth()` + redirect，确保前端状态正确
5. **CustomTabbar 遮挡** → `.my-container` 设置 `padding-bottom: 80px` 避免内容被遮挡
