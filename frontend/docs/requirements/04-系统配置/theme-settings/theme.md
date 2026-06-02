# 主题设置需求文档
> 文件：`theme.md` | 中文名称：主题设置（颜色Token体系+预设+自定义） | 所属模块：系统配置
> 版本：v1.6 | 状态：已完成 | 最后更新：2026-05-29

## 版本历史

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v1.6 | 2026-05-29 | **标题栏统一**：弃用透明 header，改为全设置页统一的 gradient 标题栏（主题色渐变背景 + 白色文字 + safe-area 适配） | AI-全栈 |
| v1.5 | 2026-05-24 | 主题同步服务端（user_configs表），新增user-config表支持 | AI |
| v1.0 | 2026-05-09 | 初始版本 | AI |

---

## 1. 问题背景

### 1.1 当前状态

项目目前颜色使用混乱，存在以下核心问题：

| 问题 | 具体表现 |
|---|---|
| **主色不统一** | 90% 页面用 `#00BFFF`（小米汽车蓝），登录/忘记密码页刚改为 `#0D9488`（Teal），两套主色并存 |
| **同一语义多色值** | 主文字同时存在 `#333` `#333333` `#2d3436` `#1E293B` `#3f536e` 五种写法 |
| **硬编码散落** | 500+ 处颜色以 `#xxx` 直接写在各 `.vue` 文件中，无统一入口 |
| **uni.scss 名存实亡** | `$uni-color-primary` 仍是 `#00BFFF`，新页面未引用 |
| **用户不可控** | 用户无法切换主题 |

### 1.2 目标

1. 建立**颜色 Token 体系**，所有颜色一处定义、全局引用
2. 提供 **3 套精心设计的预设主题**，用户一键切换
3. 支持用户**自定义每个颜色项**，保存到本地
4. 颜色种类**精简易维护**（约 15 个 token），但覆盖所有 UI 场景

---

## 2. 颜色使用全景梳理

经全量代码扫描，项目所有颜色使用归类如下：

### 2.1 全局色（每页都出现）

| 角色 | 当前色值 | 出现位置 |
|---|---|---|
| 页面背景 | `#f5f6fa` / `#F5F7FA` / `#F0F2F5` / `#f5f5f5` | 所有页面根容器 |
| 卡片背景 | `#fff` / `#FFFFFF` | 表单卡片、列表项 |
| 主文字 | `#333` / `#333333` / `#2d3436` | 标题、正文 |
| 次文字 | `#999` / `#666` / `#5c6b7a` / `#94A3B8` | placeholder、辅助说明 |
| 边框/分割线 | `#e5e5e5` / `#f0f0f0` / `#F0F2F5` / `#E2E8F0` | 输入框底线、列表分割线 |

### 2.2 品牌色（核心交互色）

| 角色 | 当前色值 | 使用场景 |
|---|---|---|
| 主色 | `#00BFFF`（旧）/ `#0D9488`（新登录页） | 按钮、激活态、链接 |
| 主色渐变 | `linear-gradient(135deg, #00BFFF, #0099CC)` | 顶部导航栏、确认按钮 |
| 主色浅底 | `#E6F7F5`（新）/ `#f0f9ff`（旧） | 标签背景、选中高亮背景 |

### 2.3 功能色（语义色）

| 角色 | 当前色值 | 使用场景 |
|---|---|---|
| 成功/收入 | `#19BE6B` | 收入金额、保存成功 |
| 危险/删除 | `#FA3534` / `#e74c3c` | 删除按钮、支出标记、confirmColor |
| 警告 | `#FAAD14` / `#f0ad4e` | 系统分类保护标识 |
| 微信绿 | `#07C160` | 微信登录按钮 |
| 禁用灰 | `#ccc` / `#c0c0c0` / `#CBD5E1` | 按钮禁用态、不可交互文字 |

### 2.4 特殊场景色

