# 注册页面
> 文件：`register.md` | 中文名称：注册页面 | 所属模块：登录注册
> pages.json 路由：`pages/login/register`（文件系统路径：`src/pages/login/register.vue`）
> 上级页面路由：`pages/login/login`（文件系统路径：`src/pages/login/login.vue`）

> 版本：v1.3 | 状态：已完成 | 最后更新：2026-05-24

## 版本历史
| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v1.3 | 2026-05-24 | 状态更新：功能已全部实现（手机号注册 + 微信注册 + 协议弹窗） | AI |
| v1.2 | 2026-05-23 | 验证码安全增强：后端生成验证码存储数据库，通过 Spug API 发送短信，前端不再返回验证码明文；注册流程安全加固 | AI |
| v1.1 | 2026-05-23 | 新增用户协议/隐私政策弹窗展示；新增微信一键注册（小程序/App/H5全端适配）；补全全部错误 Toast 提示 | AI |
| v1.0 | 2026-05-23 | 初始版本：注册页面需求文档 | AI |

---

## 一、功能概述

注册页面是用户创建新账号的入口。用户从登录页点击"注册账号"进入本页。页面提供**两种注册方式**：

1. **手机号注册**：输入手机号 → 获取短信验证码 → 设置密码并确认 → 可选填写昵称 → 勾选用户协议 → 点击注册。
2. **微信一键注册**：点击微信注册按钮 → 调起微信授权 → 获取微信手机号 → 自动完成注册。

注册成功后自动登录并跳转至首页。用户协议和隐私政策支持点击查看完整内容（弹窗展示）。

### 行业对标

| 功能 | 行业标准 | 当前实现 | 规划 |
|------|---------|--------|------|
| 手机号注册 |  行业标配 |  已实现 | — |
| 短信验证码 |  行业标配 |  已实现 | — |
| 密码强度校验（6-20位） |  常见 |  已实现 | — |
| 确认密码 |  安全标配 |  已实现 | — |
| 用户协议确认（含可查看） |  合规标配 |  已实现 | — |
| 注册后自动登录 |  体验优化 |  已实现 | — |
| 微信一键注册 |  国内常见 |  已实现 | — |
| 错误提示 Toast |  体验标配 |  已实现 | — |

---

## 二、用户故事

1. **作为新用户**，我希望能通过手机号和验证码快速注册账号，无需记忆复杂的注册信息。
2. **作为新用户**，我希望能设置一个安全密码，系统应提示我密码长度要求（6-20位）。
3. **作为新用户**，我希望能确认密码无误，防止因手误导致后续无法登录。
4. **作为新用户**，我希望注册成功后能自动登录，无需再次输入账号密码，直接进入应用开始使用。
5. **作为用户**，我在注册前需要阅读并同意用户协议和隐私政策，保障我的知情权。我可以点击协议/政策名称查看完整内容。
6. **作为新用户**，我希望使用微信一键注册，无需手动填写手机号和密码，快速完成注册。

---

## 三、交互设计

### 3.1 页面结构

```
注册页面
┌────────────────────────────────────┐
│  ←               注册账号           │  ← 自定义导航栏
├────────────────────────────────────┤
│                                    │
│  ┌──────────────────────────────┐  │
│  │ 手机号                        │  │  ← input（数字键盘，max 11位）
│  ├──────────────────────────────┤  │
│  │ 验证码            [获取验证码] │  │  ← input（数字，max 6位）+ 发送按钮
│  ├──────────────────────────────┤  │
│  │ 设置密码（6-20位）     [显示]  │  │  ← password input + 显示/隐藏切换
│  ├──────────────────────────────┤  │
│  │ 确认密码                      │  │  ← password input
│  ├──────────────────────────────┤  │
│  │ 昵称（选填）                   │  │  ← input（文本）
│  ├──────────────────────────────┤  │
│  │                                │  │
│  │  我已阅读并同意               │  │  ← checkbox
│  │   《用户协议》和《隐私政策》    │  │  ← 可点击链接（蓝色文字，打开弹窗）
│  │                                │  │
│  ├──────────────────────────────┤  │
│  │         [ 注  册 ]            │  │  ← 主按钮（蓝色圆角，disabled态灰）
│  ├──────────────────────────────┤  │
│  │      已有账号？立即登录         │  │  ← 跳转登录页链接
│  ├──────────────────────────────┤  │
│  │           或                   │  │  ← 分隔文字
│  ├──────────────────────────────┤  │
│  │   [ 微信图标 ] 微信一键注册    │  │  ← 微信注册按钮（var(--color-wechat)）
│  └──────────────────────────────┘  │
│                                    │
└────────────────────────────────────┘
```

