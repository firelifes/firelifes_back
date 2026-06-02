# 用户配置表需求文档
> 文件：`user-config.md` | 中文名称：用户配置表（user_configs）设计 | 所属模块：系统配置
> 版本：v1.0 | 状态：已完成 | 最后更新：2026-05-24

## 版本历史

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v1.0 | 2026-05-24 | 初始版本：新增 user_configs 表，主题从 localStorage 迁移到数据库 | AI |

---

## 1. 问题背景

### 1.1 当前状态

| 现状项 | 详情 |
|---|---|
| 用户核心表 (`users`) | 存储身份认证信息：username、password、phone、nickname、avatarUrl 等 |
| 用户个性化表 | 已有 `user_category_customization`、`user_category_group`、`user_icon`，均通过 userId 关联 |
| 主题颜色存储 | **存在 localStorage**（key: `fire_theme_mode`、`fire_theme_preset`、`fire_theme_custom`），代码在 `src/theme/index.ts` |
| 其他 localStorage 配置 | 如登录时间戳 `login_timestamp` 等零散配置项 |

### 1.2 核心痛点

| 痛点 | 影响 |
|---|---|
| 换设备丢失配置 | 用户换手机或重装 App 后，主题颜色需重新设置，体验差 |
| 不可跨端同步 | 同一账号在不同设备上主题不一致 |
| 扩展性差 | 未来新增用户偏好（默认账本、首页布局、提醒开关等）缺少统一存储方案 |
| localStorage 容量限制 | 微信小程序等环境对 localStorage 有 10MB 限制 |

### 1.3 目标

1. 新增 `user_config` 表，统一管理所有用户个性化配置项
2. 首期将**主题颜色**从 localStorage 迁移到数据库
3. 保留 localStorage 作为本地缓存（加速读取），但以服务端数据为准
4. 后续逐步将其他 localStorage 配置项迁移到 `user_config` 表

---

## 2. 数据库设计

### 2.1 新增表：`user_configs`

采用 **key-value 单行模式**，每个配置项一行，灵活扩展。

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | INT (PK, AUTO_INCREMENT) | 主键 |
| `user_id` | INT (FK → users.id) | 关联用户 |
| `config_key` | VARCHAR(100) | 配置键名，如 `theme`、`default_account` |
| `config_value` | TEXT | 配置值，JSON 字符串 |
| `created_at` | DATETIME | 创建时间 |
| `updated_at` | DATETIME | 更新时间 |

**唯一索引：** `UNIQUE(user_id, config_key)` —— 每个用户同一配置键只有一条记录。

### 2.2 首期配置项

| config_key | config_value 示例 | 说明 |
|---|---|---|
| `theme` | `{"mode":"preset","presetName":"teal-capri-blue","customColors":{}}` | 主题配置（JSON） |

### 2.3 Entity 定义

```typescript
// firelifes_back/src/entity/user_config.entity.ts

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'user_configs', comment: '用户配置表' })
@Index(['userId', 'configKey'], { unique: true })
export class UserConfig {
  @PrimaryGeneratedColumn('increment', { comment: '配置ID，主键自增' })
  id: number;

  @Column({ name: 'user_id', type: 'int', comment: '用户ID' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'config_key', length: 100, comment: '配置键名' })
  configKey: string;

  @Column({ name: 'config_value', type: 'text', comment: '配置值（JSON字符串）' })
  configValue: string;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}
```

### 2.4 SQL 建表语句

```sql
CREATE TABLE `user_configs` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '配置ID，主键自增',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `config_key` VARCHAR(100) NOT NULL COMMENT '配置键名',
  `config_value` TEXT NOT NULL COMMENT '配置值（JSON字符串）',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `IDX_USER_CONFIG_KEY` (`user_id`, `config_key`),
  CONSTRAINT `FK_USER_CONFIG_USER` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户配置表';
```

---

## 3. 后端 API 设计

### 3.1 获取用户配置

**接口：** `GET /user/config`

**请求头：** `Authorization: Bearer <token>`

**响应示例：**
```json
{
  "success": true,
  "data": {
    "theme": {
      "mode": "preset",
      "presetName": "teal-capri-blue",
      "customColors": {}
    }
  }
}
```

**说明：** 返回该用户所有配置项，key 为 `config_key`，value 为解析后的 JSON 对象。若无任何配置，返回空对象 `{}`。

### 3.2 更新用户配置（全量覆盖）

**接口：** `PUT /user/config`

**请求体：**
```json
{
  "configs": {
    "theme": {
      "mode": "custom",
      "presetName": "teal-capri-blue",
      "customColors": { "--color-primary": "#FF6B6B" }
    }
  }
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "配置更新成功"
}
```

**说明：** 
- 传入的每个 key 对应 `user_configs` 表的一行，存在则更新，不存在则插入。
- **不传的 key 不会被删除**，实现增量更新。

### 3.3 更新单个配置项（可选）

**接口：** `PUT /user/config/:key`

**请求体：**
```json
{
  "value": {
    "mode": "preset",
    "presetName": "teal-capri-blue",
    "customColors": {}
  }
}
```

**说明：** 按需实现，首期可只用 3.2 的全量覆盖接口。

### 3.4 Controller 代码位置

```
firelifes_back/src/controller/user/user.controller.ts  ← 在此文件中新增接口
firelifes_back/src/service/user.service.ts             ← 在此文件中新增方法
```

---

## 4. 前端改造方案

### 4.1 数据流架构

```
┌──────────────┐    登录后拉取    ┌──────────────┐
│  服务端 DB   │ ←─────────────→ │  前端 Store   │
│ user_configs │  保存时同步     │  (Pinia)      │
└──────────────┘                 └──────┬───────┘
                                        │ 写入缓存
                                        ▼
                                 ┌──────────────┐
                                 │ localStorage │  ← 加速读取，网络失败时兜底
                                 └──────────────┘
```