| 角色 | 当前色值 | 使用场景 |
|---|---|---|
| 白色文字 | `#fff` / `#FFFFFF` | 深色按钮上的文字 |
| 遮罩 | `rgba(0,0,0,0.4)` / `rgba(0,0,0,0.5)` | 弹框遮罩 |
| 骨架屏 | `#f0f0f0` / `#e0e0e0` | 加载占位 |
| 金色 | `#FFD700` | 预算达标标识 |
| 智慧紫 | `#6c5ce7` | 功能列表图标背景 |
| 深蓝 | `#0369a1` / `#f8f9ff` | 预算说明卡片 |

### 2.5 统计结论

| 指标 | 数值 |
|---|---|
| 不同色值总数 | **约 55 种** |
| 本质角色数量 | **约 15 个语义角色** |
| 可收敛到的 Token 数 | **≤ 18 个** |

---

## 3. 颜色 Token 体系设计

### 3.1 核心原则

1. **少即是多**：≤18 个 Token 覆盖所有场景
2. **语义化命名**：按功能命名，不按色值命名（`--color-primary` 而非 `--color-blue`）
3. **层级关系**：每个 Token 有明确的主/次/禁用层级
4. **CSS 变量**：定义在 `:root`，所有组件通过 `var(--color-xxx)` 引用

### 3.2 Token 清单

```
┌── 品牌色（3 个）
│   --color-primary           主色：按钮、激活态、链接
│   --color-primary-light      主色浅底：选中背景、标签底色
│   --color-primary-dark       主色深色：按钮按下态
│
├── 背景色（3 个）
│   --color-bg-page            页面背景
│   --color-bg-card            卡片/列表项背景
│   --color-bg-input           输入框背景（通常 = 卡片背景）
│
├── 文字色（4 个）
│   --color-text-primary       主文字：标题、正文
│   --color-text-secondary     次文字：辅助说明、placeholder
│   --color-text-tertiary      三级文字：禁用态、更弱提示
│   --color-text-inverse       反色文字：深色背景上的白色文字
│
├── 边框色（2 个）
│   --color-border             默认边框/分割线
│   --color-border-light       浅边框（卡片内部分割）
│
├── 功能色（5 个）
│   --color-success            成功/收入绿
│   --color-danger             危险/删除红
│   --color-warning            警告黄
│   --color-wechat             微信绿
│   --color-info               信息提示蓝
│
└── 覆盖层（1 个）
    --color-mask               遮罩层
```

**总计 18 个 Token。**

### 3.3 CSS 变量定义位置

```
src/
├── theme/
│   ├── variables.css          ← :root { --color-primary: ...; ... }  默认主题
│   ├── presets.ts             ← 3 套预设主题色值定义
│   └── index.ts               ← 主题初始化、应用、持久化逻辑
```

### 3.4 颜色对照表（Token → 使用场景）

| Token | 使用场景（组件/位置） |
|---|---|
| `--color-primary` | 登录/注册按钮、Tab 激活态、链接文字、分类选中、预算主色、FIRE 进度圆环、开关 activeColor、确认按钮渐变 |
| `--color-primary-light` | 获取验证码按钮底、选中标签底色、预算高亮行底色 |
| `--color-primary-dark` | 按钮按下态（active 时 `.darken(10%)` 或单独色值） |
| `--color-bg-page` | 所有页面根容器 `min-height:100vh` |
| `--color-bg-card` | 表单卡片、列表行、弹框、设置卡片 |
| `--color-text-primary` | 页面标题、金额、用户名、分类名、表单内已输入文字 |
| `--color-text-secondary` | placeholder、输入提示、列表副标题 |
| `--color-text-tertiary` | 禁用文字、弱化提示、时间戳 |
| `--color-text-inverse` | 主色按钮上文字、渐变导航栏上文字 |
| `--color-border` | 输入框下划线、列表分割线、弹框分隔 |
| `--color-border-light` | 卡片内部分割线、更弱的分隔 |
| `--color-success` | 收入金额、保存成功标识、余额正数 |
| `--color-danger` | 删除按钮、支出负数、confirmColor、错误提示 |
| `--color-warning` | 系统分类保护角标、超预算警告 |
| `--color-wechat` | 微信登录按钮（固定不变） |
| `--color-info` | 信息提示条、帮助说明背景 |
| `--color-mask` | 弹框遮罩、底部弹出遮罩、loading 遮罩 |

---

## 3+. 字号 Token 体系（v1.6 新增）