### 3.2 表单字段明细

| 序号 | 字段名 | 类型 | 必填 | 校验规则 | 说明 |
|------|--------|------|------|---------|------|
| 1 | 手机号 | number input |  | 11位，`/^1[3-9]\d{9}$/` | 数字键盘 |
| 2 | 验证码 | number input |  | 6位数字，`/^\d{6}$/` | 60s倒计时防重复发送 |
| 3 | 设置密码 | password input |  | 6-20位字符，`validatePassword` | 支持显示/隐藏切换 |
| 4 | 确认密码 | password input |  | 与密码一致 | 实时对比校验 |
| 5 | 昵称 | text input |  | 无 | 选填字段 |
| 6 | 协议确认 | checkbox |  | 必须勾选 | 未勾选时注册按钮不可用 |

### 3.3 用户协议 / 隐私政策弹窗

点击"《用户协议》"或"《隐私政策》"蓝色文字链接时，弹出底部 Sheet 弹窗展示完整协议/政策内容。

```
点击链接 → 弹窗打开
┌────────────────────────────────────┐
│          用户协议 / 隐私政策        │  ← 标题
├────────────────────────────────────┤
│                                    │
│  （可滚动内容区域）                  │
│                                    │
│   ...完整的协议/政策文本...          │
│                                    │
├────────────────────────────────────┤
│           [ 关  闭 ]               │  ← 关闭按钮（蓝色）
└────────────────────────────────────┘
```

**交互规则**：
- 弹窗从底部滑入（Sheet 风格），高度占屏幕 60%~80%
- 标题区分"用户协议"和"隐私政策"
- 内容区域可滚动
- 点击"关闭"按钮或蒙层关闭弹窗
- 弹窗不影响表单的 checkbox 勾选状态（独立于注册表单）

**数据结构**：
```typescript
// 弹窗控制
const showAgreementPopup = ref(false)       // 是否显示协议弹窗
const agreementType = ref<'user' | 'privacy'>('user')  // 协议类型
const agreementTitle = computed(() => agreementType.value === 'user' ? '用户协议' : '隐私政策')

// 协议内容（静态文本，从 config 或独立文件读取）
const userAgreementContent = `...用户协议全文...`
const privacyPolicyContent = `...隐私政策全文...`
const currentAgreementContent = computed(() => agreementType.value === 'user' ? userAgreementContent : privacyPolicyContent)

// 打开弹窗
const openAgreement = (type: 'user' | 'privacy') => {
  agreementType.value = type
  showAgreementPopup.value = true
}
```

### 3.4 验证码发送流程

```
用户点击[获取验证码]
  │
  ├─ 前端校验手机号格式 → 不通过 → Toast"请输入正确的手机号"
  │
  ├─ 校验是否在倒计时中 → 是 → 忽略点击
  │
  └─ 调用 POST /auth/send-sms { phone, type: 'register' }
       │
       │  【后端处理】
       │  ├─ 校验发送频率（60秒内不可重复发送）
       │  ├─ 校验每日上限（单日最多100条）
       │  ├─ 生成6位随机验证码 → 存入 sms_codes 表（手机号、验证码、类型、过期时间）
       │  ├─ 通过 Spug API（SPUG_PUSH_URL）发送短信至用户手机
       │  └─ 响应：{ success: true, message: '验证码已发送' }（ 不返回验证码）
       │
       ├─ 成功 → Toast"验证码已发送" → 启动60s倒计时
       │
       └─ 失败 → 展示后端错误信息（如"发送太频繁，请稍后再试"）
```

