# 新用户注册默认配置需求文档
> 文件：`new-user-default-config.md` | 中文名称：新用户注册默认配置清单 | 所属模块：系统配置
> 版本：v1.2 | 状态：设计中 | 最后更新：2026-05-24

## 版本历史

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v1.2 | 2026-05-24 | 子分类优化：45→46（38支出+8收入）；+-娱乐 +打车/-购物移位/-报销移位/+数码/+保险；社交→聚会聚餐 | AI |
| v1.1 | 2026-05-24 | 分类体系重构：支出/收入大类彻底分离，10 支出大类 + 3 收入大类；数据总量 105→108 | AI |
| v1.0 | 2026-05-24 | 初始版本：梳理新用户 105 条默认数据初始化链路 | AI |

---

## 1. 问题背景

新用户注册后，系统需要为其创建一套完整的默认数据，使其开箱即用。

### 1.1 本期 v1.1 重点：分类体系重构

**现状问题：**
- 现有 10 个大类的支出/收入归属混乱，同一大类（如"职场工作"）下同时混装支出子分类（办公、通讯）和收入子分类（工资、奖金、兼职、报销）
- "兴趣与成长"包含 9 个子分类，过于庞杂
- "形象与消费"命名模糊，"购物"与其他大类产生交叉
- 收入侧缺少独立的大类体系，8 个收入子分类散落在 4 个支出大类下

**重构方案：** 支出/收入大类彻底分离，默认提供 **10 个支出大类 + 3 个收入大类**，每个大类明确标注 `type`（expense/income）。

## 2. 当前注册初始化链路全景

### 2.1 初始化流程

```
用户注册/首次登录
  │
  ├─ 1. 创建 users 记录
  │     ├─ username: user_{timestamp}
  │     ├─ password: bcrypt 加密
  │     ├─ phone: 手机号
  │     ├─ nickname: 昵称或手机号
  │     └─ isActive: true
  │
  ├─ 2. categoryService.initUserCategories(userId)
  │     ├─ 复制 13 个全局分类组 → user_category_groups（10 支出 + 3 收入）
  │     ├─ 复制 45 个全局图标 → user_icons
  │     └─ 复制 45 个全局分类 → user_category_customizations（37 支出 + 8 收入）
  │
  ├─ 3. accountService.createDefaultAccounts(userId)
  │     ├─ 现金 (cash, 默认收支账户)
  │     ├─ 折旧资产 (depreciable_asset)
  │     └─ 固定资产 (fixed_asset)
  │
  └─ 【缺失】4. user_config 初始化 ← 本期补全
```

### 2.2 触发入口