在颜色 Token 之外，新增字号 Token 体系，统一全项目文字大小。

### 3+.1 为何需要字号 Token

与颜色同样的问题：各页面硬编码 `font-size: 28rpx` / `32rpx`，同一语义（如"正文""标题"）在不同页面大小不一致。通过语义化 Token 统一管理。

### 3+.2 字号 Token 清单

```
--text-caption: 20rpx;       标签：功能入口文字、徽章、最小辅助
--text-note: 22rpx;          说明：图表标签、描述行、极弱提示
--text-small: 24rpx;         小字：提示条、辅助说明、副标题
--text-body: 28rpx;          正文：列表项、菜单按钮、段落
--text-title: 32rpx;         标题：卡片标题、分类名、大号名称
--text-nav: 34rpx;           导航：页面导航栏标题
--text-number: 40rpx;        数字：账户余额、金额展示
--text-number-lg: 48rpx;     大数字：重要金额
--text-number-xl: 56rpx;     特大数字：净资产
--text-number-hero: 72rpx;   极致数字：主打金额
```

### 3+.3 定义位置

`src/theme/variables.css` 的 `:root` 中，与颜色 Token 同文件。

### 3+.4 使用示例

```css
.card-title {
  font-size: var(--text-title);
  color: var(--color-text-primary);
}
.account-balance {
  font-size: var(--text-number);
  font-weight: 600;
}
```

---

## 4. 预设主题方案

### 4.1 行业与品牌分析

> **FIRE = Financial Independence, Retire Early（财务独立，提早退休）**
>
> 品牌关键词：财务安全感、理性自律、长期主义、成长自由、简约高效。
>
> 参考行业：理财类 App（Mint/YNAB/随手记）、银行类、效率工具类。

| 分析维度 | 结论 |
|---|---|
| 理财 App 主流 | 绿色/蓝绿色系为主（Mint 绿、YNAB 蓝绿、支付宝蓝）→ 传达安全与增长 |
| 银行/金融 | 深蓝色系为主（招商红、工商蓝）→ 传达信任与稳重 |
| 效率/工具 | 中性色 + 一个强调色（Notion、Linear）→ 专注不抢眼 |
| 本项目调性 | FIRE 追求的不是炫酷，是**冷静、理性、克制、长期** |

### 4.2 三套预设主题

#### 主题 1：Teal 稳重蓝绿（默认推荐）

> 设计理念：绿色象征财富增长与生命力，蓝调带来冷静克制感。
> 与 FIRE「长期积累 → 财务自由」理念最契合。

| Token | 色值 |
|---|---|
| `--color-primary` | `#0D9488` |
| `--color-primary-light` | `#E6F7F5` |
| `--color-primary-dark` | `#0B7A70` |
| `--color-bg-page` | `#F5F7FA` |
| `--color-bg-card` | `#FFFFFF` |
| `--color-text-primary` | `#1E293B` |
| `--color-text-secondary` | `#94A3B8` |
| `--color-text-tertiary` | `#CBD5E1` |
| `--color-text-inverse` | `#FFFFFF` |
| `--color-border` | `#E2E8F0` |
| `--color-border-light` | `#F1F5F9` |
| `--color-success` | `#10B981` |
| `--color-danger` | `#EF4444` |
| `--color-warning` | `#F59E0B` |
| `--color-wechat` | `#07C160` |
| `--color-info` | `#3B82F6` |
| `--color-mask` | `rgba(0, 0, 0, 0.5)` |

#### 主题 2：Deep Blue 深邃蓝

> 设计理念：经典金融蓝色系，传达专业、信任、稳重。
> 适合偏好传统金融 App 风格的用户。

| Token | 色值 |
|---|---|
| `--color-primary` | `#2563EB` |
| `--color-primary-light` | `#EFF6FF` |
| `--color-primary-dark` | `#1D4ED8` |
| `--color-bg-page` | `#F8FAFC` |
| `--color-bg-card` | `#FFFFFF` |
| 其余与 Teal 主题相同 | 同上 |

#### 主题 3：Warm Amber 暖琥珀

> 设计理念：温暖的琥珀色调，减少金融 App 的冰冷感，增添人情味。
> 适合偏好柔和体验的用户。