#### 验证码存储与验证

| 环节 | 说明 |
|------|------|
| 生成 | 后端随机生成6位数字验证码 |
| 存储 | 存入 `sms_codes` 表（phone、code、type、expires_at、used） |
| 发送 | 通过 Spug API（`POST {SPUG_PUSH_URL}`）发送短信 |
| 有效期 | 5分钟，过期后验证失败 |
| 使用后 | `used` 标记为 `true`，不可复用 |
| 安全性 | 验证码全程不出现在前端响应中，仅通过短信到达用户手机 |

### 3.5 注册提交流程

```
用户点击[注册]
  │
  ├─ 前置校验（全部通过才可点击）
  │   ├─ 协议已勾选
  │   ├─ 手机号格式正确
  │   ├─ 验证码已填写（6位）
  │   ├─ 密码格式正确（6-20位）
  │   └─ 两次密码一致
  │
  ├─ loading态 → 按钮显示"注册中..."
  │
  └─ 调用 register({ phone, code, password, nickname })
       │
       ├─ 成功 → setAuth(token, user) → Toast"注册成功"
       │         → 1s后 switchTab 跳转首页 /pages/detail/index
       │
       └─ 失败 → 展示错误信息（"注册失败：{message}"） → loading恢复
```

### 3.6 微信一键注册流程

```
用户点击[微信一键注册]
  │
  ├─ 调用 uni.login() 获取微信授权 code
  │   │
  │   ├─ 失败 → Toast"微信授权失败，请重试"
  │   │
  │   └─ 成功 → 调用微信注册 API
  │         │
  │         ├─ 调用 wechatRegister({ code })
  │         │   │
  │         │   ├─ 成功 → setAuth(token, user) → Toast"注册成功"
  │         │   │         → 1s后 switchTab 跳转首页
  │         │   │
  │         │   └─ 失败 → 展示错误信息
  │         │
  │         └─ （若微信注册 API 需要绑定手机号）
  │               → 调起微信手机号授权 → 调用 wechatRegister({ code, phone })
```

### 3.7 页面跳转

| 触发操作 | 目标页面 | 跳转方式 | 说明 |
|---------|---------|---------|------|
| 点击"←"返回 | 登录页 | `navigateBack` | 失败时 fallback 到 `/pages/login/login` |
| 点击"立即登录" | 登录页 | `navigateBack` | 失败时 fallback 到 `/pages/login/login` |
| 点击"《用户协议》" | 当前页弹窗 | `set showAgreementPopup = true` | 底部 Sheet 弹窗，标题"用户协议" |
| 点击"《隐私政策》" | 当前页弹窗 | `set showAgreementPopup = true` | 底部 Sheet 弹窗，标题"隐私政策" |
| 注册成功（手机号） | 首页 | `switchTab` | `url: '/pages/detail/index'` |
| 注册成功（微信） | 首页 | `switchTab` | `url: '/pages/detail/index'` |

---

## 四、UI 规范

### 4.1 颜色

注册页颜色遵循项目统一主题 Token 体系（详见 `theme-settings/theme.md`）：

