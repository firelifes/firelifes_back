# 净资产计算引擎
> 文件：net-worth.md | 中文名称：净资产自动计算与FIRE进度数据供给 | 所属模块：资产有数
> 版本：v1.0 | 状态：开发中 | 最后更新：2026-05-15

## 版本历史
| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v1.0 | 2026-05-15 | 初始版本；后端NetWorthService+前端确认卡片+明细页FIRE进度条均已实现 | AI |

---

## 功能概述

净资产计算引擎是连接"资产有数"和"FIRE可期"的核心桥梁。每次记账成功后自动重算净资产，为FIRE进度追踪提供唯一数据源。

## 用户故事
作为产品，我需要一个可靠的净资产计算逻辑，让"记账省心→资产有数→FIRE可期"三支柱真正形成数据闭环，而不是三个孤立模块。

## 净资产定义

```
净资产 = Σ(所有账户余额) + Σ(折旧资产.当前价值) + Σ(固定资产.估值)
```

### 各组成部分

| 组成部分 | 数据源 | 计算方式 |
|----------|--------|----------|
| 现金账户 | accounts 表 (type=cash) | 直接取 balance 字段 |
| 折旧资产 | depreciating_assets 表 (status=active) | 取 currentValue 字段 |
| 固定资产 | 后续实现 | 用户手动估值 |
| 负债账户 | accounts 表 (type=liability) | balance 为负值，净计算时直接相加即可 |

### 为什么公式如此简单

- 账户余额已通过记账联动机制实时更新
- 折旧资产的 currentValue 在创建时计算，后续按月折旧更新
- 负债的 balance 本身就是负值，直接 Σ(all) 即可正确处理

### 关键原则：资产形态转换，净资产不变

```
例：花 ¥5,000 买手机并记入折旧资产

支出前：
  现金 ¥10,000 + 折旧资产 ¥0 = 净资产 ¥10,000

支出后：
  现金 ¥5,000 + 折旧资产 ¥5,000 = 净资产 ¥10,000  ← 净资产不变！

一个月后（折旧 ¥139）：
  现金 ¥5,000 + 折旧资产 ¥4,861 = 净资产 ¥9,861  ← 净资产缓慢下降
```

这个原则保证了记账的直觉正确性——花钱买东西不是"损失"，只是资产形态转化。

## 数据结构

### 后端新增接口

```typescript
// GET /record/net-worth - 获取当前净资产
// 响应
interface NetWorthResponse {
  success: boolean;
  data: {
    netWorth: number;
    details: {
      cashBalance: number;          // 现金账户余额合计
      depreciatingAssetValue: number; // 折旧资产当前价值合计
      liabilityBalance: number;     // 负债余额合计（负值）
    };
    updatedAt: string;
  };
}
```

### 后端实现

```typescript
// src/service/net-worth.service.ts
@Provide()
export class NetWorthService {
  @InjectEntityModel(Account)
  accountModel: Repository<Account>;

  @InjectEntityModel(DepreciatingAsset)
  depreciatingAssetModel: Repository<DepreciatingAsset>;

  async getNetWorth(userId: number): Promise<NetWorthData> {
    // 现金+负债账户余额合计
    const accountResult = await this.accountModel
      .createQueryBuilder('account')
      .select('SUM(account.balance)', 'totalBalance')
      .where('account.userId = :userId', { userId })
      .andWhere('account.isDeleted = false')
      .andWhere('account.isVisible = true')
      .getRawOne();

    // 折旧资产当前价值合计
    const assetResult = await this.depreciatingAssetModel
      .createQueryBuilder('asset')
      .select('SUM(asset.currentValue)', 'totalValue')
      .where('asset.userId = :userId', { userId })
      .andWhere('asset.status = :status', { status: 'active' })
      .getRawOne();

    const cashBalance = parseFloat(accountResult?.totalBalance || '0');
    const assetValue = parseFloat(assetResult?.totalValue || '0');
    
    return {
      netWorth: cashBalance + assetValue,
      cashBalance,
      depreciatingAssetValue: assetValue,
    };
  }
}
```

## 调用时机

| 触发事件 | 调用方 | 说明 |
|----------|--------|------|
| 记账成功 | 前端调用 getNetWorth | 更新记账确认卡片中的净资产显示 |
| 进入明细页 | 前端调用 getNetWorth | 更新顶部FIRE进度条 |
| 折旧结算 | 定时任务（后续） | 每月1日批量重算折旧并更新currentValue |

## 前端消费

### 记账确认卡片
```
记账成功 → 调用 getNetWorth → 展示"当前净资产 ¥128,000"
```

### 明细页FIRE进度
```
进入明细页 → 调用 getNetWorth + getFIREGoal → 展示进度条
```

### 资产总览页
```
进入资产总览 → 调用 getNetWorth → 展示完整分解
```

## 与现有功能的关联

### 依赖关系
- **记账省心**：依赖账户余额（通过记账联动实时更新）
- **折旧资产**：依赖 depreciating_assets 表的 currentValue

### 被依赖关系
- **FIRE可期**：净资产是FIRE进度的唯一计算输入
- **资产总览**：净资产是总览页核心数据

## 需要修改/新增的文件

### 后端
- `src/service/net-worth.service.ts` — **新增**
- `src/controller/record/record.controller.ts` — 新增 GET /record/net-worth 端点

### 前端
- `src/api/record.ts` — 新增 getNetWorth 方法
- `src/pages/record/index.vue` — 记账成功后调用 getNetWorth
- `src/pages/detail/index.vue` — onShow 时调用 getNetWorth

## 边界情况

1. **无折旧资产时**：assetValue = 0，净资产 = 纯现金余额
2. **负债 > 资产时**：净资产为负数，FIRE进度显示为 0%
3. **账户被删除（软删除）**：不参与计算
4. **折旧资产已处置**：status='disposed' 不参与计算