| Token | 色值 |
|---|---|
| `--color-primary` | `#D97706` |
| `--color-primary-light` | `#FFF7ED` |
| `--color-primary-dark` | `#B45309` |
| `--color-bg-page` | `#FFFBEB` |
| `--color-bg-card` | `#FFFFFF` |
| 其余与 Teal 主题相同 | 同上 |

---

## 5. 用户自定义主题功能

### 5.1 功能入口

```
我的 → 主题设置（新增菜单项）
```

### 5.2 页面结构

```
┌── 主题设置 ──────────────┐
│                          │
│  预设主题                │
│  ┌─────┐ ┌─────┐ ┌─────┐│
│  │Teal │ │蓝色 │ │琥珀 ││
│  │    │ │     │ │     ││  ← 点击即切换
│  └─────┘ └─────┘ └─────┘│
│                          │
│  自定义颜色              │
│  ┌────────────────────┐ │
│  │ 主色    ●───────   │ │  ← 点击弹出取色器
│  │ 页面背景 ●───────  │ │
│  │ 卡片背景 ●───────  │ │
│  │ 主文字   ●───────  │ │
│  │ 次文字   ●───────  │ │
│  │ 成功色   ●───────  │ │
│  │ 危险色   ●───────  │ │
│  └────────────────────┘ │
│                          │
│  [ 恢复默认 ]           │
└──────────────────────────┘
```

### 5.3 交互逻辑

1. 点击预设主题卡片 → 全量替换为对应色值 → 即时生效
2. 点击自定义颜色行 → 弹出系统取色器或 HEX 输入框 → 即时生效
3. 修改任意颜色后，「预设主题」选中状态自动取消（标记为「自定义」）
4. 「恢复默认」按钮 → 重置为默认 Teal 主题
5. 所有修改保存到 `localStorage`，下次启动自动应用

### 5.4 技术方案

```
localStorage
  ├── fire_theme_mode: 'preset' | 'custom'
  ├── fire_theme_preset: 'teal' | 'blue' | 'amber'
  └── fire_theme_custom: { [token]: '#xxxxxx', ... }  // 仅 custom 模式时有效

App.vue onLaunch:
  1. 读取 localStorage
  2. 计算出 18 个 token 的实际色值（预设优先，自定义覆盖）
  3. 设置 document.documentElement.style.setProperty('--color-xxx', value)
  4. 所有组件通过 var(--color-xxx) 引用，自动生效
```

### 5.5 实现注意事项

- `uni.scss` 不再直接硬编码色值，改为引用 CSS 变量
- 微信按钮色（`#07C160`）保持固定，不纳入自定义范围
- 颜色变更后不需重启小程序，页面实时刷新
- 取色器在小程序端用 `<input type="color">` 的 picker 替代

---

## 6. 实施路径

| 阶段 | 内容 | 涉及文件 |
|---|---|---|
| Phase 1 | 创建 `src/theme/` 目录，定义 CSS 变量 + 预设 | `theme/variables.css` `theme/presets.ts` `theme/index.ts` |
| Phase 2 | 全项目颜色硬编码 → `var(--color-xxx)` 迁移 | 约 15 个 `.vue` 文件 |
| Phase 3 | 新增「我的 → 主题设置」页面 | `pages/my/theme-settings.vue` + 路由 |
| Phase 4 | 注册页 color 迁移（`#00BFFF` → `var(--color-primary)`） | `register.vue` |

---

## 7. 产品决策记录

| 决策 | 结论 | 理由 |
|---|---|---|
| Token 数量 | 18 个 | 覆盖所有场景，不过度设计 |
| 用户可自定义哪些颜色 | 全部 18 个 | 最大化自由度，但提供 3 个预设免去选择困难 |
| 微信按钮色是否可变 | 不可变 | `#07C160` 是微信品牌色，修改违反平台规范 |
| 旧 `#00BFFF` 怎么处理 | 作为「Deep Blue」预设主题保留 | 满足偏好小米汽车蓝的用户 |
| 默认主题 | Teal `#0D9488` | 与 FIRE 理念最契合，行业验证最多 |