| 元素 | CSS Variable | 说明 |
|------|------|------|
| 主色调 | `var(--color-primary)` | 发送验证码按钮文字+边框、注册按钮背景、链接文字、checkbox选中色 |
| 微信品牌色 | `var(--color-wechat)` | 微信注册按钮背景（品牌色固定） |
| 按钮禁用 | `var(--color-text-tertiary)` | 注册按钮 disabled 背景、发送按钮 disabled 文字+边框 |
| 背景色 | `var(--color-bg-page)` | 页面整体背景 |
| 卡片背景 | `var(--color-bg-card)` | 表单区域背景 |
| 主文字 | `var(--color-text-primary)` | 标题、按钮文字、弹窗标题 |
| 辅助文字 | `var(--color-text-secondary)` | 协议文本（非链接部分）、登录跳转提示、分割线"或" |
| 次要文字 | `var(--color-text-secondary)` | 密码显示/隐藏按钮 |
| 分割线 | `var(--color-border)` | 输入项底部分割线 |
| 弹窗背景 | `var(--color-bg-card)` | 协议弹窗背景 |
| 弹窗蒙层 | `var(--color-mask)` | 协议弹窗蒙层 |

### 4.2 字体与尺寸

| 元素 | 字号 | 字重 | 说明 |
|------|------|------|------|
| 页面标题 | `36rpx` | `bold` | "注册账号" |
| 输入框文字 | `30rpx` | `normal` | 5个输入字段 |
| 发送验证码按钮 | `26rpx` | `normal` | "获取验证码" / 倒计时 |
| 显示/隐藏按钮 | `26rpx` | `normal` | "显示"/"隐藏" |
| 协议文本 | `24rpx` | `normal` | checkbox所在行（非链接部分） |
| 协议链接 | `24rpx` | `normal` | "《用户协议》""《隐私政策》"蓝色文字 |
| 注册按钮 | `32rpx` | `bold` | 白色文字 |
| 微信注册按钮 | `32rpx` | `bold` | 白色文字 |
| 分隔文字"或" | `26rpx` | `normal` | 灰色居中 |
| 底部跳转链接 | `26rpx` | `normal` | "已有账号？立即登录" |
| 返回按钮 | `48rpx` | `normal` | "←" 箭头 |
| 弹窗标题 | `32rpx` | `bold` | "用户协议" / "隐私政策" |
| 弹窗内容 | `28rpx` | `normal` | 协议/政策正文 |
| 弹窗关闭按钮 | `30rpx` | `normal` | "关闭" |

### 4.3 间距与布局

| 区域 | 规格 | 说明 |
|------|------|------|
| 导航栏内边距 | `padding: 40rpx 30rpx` | 顶部导航区域 |
| 表单卡片外边距 | `margin: 40rpx 30rpx` | 白色卡片与屏幕边缘 |
| 表单卡片内边距 | `padding: 40rpx` | 卡片内部 |
| 输入项垂直间距 | `padding: 24rpx 0` | 各输入项之间 |
| 协议区域间距 | `padding: 32rpx 0` | 协议checkbox上边距 |
| 注册按钮下边距 | `margin-bottom: 40rpx` | 按钮与底部链接间距 |
| 分隔文字间距 | `margin: 30rpx 0` | "或"上下间距 |
| 微信按钮间距 | `margin-bottom: 20rpx` | 微信按钮与底部链接间距 |
| 卡片圆角 | `border-radius: 24rpx` | 表单卡片 |
| 按钮圆角 | `border-radius: 50rpx` | 注册按钮、微信注册按钮 |
| 发送按钮圆角 | `border-radius: 8rpx` | 获取验证码按钮 |
| 弹窗圆角（顶部） | `border-radius: 24rpx 24rpx 0 0` | 协议弹窗顶部 |
| 弹窗内边距 | `padding: 30rpx` | 协议弹窗 |
| 微信图标尺寸 | `36rpx × 36rpx` | 微信注册按钮内的图标 |

### 4.4 状态样式

