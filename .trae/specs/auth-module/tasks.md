# 注册登录模块 - 开发任务清单

## 前端任务 (zgj-front)

### 1. 环境配置
- [ ] 创建 `.env.development` 配置文件
- [ ] 创建 `.env.test` 配置文件
- [ ] 创建 `.env.production` 配置文件
- [ ] 配置 Vite 加载环境变量
- [ ] 创建 `src/config/index.ts` 统一导出配置
- [ ] 创建 `src/api/request.ts` 请求封装（自动携带 Token）

### 2. 状态管理
- [ ] 安装 Pinia（如未安装）
- [ ] 创建 `src/stores/user.ts` 用户状态 Store
- [ ] 实现 Token 持久化逻辑
- [ ] 实现自动登录校验逻辑

### 3. 页面开发 - 启动广告页
- [ ] 创建 `src/pages/splash/index.vue`
- [ ] 实现全屏广告图片展示
- [ ] 实现倒计时功能（3秒）
- [ ] 实现「跳过」按钮
- [ ] 实现跳转逻辑（有 Token 进首页，无 Token 进登录页）
- [ ] 配置 pages.json 路由

### 4. 页面开发 - 登录页
- [ ] 改造 `src/pages/login/index.vue`
- [ ] 实现 Tab 切换（密码登录/验证码登录）
- [ ] 实现手机号输入（带格式校验）
- [ ] 实现密码输入（显示/隐藏切换）
- [ ] 实现验证码输入 + 60秒倒计时
- [ ] 实现登录按钮（带 loading 状态）
- [ ] 实现微信登录按钮
- [ ] 实现「忘记密码」和「注册账号」跳转
- [ ] 实现用户协议勾选
- [ ] 对接登录接口
- [ ] 对接微信登录接口

### 5. 页面开发 - 注册页
- [ ] 创建 `src/pages/register/index.vue`
- [ ] 实现手机号输入
- [ ] 实现验证码输入 + 60秒倒计时
- [ ] 实现密码输入 + 确认密码
- [ ] 实现昵称输入（选填）
- [ ] 实现注册按钮（带 loading 状态）
- [ ] 实现用户协议勾选
- [ ] 实现返回登录页
- [ ] 对接注册接口
- [ ] 配置 pages.json 路由

### 6. API 封装
- [ ] 创建 `src/api/auth.ts`
- [ ] 封装发送短信验证码接口
- [ ] 封装注册接口
- [ ] 封装登录接口
- [ ] 封装获取用户信息接口
- [ ] 封装退出登录接口
- [ ] 创建 `src/api/ads.ts`
- [ ] 封装获取启动广告接口

### 7. 工具函数
- [ ] 创建 `src/utils/validate.ts` 手机号/密码校验
- [ ] 创建 `src/utils/storage.ts` 本地存储封装
- [ ] 创建 `src/utils/countdown.ts` 倒计时工具

---

## 后端任务 (zgj-back)

### 1. 数据库
- [ ] 创建 `SmsCode` Entity (sms_codes 表)
- [ ] 创建 `Ad` Entity (ads 表)
- [ ] 更新 `User` Entity（如有需要）
- [ ] 运行数据库迁移/同步

### 2. 短信验证码模块
- [ ] 创建 `src/service/sms.service.ts`
- [ ] 实现生成验证码逻辑
- [ ] 实现发送验证码逻辑（Mock 版本）
- [ ] 实现验证码校验逻辑
- [ ] 实现发送频率限制
- [ ] 创建 `src/controller/sms.controller.ts`
- [ ] 实现 `POST /api/auth/send-sms` 接口

### 3. 认证模块完善
- [ ] 更新 `src/service/auth.service.ts`
- [ ] 完善注册逻辑（支持手机号 + 验证码）
- [ ] 完善登录逻辑（支持验证码登录）
- [ ] 新增退出登录逻辑
- [ ] 更新 `src/controller/auth/auth.controller.ts`
- [ ] 新增 `POST /api/auth/logout` 接口
- [ ] 完善 `POST /api/auth/register` 接口
- [ ] 完善 `POST /api/auth/login` 接口

### 4. 广告模块
- [ ] 创建 `src/service/ad.service.ts`
- [ ] 实现获取启动广告逻辑
- [ ] 创建 `src/controller/ad.controller.ts`
- [ ] 实现 `GET /api/ads/splash` 接口

### 5. 配置
- [ ] 更新 `src/config/config.default.ts`（如有需要）
- [ ] 添加短信服务配置预留
- [ ] 添加微信登录配置预留

---

## 联调测试
- [ ] 前端 + 后端联调
- [ ] 测试注册流程
- [ ] 测试登录流程（密码/验证码/微信）
- [ ] 测试启动广告
- [ ] 测试自动登录
- [ ] 测试退出登录
- [ ] 测试 Token 过期处理