**核心原则：**
- **读取优先级：** Pinia Store → localStorage → 默认值
- **写入策略：** 先写 localStorage（即时生效），再异步写服务端（持久化）
- **服务端数据为准：** 登录后从服务端拉取，覆盖本地

### 4.2 改造文件清单

| 文件 | 改动内容 |
|---|---|
| `src/api/auth.ts`（或新建 `src/api/user-config.ts`） | 新增 `getUserConfig`、`updateUserConfig` 接口 |
| `src/theme/index.ts` | `setPresetTheme`、`setCustomColor`、`resetToDefault` 增加同步服务端逻辑 |
| `src/stores/user.ts` | 登录后调用 `getUserConfig`，初始化主题；新增 `userConfig` state |
| `src/pages/my/theme-setting/theme.vue` | 保存时显示 loading，处理网络异常回退 |

### 4.3 主题保存流程（以切换预设主题为例）

```
用户点击预设主题
  → 1. 立即写入 localStorage（前端主题即时生效）
  → 2. 调用 PUT /user/config 同步到服务端
      → 成功：静默完成
      → 失败：保留 localStorage 缓存，下次登录重试同步
```

### 4.4 登录初始化流程

```
用户登录成功
  → 1. 调用 GET /user/config 拉取服务端配置
  → 2. 若有 theme 配置：应用到页面 + 写入 localStorage（覆盖旧缓存）
  → 3. 若无 theme 配置但有 localStorage 旧数据：
      → 自动将 localStorage 数据上传到服务端（静默迁移）
  → 4. 若无任何配置：使用默认主题
```

### 4.5 老用户数据迁移策略

由于老用户主题存在 localStorage，登录时需要做**静默迁移**：

1. 登录后 `GET /user/config` 返回空（老用户无记录）
2. 检查 localStorage 是否有 `fire_theme_mode` / `fire_theme_preset` / `fire_theme_custom`
3. 若有，组装 theme JSON，调用 `PUT /user/config` 写入服务端
4. 迁移完成后，localStorage 数据保留作为缓存

**此迁移为一次性，对用户无感知。**

---

## 5. 配置项扩展规划（后续迭代）

以下配置项后续可逐步迁移到 `user_config` 表：

| config_key | 说明 | 当前存储位置 |
|---|---|---|
| `theme` | 主题颜色 | localStorage（本期迁移） |
| `default_account` | 默认记账账户 | localStorage |
| `home_layout` | 首页布局偏好 | localStorage |
| `reminder_enabled` | 记账提醒开关 | localStorage |
| `currency_display` | 金额显示格式 | 无（硬编码） |
| `budget_alert` | 预算超支提醒阈值 | localStorage |

---

## 6. 测试要点

| 测试场景 | 验证点 | 优先级 |
|---|---|---|
| **新用户注册** | 注册后自动创建默认主题配置记录（preset = teal-capri-blue） | P0 |
| **老用户首次登录（有 localStorage）** | localStorage 中的主题数据自动迁移到 DB，主题正常显示 | P0 |
| **老用户首次登录（无 localStorage）** | 使用默认主题，`GET /user/config` 返回空对象 | P0 |
| **切换主题** | 选择新预设 → 页面即时生效 → 刷新后主题保持 | P0 |
| **自定义颜色** | 修改某个颜色 → 即时生效 → 刷新后保持 → DB 记录正确 JSON | P0 |
| **恢复默认** | 点击恢复默认 → 回到 teal-capri-blue → DB 中 theme 记录被更新 | P1 |
| **换设备登录** | 设备A设置主题 → 设备B登录同一账号 → 自动应用相同主题 | P0 |
| **网络异常时保存** | 断网状态下切换主题 → 本地生效 → 恢复网络后自动同步 | P1 |
| **并发修改** | 两设备同时修改主题 → 以后端最后一次接收的 PUT 为准 | P2 |
| **退出登录** | 退出后清除 Pinia Store 中的 userConfig → 重新登录拉取最新配置 | P1 |

---

## 7. 交付物清单

| 序号 | 交付物 | 路径 |
|---|---|---|
| 1 | Entity 定义 | `firelifes_back/src/entity/user_config.entity.ts` |
| 2 | Service 方法 | `firelifes_back/src/service/user.service.ts`（新增方法） |
| 3 | Controller 接口 | `firelifes_back/src/controller/user/user.controller.ts`（新增路由） |
| 4 | 前端 API 层 | `firelifes_front/src/api/user-config.ts`（新建） |
| 5 | 主题模块改造 | `firelifes_front/src/theme/index.ts`（修改） |
| 6 | 用户 Store 改造 | `firelifes_front/src/stores/user.ts`（修改） |
| 7 | 主题设置页改造 | `firelifes_front/src/pages/my/theme-setting/theme.vue`（修改） |
| 8 | SQL 建表脚本 | `firelifes_back/init-db.ts`（追加） |

---

## 8. 风险与注意事项

1. **不要删除 localStorage 逻辑** —— 仅在其上增加服务端同步层，保持离线可用性
2. **JWT 鉴权** —— 所有 `/user/config` 接口需走 JWT 中间件，确保用户只能操作自己的配置
3. **config_value 不设长度上限** —— 使用 TEXT 类型，主题 JSON 可能包含自定义颜色等多字段
4. **唯一索引冲突处理** —— 使用 `INSERT ... ON DUPLICATE KEY UPDATE` 或 TypeORM 的 `save()` + 先查后写
5. **不要改动用户登录流程** —— 登录逻辑保持不变，仅在登录成功回调中增加拉取配置步骤