| 状态 | 表现 |
|------|------|
| 注册按钮可用 | 背景 `var(--color-primary)`，`var(--color-text-inverse)` 文字，可点击 |
| 注册按钮禁用 | 背景 `var(--color-text-tertiary)`，不可点击（条件：未勾选协议、手机号/验证码/密码校验未通过、两次密码不一致） |
| 微信注册按钮 | 背景 `var(--color-wechat)`，`var(--color-text-inverse)` 文字，微信图标 + "微信一键注册"，始终可点击 |
| 发送验证码可用 | 文字 `var(--color-primary)`，边框 `1px solid var(--color-primary)` |
| 发送验证码倒计时 | 文字 `var(--color-text-tertiary)`，边框 `1px solid var(--color-text-tertiary)`，显示 `Xs` |
| 注册中 loading | 按钮文字变为"注册中..."，不可重复点击 |
| 协议弹窗显示 | 从底部滑入，蒙层变暗，内容区域可滚动 |

---

## 五、数据流

### 5.1 API 接口

| 接口 | 方法 | 端点 | 参数 | 返回 |
|------|------|------|------|------|
| 发送验证码 | POST | `/auth/send-sms` | `{ phone, type: 'register' }` | `{ success, data, message }` |
| 手机号注册 | POST | `/auth/register` | `{ phone, code, password, nickname? }` | `{ success, data: { token, user }, message }` |
| 微信注册 | POST | `/auth/wechat-register` | `{ code, phone? }` | `{ success, data: { token, user }, message }` |

### 5.2 状态管理

```
注册成功（手机号/微信） → useUserStore().setAuth(token, user)
                       → token 存入本地存储
                       → user 信息写入 store
```

### 5.3 校验工具

| 函数 | 规则 | 来源 |
|------|------|------|
| `validatePhone(phone)` | `/^1[3-9]\d{9}$/` | `src/utils/validate.ts` |
| `validatePassword(password)` | 长度 6-20 位 | `src/utils/validate.ts` |
| `validateCode(code)` | `/^\d{6}$/` | `src/utils/validate.ts` |
| 自定义倒计时 | 60s，返回 `{ count, isCounting, start }` | `src/utils/countdown.ts` |

### 5.4 微信 SDK 调用

```typescript
// uni-app 微信登录
uni.login({
  provider: 'weixin',
  success: (res) => {
    // res.code 传递给后端换取 openid / unionid
    wechatRegister({ code: res.code })
  },
  fail: () => {
    uni.showToast({ title: '微信授权失败，请重试', icon: 'none' })
  }
})
```

---

## 六、状态处理

### 6.1 页面状态

| 状态 | 触发条件 | UI表现 |
|------|---------|--------|
| 默认态 | 页面加载完成 | 所有输入框为空，按钮 disabled |
| 填写中 | 用户输入 | `canRegister` computed 实时计算按钮可用性 |
| 发送中 | 调用 sendSmsCode | 发送按钮进入倒计时（当前无独立loading） |
| 注册中 | 调用 register | 按钮显示"注册中..."，`loading = true` |
| 注册成功 | API 返回成功 | Toast "注册成功" → 1s后跳转首页 |
| 注册失败 | API 返回错误 | loading 恢复 + Toast 展示错误信息 |
| 微信登录中 | 调用 uni.login | 微信按钮显示"登录中..."，`wxLoading = true` |
| 微信登录失败 | 微信授权拒绝或接口失败 | Toast 展示错误信息 + loading 恢复 |
| 协议弹窗打开 | 点击协议/政策链接 | 底部 Sheet 滑入 |
| 协议弹窗关闭 | 点击关闭/蒙层 | 底部 Sheet 滑出 |

### 6.2 异常处理

| 异常场景 | 处理方式 |
|---------|---------|
| 验证码发送失败 | Toast 展示后端返回的 message（如"发送失败，请稍后重试"） |
| 注册接口失败 | Toast 展示后端返回的 message（如"该手机号已注册"、"验证码错误"） |
| 手机号已注册 | Toast 展示"该手机号已注册"，引导用户前往登录 |
| 验证码错误 | Toast 展示"验证码错误，请重新输入" |
| switchTab 首页不存在 | 确认 `/pages/detail/index` 已注册为 tabBar 页面 |
| 微信授权被拒绝 | Toast 展示"微信授权已取消" |
| 微信注册接口失败 | Toast 展示后端返回的 message（如"微信注册失败，请使用手机号注册"） |
| 网络超时 | Toast 展示"网络异常，请检查网络后重试" |