| 入口 | 代码位置 | 说明 |
|---|---|---|
| 注册 | `authService.register()` → [auth.service.ts:76-88](file:///Users/dundao/work_for_fire/firelifes_back/src/service/auth.service.ts#L76-L88) | 验证码注册 |
| 验证码登录（新用户） | `authService.login()` → [auth.service.ts:126-135](file:///Users/dundao/work_for_fire/firelifes_back/src/service/auth.service.ts#L126-L135) | 首次验证码登录自动注册 |
| 微信登录（新用户） | `authService.login()` → [auth.service.ts:195-203](file:///Users/dundao/work_for_fire/firelifes_back/src/service/auth.service.ts#L195-L203) | 首次微信登录自动注册 |

三处都会调用 `initUserCategories` + `createDefaultAccounts`，需统一追加 `user_config` 初始化。

---

## 3. 涉及的全部数据表

### 3.1 用户核心表

| 表名 | 注册时创建 | 记录数 | 说明 |
|---|---|---|---|
| `users` |  | 1 | 用户身份信息 |

### 3.2 分类体系表（全局 → 用户复制）

| 全局表（模版） | 用户表（复制数据） | 记录数 | 说明 |
|---|---|---|---|
| `category_groups` | `user_category_groups` | **13** | 13 个大类（10 支出 + 3 收入，含 type 字段区分） |
| `icons` | `user_icons` | **45** | 45 个 emoji 图标 |
| `categories` | `user_category_customizations` | **45** | 45 个二级分类（37 支出 + 8 收入） |

### 3.3 账户表

| 表名 | 记录数 | 说明 |
|---|---|---|
| `accounts` | **3** | 现金、折旧资产、固定资产 |

### 3.4 【本期新增】用户配置表

| 表名 | 记录数 | 说明 |
|---|---|---|
| `user_configs` | **1**（key=`theme`） | 主题颜色配置 |

### 3.5 待后续初始化的表（本期暂不动）

| 表名 | 状态 | 说明 |
|---|---|---|
| `budgets` | 不初始化 | 新用户无默认预算，需手动创建 |
| `depreciating_assets` | 不初始化 | 用户自行添加资产 |
| `records` | 不初始化 | 用户自行记账 |

---

## 4. 详细默认配置清单

### 4.1 分类组（13 个：10 支出 + 3 收入）

代码定义：[category.service.ts](file:///Users/dundao/work_for_fire/firelifes_back/src/service/category.service.ts#L87-L97)

**支出大类（10 个）：**

| 排序 | 名称 | type | 说明 |
|:---:|---|:---:|---|
| 1 | 饮食消费 | expense | 拆分细致，覆盖日常饮食全场景 |
| 2 | 居家居住 | expense | 住房、居家、维修、快递 |
| 3 | 交通出行 | expense | 交通、汽车 |
| 4 | 服饰美容 | expense | 由「形象与消费」改名，更聚焦 |
| 5 | 学习成长 | expense | 从「兴趣与成长」拆分，独立突出 |
| 6 | 休闲娱乐 | expense | 从「兴趣与成长」拆分，含旅行 |
| 7 | 社交关系 | expense | 社交、礼物、礼金、亲友、宠物 |
| 8 | 健康医疗 | expense | 由「健康与医疗」改名；含运动、健身 |
| 9 | 金融理财 | expense | 投资、彩票等金融类支出 |
| 10 | 其他支出 | expense | 由「其他类型」改名；含日用、捐赠、办公、通讯 |

**收入大类（3 个）：**

| 排序 | 名称 | type | 说明 |
|:---:|---|:---:|---|
| 11 | 薪资报酬 | income | 工资、奖金、兼职、报销 |
| 12 | 投资理财 | income | 投资收入、理财收入 |
| 13 | 其他收入 | income | 礼金收入、其他收入 |

> 注：用户表中 ID 为自增，不固定；`isUserCreated=false` 表示系统默认，`isEnabled=true`。`type` 字段为 v1.1 新增，用于支出/收入大类分离。

### 4.2 支出分类（38 个）

代码定义：[category.service.ts](file:///Users/dundao/work_for_fire/firelifes_back/src/service/category.service.ts#L99-L140)

| 大类 | 支出分类 |
|---|---|
| 饮食消费 | 餐饮、饮料、水果、零食、咖啡 |
| 居家居住 | 住房、居家、维修、快递 |
| 交通出行 | 交通、打车、汽车 |
| 服饰美容 | 服饰、美发、美容 |
| 学习成长 | 书籍、学习 |
| 休闲娱乐 | 电影、音乐、游戏、旅行 |
| 社交关系 | 聚会聚餐、礼物、礼金、亲友、宠物 |
| 健康医疗 | 医疗、运动、健身 |
| 金融理财 | 投资、彩票 |
| 其他支出 | 其他、日用、捐赠、办公、通讯、购物、数码、保险 |

> **v1.2 变更说明：**
> - 交通出行新增「打车」（FIRE 程序员高频场景）
> - 休闲娱乐删除「娱乐」（与电影/音乐/游戏冗余），数量 5→4
> - 社交关系「社交」→「聚会聚餐」（语义更精准）
> - 服饰美容移出「购物」→ 其他支出
> - 其他支出新增「购物」「数码」（复用 iconId=16）「保险」（FIRE 核心需求）

### 4.3 收入分类（8 个）

代码定义：[category.service.ts](file:///Users/dundao/work_for_fire/firelifes_back/src/service/category.service.ts#L140-L148)

| 大类 | 收入分类 |
|---|---|
| 薪资报酬 | 工资、奖金、兼职 |
| 投资理财 | 投资收入、理财 |
| 其他收入 | 礼金收入、其他收入、报销 |

> **v1.2 变更说明：**
> - 薪资报酬移出「报销」（报销不是薪资收入，本质是资金回笼）
> - 其他收入新增「报销」

### 4.4 默认账户（3 个）

代码定义：[account.service.ts](file:///Users/dundao/work_for_fire/firelifes_back/src/service/account.service.ts#L33-L62)

| 名称 | 图标 | 类型 | 初始余额 | 默认支出 | 默认收入 |
|---|---|---|---|---|---|
| 现金 |  | cash | 0 |  |  |
| 折旧资产 |  | depreciable_asset | 0 |  |  |
| 固定资产 |  | fixed_asset | 0 |  |  |

> **设计意图：** 现金为默认收支账户，新用户直接记账。折旧资产和固定资产用于后续资产管家功能。

### 4.5 【本期新增】用户配置（1 条）

写入 `user_configs` 表：

| config_key | config_value |
|---|---|
| `theme` | `{"mode":"preset","presetName":"teal","customColors":{}}` |

> **设计意图：** 新用户默认使用 teal（稳重蓝绿）主题。换设备登录后从服务端拉取，自动应用。

### 4.6 前端默认值（localStorage，本期无需迁移到 DB）

| 配置项 | 默认值 | 存储位置 |
|---|---|---|
| 主题模式 | preset | `fire_theme_mode` |
| 预设主题名 | teal | `fire_theme_preset` |
| 功能入口排序 | bill → asset → fire → cashback | `function_items_order` |

> **说明：** 功能入口排序属于纯 UI 偏好，换设备后恢复默认排序体验可接受，本期不纳入 DB 初始化。

---

## 5. 实现方案

### 5.1 后端改造

**目标：** 在 `authService` 的 3 个新用户创建入口中，统一追加 `user_config` 初始化。

**改动文件：**

| 文件 | 改动 |
|---|---|
| `firelifes_back/src/service/auth.service.ts` | 在 `register()`、`login()`（验证码+微信新用户分支）中，`createDefaultAccounts` 之后新增 `initUserConfig(userId)` 调用 |
| `firelifes_back/src/service/user.service.ts` | 新增 `initUserConfig(userId)` 方法，写入默认 theme 配置 |

**新增方法伪代码：**

```typescript
// user.service.ts
async initUserConfig(userId: number): Promise<void> {
  const existing = await this.userConfigModel.findOne({
    where: { userId, configKey: 'theme' }
  })
  if (existing) return // 已有配置，跳过

  await this.userConfigModel.save({
    userId,
    configKey: 'theme',
    configValue: JSON.stringify({
      mode: 'preset',
      presetName: 'teal',
      customColors: {}
    })
  })
}
```

### 5.2 前端改造

**本期无需改造。** `stores/user.ts` 的 `fetchUserConfig()` 已在上一期实现，新用户注册后登录即可拉取到 `theme` 配置。

**数据流：**

```
注册成功 → 返回 token + user
  → setAuth() → fetchUserConfig()
    → GET /user/config → { theme: { mode: 'preset', presetName: 'teal', ... } }
      → applyConfigTheme() → 页面应用 teal 主题
```

### 5.3 【v1.1 新增】分类体系重构

**目标：** 将 `initUserCategories` 中的默认分类组从 10 个（支出/收入混装）重构为 13 个（10 支出 + 3 收入），每个大类新增 `type` 字段。

**改动文件：**

| 文件 | 改动 |
|---|---|
| `firelifes_back/src/entity/category_group.entity.ts` | 新增 `type` 列（`enum('expense','income')`） |
| `firelifes_back/src/entity/user_category_group.entity.ts` | 新增 `type` 列 |
| `firelifes_back/src/service/category.service.ts` | 更新 `defaultGroups`（10→13，各含 type）；更新 `defaultCategories` 的 groupId 映射（旧 groupId 1-10 → 新 groupId 1-13） |

**defaultGroups 更新（伪代码）：**

```typescript
// category.service.ts - 旧（v1.0）
private defaultGroups = [
  { name: '饮食消费', sortOrder: 1 },
  { name: '居家居住', sortOrder: 2 },
  { name: '交通出行', sortOrder: 3 },
  { name: '形象与消费', sortOrder: 4 },
  { name: '兴趣与成长', sortOrder: 5 },
  { name: '社交关系', sortOrder: 6 },
  { name: '健康与医疗', sortOrder: 7 },
  { name: '职场工作', sortOrder: 8 },
  { name: '金融理财', sortOrder: 9 },
  { name: '其他类型', sortOrder: 10 },
]

// category.service.ts - 新（v1.1）
private defaultGroups = [
  // === 支出大类（10 个）===
  { name: '饮食消费', sortOrder: 1, type: 'expense' },
  { name: '居家居住', sortOrder: 2, type: 'expense' },
  { name: '交通出行', sortOrder: 3, type: 'expense' },
  { name: '服饰美容', sortOrder: 4, type: 'expense' },
  { name: '学习成长', sortOrder: 5, type: 'expense' },
  { name: '休闲娱乐', sortOrder: 6, type: 'expense' },
  { name: '社交关系', sortOrder: 7, type: 'expense' },
  { name: '健康医疗', sortOrder: 8, type: 'expense' },
  { name: '金融理财', sortOrder: 9, type: 'expense' },
  { name: '其他支出', sortOrder: 10, type: 'expense' },
  // === 收入大类（3 个）===
  { name: '薪资报酬', sortOrder: 11, type: 'income' },
  { name: '投资理财', sortOrder: 12, type: 'income' },
  { name: '其他收入', sortOrder: 13, type: 'income' },
]
```

**defaultCategories groupId 映射（伪代码）：**

```typescript
// 旧 groupId → 新 groupId 映射
//  1(饮食消费) → 1(饮食消费)  不变
//  2(居家居住) → 2(居家居住)  不变
//  3(交通出行) → 3(交通出行)  不变
//  4(形象与消费) → 4(服饰美容) 改名
//  5(兴趣与成长) → 5(学习成长) + 6(休闲娱乐) + 8(健康医疗 部分)
//  6(社交关系) → 7(社交关系)  移位
//  7(健康与医疗) → 8(健康医疗) 移位，补充运动健身
//  8(职场工作) → 解散：办公、通讯 → 10(其他支出)；工资、奖金、兼职、报销 → 11(薪资报酬)
//  9(金融理财) → 9(金融理财)  + 12(投资理财-收入)
// 10(其他类型) → 10(其他支出) + 13(其他收入)
```

---

## 6. 完整初始化数据量统计

| 表 | 记录数 |
|---|---|
| users | 1 |
| user_category_groups | 13 |
| user_icons | 47 |
| user_category_customizations | 46 |
| accounts | 3 |
| user_configs | 1 |
| **合计** | **111 条** |

> **v1.2 变更：** 图标 45→47（新增打车、保险），子分类 45→46（新增打车/数码/保险，删除娱乐）；总数据量 108→111。
> **v1.1 变更：** 大类从 10 → 13（10 支出 + 3 收入），总数据量从 105 → 108。

---

## 7. 测试要点

### 7.1 v1.0 遗留测试（用户配置初始化）

| 测试场景 | 验证点 | 优先级 |
|---|---|---|
| **新用户注册** | 注册后 `user_configs` 中存在 key=`theme` 的记录，值为默认 teal 预设 | P0 |
| **验证码登录新用户** | 首次验证码登录自动注册后，同上有 theme 配置 | P0 |
| **微信登录新用户** | 首次微信登录自动注册后，同上有 theme 配置 | P0 |
| **新设备登录** | 注册后换设备登录，自动应用 teal 主题 | P0 |
| **老用户登录** | 已有用户登录，不重复创建 theme 配置 | P1 |
| **注册失败回滚** | 分类/账户/配置任一初始化失败，不影响用户记录一致性 | P2 |

### 7.2 v1.1 新增测试（分类体系重构）

| 测试场景 | 验证点 | 优先级 |
|---|---|---|
| **新用户注册-大类数量** | `user_category_groups` 共 13 条（10 支出 + 3 收入），每条含 type 字段 | P0 |
| **新用户注册-支出大类** | 10 个支出大类名称与 §4.1 一致，type 均为 `expense` | P0 |
| **新用户注册-收入大类** | 3 个收入大类名称与 §4.1 一致，type 均为 `income` | P0 |
| **新用户注册-子分类归属** | 「运动、健身」归属健康医疗大类；「办公、通讯」归属其他支出；「工资、奖金」归属薪资报酬 | P0 |
| **新用户注册-收入独立** | 收入子分类（工资、奖金、投资收入等）均归属 3 个收入大类，不出现在支出大类下 | P0 |
| **老用户迁移** | 已注册用户不受影响，`isUserCreated=true` 的分类保持原 groupId | P1 |
| **分类列表页-分区展示** | 支出和收入大类在列表页分区展示，不可混淆 | P1 |

---

## 8. 交付物清单

### 8.1 v1.0 遗留（用户配置初始化）

| 序号 | 交付物 | 路径 | 操作 |
|---|---|---|---|
| 1 | Service 新增方法 | `firelifes_back/src/service/user.service.ts` | 新增 `initUserConfig` |
| 2 | AuthService 调用 | `firelifes_back/src/service/auth.service.ts` | 3 处新增调用 |
| 3 | 本需求文档 | `firelifes_front/docs/requirements/04-系统配置/new-user-default-config.md` |  已输出 |

### 8.2 v1.1 新增（分类体系重构）

| 序号 | 交付物 | 路径 | 操作 |
|---|---|---|---|
| 4 | category_groups entity 改造 | `firelifes_back/src/entity/category_group.entity.ts` | 新增 `type` 字段（expense/income） |
| 5 | user_category_groups entity 改造 | `firelifes_back/src/entity/user_category_group.entity.ts` | 新增 `type` 字段（expense/income） |
| 6 | initUserCategories 改写 | `firelifes_back/src/service/category.service.ts` | 更新 `defaultGroups`（10→13，含 type）；更新 `defaultCategories` 的 groupId 映射 |
| 7 | 本需求文档更新 | `firelifes_front/docs/requirements/04-系统配置/login/new-user-default-config.md` | v1.1 分类重构内容 |

---

## 9. 风险与注意事项

### 9.1 v1.0 遗留

1. **幂等性：** `initUserConfig` 需先检查是否存在，避免重复创建
2. **异步不阻塞：** 配置初始化失败不应阻塞注册流程（用户记录已创建）
3. **老用户兼容：** `stores/user.ts` 的 `fetchUserConfig()` 中已有迁移逻辑，老用户登录后会从 localStorage 上传主题到 DB
4. **预算表暂不初始化：** 预算是用户主动设置的功能，不应强制预设；若后续需要引导，可在 UI 层做"新手引导"而非 DB 初始化

### 9.2 v1.1 新增（分类体系重构）

1. **老用户数据迁移：** 已注册用户的 `user_category_groups` 和 `user_category_customizations` 表数据需要迁移脚本。`isUserCreated=false` 的系统默认分类需按新映射更新 groupId；`isUserCreated=true` 的用户自创分类需保留原 groupId
2. **group_id 漂移风险：** `category_groups` 表使用自增 ID，新增 3 个收入大类和删除「职场工作」可能导致 ID 漂移。`init-db.ts` 中需确保全局模版表的插入顺序与 sortOrder 一致
3. **entity 字段变更：** `category_groups` 和 `user_category_groups` 表新增 `type` 列，TypeORM `synchronize: true` 模式下会自动加列，但生产环境建议手写 migration
4. **前端分类选择器：** `CategorySelector.vue` 需适配新的支出/收入分区展示逻辑，确保记账时大类列表正确分区
5. **统计/分析页：** 按大类聚合的图表需兼容新的 13 大类结构