---

## 七、边界条件

| 场景 | 预期行为 |
|------|---------|
| 手机号不足11位 | 验证码按钮不可点击（`validatePhone` 返回 false） |
| 手机号非1开头 | 验证码按钮不可点击 |
| 验证码倒计时未结束 | 再次点击忽略（`isCounting` 为 true） |
| 密码不足6位 | 注册按钮 disabled |
| 密码超过20位 | 注册按钮 disabled |
| 两次密码不一致 | 注册按钮 disabled |
| 未勾选协议 | 注册按钮 disabled |
| 昵称为空 | 可正常注册（选填字段） |
| 快速双击注册按钮 | `loading = true` 防重复提交 |
| 注册成功后快速返回 | 已通过 `setTimeout 1s` + `switchTab` 确保跳转 |
| 直接从注册页返回（无历史栈） | `goBack`/`goToLogin` 均带 `fail` fallback 跳转至登录页 |
| 微信注册中重复点击 | `wxLoading = true` 防重复提交 |
| 协议弹窗打开时页面滚动 | 弹窗打开时禁止底层页面滚动，仅弹窗内容可滚动 |

---

## 八、技术实现

### 8.1 技术栈

- 框架：Vue 3 + Composition API (`<script setup lang="ts">`)
- 平台：uni-app（微信小程序为主）
- 状态管理：Pinia（`useUserStore`）
- API 层：`src/api/auth.ts`

### 8.2 关键依赖

```typescript
import { ref, computed } from 'vue'
import { useUserStore } from '../../stores/user'
import { validatePhone, validatePassword, validateCode } from '../../utils/validate'
import { useCountdown } from '../../utils/countdown'
import { sendSmsCode, register, wechatRegister } from '../../api/auth'
```

### 8.3 核心变量

| 变量 | 类型 | 初始值 | 说明 |
|------|------|--------|------|
| `phone` | `ref<string>` | `''` | 手机号 |
| `code` | `ref<string>` | `''` | 验证码 |
| `password` | `ref<string>` | `''` | 密码 |
| `confirmPassword` | `ref<string>` | `''` | 确认密码 |
| `nickname` | `ref<string>` | `''` | 昵称（选填） |
| `showPassword` | `ref<boolean>` | `false` | 密码显示/隐藏 |
| `agreed` | `ref<boolean>` | `false` | 协议勾选 |
| `loading` | `ref<boolean>` | `false` | 手机号注册提交中 |
| `wxLoading` | `ref<boolean>` | `false` | 微信注册登录中 |
| `showAgreementPopup` | `ref<boolean>` | `false` | 协议弹窗显示状态 |
| `agreementType` | `ref<'user' \| 'privacy'>` | `'user'` | 当前展示的协议类型 |
| `userAgreementContent` | `string` | — | 用户协议全文（静态文本） |
| `privacyPolicyContent` | `string` | — | 隐私政策全文（静态文本） |
| `canRegister` | `computed<boolean>` | — | 按钮可用性（协议+手机号+验证码+密码+确认一致） |
| `agreementTitle` | `computed<string>` | — | 弹窗标题（"用户协议" / "隐私政策"） |
| `currentAgreementContent` | `computed<string>` | — | 弹窗当前展示的协议内容 |

### 8.4 文件路径

| 文件 | 路径 |
|------|------|
| 注册页面 | `src/pages/login/register.vue` |
| 登录页面 | `src/pages/login/login.vue` |
| API 接口 | `src/api/auth.ts` |
| 校验工具 | `src/utils/validate.ts` |
| 倒计时工具 | `src/utils/countdown.ts` |
| 状态管理 | `src/stores/user.ts` |
| 路由配置 | `src/pages.json`（路由 `pages/login/register`） |
| 设计稿 | `designs/my/login/register.pen` |
| 微信图标 | `static/icons/wechat.svg` 或内置组件 |

---

## 九、测试要点

### 9.1 功能测试

| 编号 | 测试用例 | 预期结果 |
|------|---------|---------|
| TC-R-01 | 输入正确手机号，点击获取验证码 | 发送成功，按钮开始60s倒计时 |
| TC-R-02 | 手机号格式错误，点击获取验证码 | 不发送，按钮不可点击 |
| TC-R-03 | 倒计时未结束，再次点击获取验证码 | 忽略点击 |
| TC-R-04 | 所有必填项正确填写+勾选协议，点击注册 | 注册成功，自动登录，跳转首页 |
| TC-R-05 | 两次密码不一致，点击注册 | 按钮 disabled，不可点击 |
| TC-R-06 | 未勾选协议，点击注册 | 按钮 disabled，不可点击 |
| TC-R-07 | 密码不足6位，点击注册 | 按钮 disabled，不可点击 |
| TC-R-08 | 昵称为空，其他项正确，点击注册 | 可正常注册（选填） |
| TC-R-09 | 点击"显示/隐藏" | 密码字段切换明文/密文 |
| TC-R-10 | 点击"←"返回 | navigateBack 回登录页 |
| TC-R-11 | 点击"立即登录" | navigateBack 回登录页 |
| TC-R-12 | 点击"《用户协议》"链接 | 弹出底部 Sheet，标题"用户协议"，展示完整内容 |
| TC-R-13 | 点击"《隐私政策》"链接 | 弹出底部 Sheet，标题"隐私政策"，展示完整内容 |
| TC-R-14 | 在协议弹窗中点击"关闭" | 弹窗关闭，checkbox 状态不变 |
| TC-R-15 | 在协议弹窗中点击蒙层 | 弹窗关闭，checkbox 状态不变 |
| TC-R-16 | 点击"微信一键注册" | 调起微信授权 → 注册成功 → 自动登录 → 跳转首页 |

### 9.2 异常测试

| 编号 | 测试用例 | 预期结果 |
|------|---------|---------|
| TC-R-E01 | 验证码发送失败 | Toast 展示错误信息，倒计时不启动 |
| TC-R-E02 | 手机号已注册 | Toast 展示"该手机号已注册" |
| TC-R-E03 | 验证码错误 | Toast 展示"验证码错误，请重新输入" |
| TC-R-E04 | 注册接口超时 | loading 恢复，Toast 展示"网络异常" |
| TC-R-E05 | 微信授权被拒绝 | Toast 展示"微信授权已取消" |
| TC-R-E06 | 微信注册接口失败 | Toast 展示错误信息，引导使用手机号注册 |
| TC-R-E07 | 协议弹窗打开状态下切换页面 | 弹窗正常关闭 |

---

## 十、附录

### 10.1 与登录页的关系

注册页与登录页共享：
- 相同的 UI 风格（主题 Token 体系、统一背景与卡片配色）
- 相同的校验工具（`validatePhone`、`validatePassword`、`validateCode`）
- 相同的倒计时工具（`useCountdown`）
- 相同的 API 基址（`sendSmsCode` 共用端点，通过 `type` 参数区分）
- 微信一键登录/注册可在两个页面复用

### 10.2 后续优化建议

1. **密码强度指示器**：实时显示密码强度（弱/中/强）
2. **邮箱注册**：增加邮箱+验证码注册方式
3. **注册引导**：注册成功后展示新手引导步骤
4. **微信绑定手机号**：微信注册后如未获取手机号，引导用户绑定手机号以完善账号安全
5. **协议内容动态加载**：协议内容从后端 API 获取，支持运营后台更新