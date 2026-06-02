# 固定资产管理
&gt; 文件：fixed-asset.md | 中文名称：房产/车位等大额固定资产估值与负债关联功能 | 所属模块：资产有数
&gt; 版本：v2.0 | 状态：设计中 | 最后更新：2026-05-12

## 版本历史
| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v2.0 | 2026-05-12 | 统一使用WotUI组件库，左滑交互模式 | AI |
| v1.0 | 2026-05-09 | 初始版本 | AI |

---

> 最后更新：2026-05-09

---

## 功能概述
固定资产是指长期持有、价值较高但折旧方式不同于一般资产的资产，如房产、车位、商铺等。与折旧资产不同，固定资产通常随时间增值或保持价值，采用手动估值更新而非自动折旧计算的方式管理。

## 用户故事
作为用户，我希望将我的房产等大额固定资产独立管理，追踪其购入价和当前估值，了解净权益（估值减去关联负债），并在估值变化时获得提醒。这样我可以：
1. 清楚了解我的固定资产实际价值
2. 追踪房产增值或贬值
3. 计算净资产时自动关联房贷等负债

## 交互设计

### 页面结构

```
固定资产列表页 (src/pages/assets/fixed/index.vue)
┌────────────────────────────────────┐
│  ← 固定资产                    [+] │
├────────────────────────────────────┤
│  总净权益        总估值              │
│  ¥1,850,000    ¥2,500,000         │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  自住房产                     │ │
│  │ 房产  净权益 ¥1,200,000         │ │
│  │ 估值 ¥2,000,000  增值 +25%     │ │
│  │ 关联：房贷 ¥800,000             │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │  车位A                       │ │
│  │ 车位  净权益 ¥150,000          │ │
│  │ 估值 ¥150,000   持平           │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │  商铺                        │ │
│  │ 商铺  净权益 ¥500,000          │ │
│  │ 估值 ¥350,000   贬值 -15%      │ │
│  │ 关联：贷款 ¥50,000             │ │
│  └────────────────────────────────┘ │
└────────────────────────────────────┘

固定资产添加/编辑页 (src/pages/assets/fixed/edit.vue)
┌────────────────────────────────────┐
│  ← 添加固定资产              [保存] │
├────────────────────────────────────┤
│                                      │
│  资产名称                            │
│  ┌────────────────────────────────┐ │
│  │ 输入资产名称...                │ │
│  └────────────────────────────────┘ │
│                                      │
│  品类                                │
│  ○ 房产  ○ 车位  ○ 商铺  ○ 其他      │
│                                      │
│  购入价                              │
│  ┌────────────────────────────────┐ │
│  │ ¥ 1,600,000                    │ │
│  └────────────────────────────────┘ │
│                                      │
│  购入日期                            │
│  ┌────────────────────────────────┐ │
│  │ 2019-06-15                     │ │
│  └────────────────────────────────┘ │
│                                      │
│  当前估值                            │
│  ┌────────────────────────────────┐ │
│  │ ¥ 2,000,000                    │ │
│  └────────────────────────────────┘ │
│                                      │
│  关联负债账户                        │
│  ┌────────────────────────────────┐ │
│  │ [选择账户 ▼]                   │ │
│  │ 或跳过                          │ │
│  └────────────────────────────────┘ │
│  当前负债余额：¥800,000             │
│  净权益 = ¥1,200,000               │
│                                      │
└────────────────────────────────────┘

固定资产详情页 (src/pages/assets/fixed/detail.vue)
┌────────────────────────────────────┐
│  ←                           [...] │
├────────────────────────────────────┤
│   自住房产                        │
│  房产            [正常]             │
│                                      │
│         ¥1,200,000                  │
│           净权益                     │
│                                      │
│  当前估值：¥2,000,000               │
│  购入价：¥1,600,000                 │
│  增值率：+25%                       │
│                                      │
│  ┌────────────────────────────────┐ │
│  │      [估值历史折线图]            │ │
│  │      2019→2020→2021→2024       │ │
│  └────────────────────────────────┘ │
│                                      │
│  估值历史                            │
│  2024-05-09  ¥2,000,000  [当前]    │
│  2023-01-15  ¥1,850,000             │
│  2022-06-20  ¥1,700,000             │
│  2019-06-15  ¥1,600,000  [购入]     │
│                                      │
│  关联负债                            │
│  ┌────────────────────────────────┐ │
│  │  招商房贷                     │ │
│  │ 剩余 ¥800,000                  │ │
│  └────────────────────────────────┘ │
│                                      │
│  [更新估值]    [编辑]    [解除关联]  │
│                                      │
│   估值已超过6个月未更新           │
│                                      │
└────────────────────────────────────┘

估值更新弹窗 (update-value-modal)
┌────────────────────────────────────┐
│  更新估值                           │
│                                      │
│  当前估值                           │
│  ¥2,000,000                        │
│                                      │
│  新估值                             │
│  ┌────────────────────────────────┐ │
│  │ ¥ [2,100,000]                  │ │
│  └────────────────────────────────┘ │
│                                      │
│  更新日期                           │
│  ┌────────────────────────────────┐ │
│  │ 2024-05-09                     │ │
│  └────────────────────────────────┘ │
│                                      │
│  增值 +¥100,000                     │
│                                      │
│  [取消]           [确认更新]        │
└────────────────────────────────────┘
```

### 交互流程

#### 1. 添加固定资产
1. 用户点击"+"添加固定资产
2. 填写资产名称（必填）
3. 选择品类：房产/车位/商铺/其他
4. 填写购入价（必填）
5. 选择购入日期（必填）
6. 填写当前估值（必填，默认同购入价）
7. 可选关联负债账户
8. 点击保存，资产添加成功

#### 2. 更新估值
1. 在详情页点击"更新估值"
2. 弹窗显示当前估值
3. 输入新估值
4. 自动计算增值/贬值金额和比率
5. 确认后保存估值记录
6. 同步更新净权益

#### 3. 关联/解除负债
1. 在详情页点击"编辑" → "关联负债"
2. 选择要关联的负债账户（仅负债类账户）
3. 自动计算净权益 = 当前估值 - 负债余额
4. 如需解除关联，点击"解除关联"按钮

#### 4. 估值到期提醒
- 超过6个月未更新估值时，在详情页显示提醒
- 在资产总览页该资产卡片显示"估值可能已过时"

### 状态变化

| 状态 | 触发条件 | 行为 |
|------|----------|------|
| 正常 | 6个月内更新过估值 | 显示正常状态标签 |
| 估值待更新 | 超过6个月未更新 | 显示"估值可能已过时"提示 |
| 关联负债 | 已关联负债账户 | 显示关联负债卡片和净权益 |
| 未关联负债 | 未关联负债账户 | 显示当前估值为余额 |

## UI 设计规范

### 布局
- 列表页内边距：32rpx
- 资产卡片：高度 160rpx，圆角 16rpx，间距 16rpx
- 详情页主价值区：高度 200rpx
- 弹窗：宽 600rpx，居中弹出

### 颜色（卡布里蓝体系）
- 页面背景：#FFFFFF
- 主色描边图标：#00BFFF
- 净权益大字：#00BFFF
- 增值率：#19BE6B（绿色）
- 贬值率：#FA3534（红色）
- 持平：#999999
- 提醒提示：#FF9800（橙色警告）
- 负债余额：#FA3534

### 字体
- 资产名称：32rpx，#333333，加粗
- 净权益：56rpx，#00BFFF，加粗
- 估值/购入价：28rpx，#333333
- 增值率：24rpx，#19BE6B / #FA3534
- 关联负债：26rpx，#666666
- 时间标签：24rpx，#999999

### 动效
- 列表加载：fadeIn，时长 300ms，stagger 50ms
- 卡片点击：scale 0.98，时长 100ms
- 弹窗出现：slideUp + fadeIn，200ms
- 数字变化：数字滚动动画，800ms

## 数据结构

### 固定资产数据结构
```typescript
interface FixedAsset {
  id: string;                      // UUID
  userId: string;                 // 用户ID
  name: string;                    // 资产名称
  category: FixedAssetCategory;    // 品类：房产/车位/商铺/其他
  purchasePrice: number;           // 购入价
  purchaseDate: string;            // 购入日期 'YYYY-MM-DD'
  currentValue: number;            // 当前估值
  // 关联负债
  linkedLiabilityAccountId?: string;  // 关联的负债账户ID
  linkedLiabilityAccountName?: string; // 负债账户名称（快照）
  // 计算属性
  netEquity: number;               // 净权益 = 当前估值 - 负债余额
  appreciationRate: number;        // 增值率 = (当前估值 - 购入价) / 购入价
  // 状态
  lastValuationDate: string;      // 最后估值日期
  isValuationOverdue: boolean;     // 估值是否过期（>6个月）
  // 估值历史
  valuationHistory: ValuationRecord[];
  createdAt: string;
  updatedAt: string;
}

// 固定资产品类
type FixedAssetCategory = 'property' | 'parking' | 'shop' | 'other';

// 估值记录
interface ValuationRecord {
  id: string;
  assetId: string;
  value: number;                  // 估值金额
  date: string;                    // 估值日期 'YYYY-MM-DD'
  isPurchase: boolean;            // 是否为购入记录
  note?: string;                   // 备注
  createdAt: string;
};
```

### 新增接口

```typescript
// GET /api/assets/fixed - 获取固定资产列表
interface GetFixedAssetsResponse {
  code: number;
  data: {
    assets: FixedAsset[];
    summary: {
      totalCurrentValue: number;     // 总估值
      totalNetEquity: number;        // 总净权益
      totalLiability: number;         // 关联负债总额
      count: number;                  // 资产数量
    };
  };
}

// GET /api/assets/fixed/:id - 获取固定资产详情
interface GetFixedAssetDetailResponse {
  code: number;
  data: {
    asset: FixedAsset;
    liabilityAccount?: Account;      // 关联的负债账户详情
  };
}

// POST /api/assets/fixed - 创建固定资产
interface CreateFixedAssetRequest {
  name: string;
  category: FixedAssetCategory;
  purchasePrice: number;
  purchaseDate: string;
  currentValue: number;
  linkedLiabilityAccountId?: string;  // 可选关联负债
}

interface CreateFixedAssetResponse {
  code: number;
  data: {
    asset: FixedAsset;
  };
}

// PUT /api/assets/fixed/:id - 更新固定资产
interface UpdateFixedAssetRequest {
  name?: string;
  category?: FixedAssetCategory;
  purchasePrice?: number;
  purchaseDate?: string;
}

// PUT /api/assets/fixed/:id/valuation - 更新估值
interface UpdateValuationRequest {
  value: number;
  date: string;
  note?: string;
}

interface UpdateValuationResponse {
  code: number;
  data: {
    asset: FixedAsset;
    valuationRecord: ValuationRecord;
  };
}

// PUT /api/assets/fixed/:id/link-liability - 关联负债账户
interface LinkLiabilityRequest {
  accountId: string;
}

interface LinkLiabilityResponse {
  code: number;
  data: {
    asset: FixedAsset;
  };
}

// DELETE /api/assets/fixed/:id/link-liability - 解除关联
interface UnlinkLiabilityResponse {
  code: number;
  data: {
    asset: FixedAsset;
  };
}
```

## 与现有功能的关联

### 依赖关系
- **依赖**：F1 account-system（负债账户列表、余额查询）
- **被依赖**：F5 asset-overview（资产总览展示固定资产）

### 需要修改的文件
- `src/pages/assets/index.vue` - 新增固定资产区块
- `src/pages/assets/fixed/index.vue` - 新增列表页
- `src/pages/assets/fixed/detail.vue` - 新增详情页
- `src/pages/assets/fixed/edit.vue` - 新增编辑页
- `src/components/FixedAssetCard.vue` - 资产卡片组件
- `src/components/ValuationHistory.vue` - 估值历史组件
- `src/store/modules/assets.js` - 新增状态管理

### 新增文件
- `src/api/assets/fixed.ts` - API 接口
- `src/constants/fixed-asset-categories.ts` - 品类常量

## 边界情况

1. **关联的负债账户余额为0**
   - 净权益 = 当前估值
   - 正常显示

2. **关联的负债账户已删除**
   - 固定资产保留，自动解除关联
   - linkedLiabilityAccountId 置空

3. **估值更新频率**
   - 建议不超过6个月更新一次
   - 超过6个月显示提醒，但不禁用操作

4. **净权益为负**
   - 房价下跌或负债增加可能导致净权益为负
   - 净权益显示红色

5. **固定资产列表为空**
   - 显示空态引导："还没有固定资产"
   - 引导用户添加房产/车位等资产

6. **禁止横向滚动**
   - 页面根容器设置 `overflow-x: hidden`
   - 避免与 WdSwipeCell 的横向滑动冲突

---

## UI 组件使用

页面使用 WotUI (`@wot-ui/ui`) 组件库，通过 `@uni-helper/vite-plugin-uni-components` 自动按需导入。

| 组件 | 用途 | 关键属性 |
|------|------|---------|
| WdNavbar | 顶部导航栏 | `title`，`leftArrow`，`fixed`，`placeholder`，`bordered`，`safeAreaInsetTop`，`rightText`，`@click-right` |
| WdSwipeCell | 左滑单元格 | `:right-width="140"`，`#default`，`#right` |
| WdButton | 操作按钮 | `size="small"`，`type="primary"`（编辑/更新估值），`type="danger"`（删除） |
| WdDialog | 弹窗 | `v-model`，`title`，`show-cancel-button`，`show-confirm-button` |
| WdInput | 输入框 | `v-model`，`placeholder`，`maxlength`，`show-clear` |
| WdPicker | 日期选择器 | `v-model`，`type="date"`，`format="YYYY-MM-DD"` |

---

## 实现要点

### WdSwipeCell 使用示例

```vue
&lt;wd-swipe-cell :right-width="140"&gt;
  &lt;template #default&gt;
    &lt;view class="fixed-asset-card" @click="goToDetail(asset.id)"&gt;
      &lt;view class="card-left"&gt;
        &lt;text class="asset-icon"&gt;{{ getCategoryIcon(asset.category) }}&lt;/text&gt;
        &lt;view class="asset-info"&gt;
          &lt;text class="asset-name"&gt;{{ asset.name }}&lt;/text&gt;
          &lt;text class="asset-category"&gt;{{ getCategoryLabel(asset.category) }}&lt;/text&gt;
          &lt;view class="asset-value"&gt;
            &lt;text&gt;净权益 ¥{{ formatAmount(asset.netEquity) }}&lt;/text&gt;
            &lt;text class="appreciation-rate" :class="getRateClass(asset.appreciationRate)"&gt;
              {{ formatRate(asset.appreciationRate) }}
            &lt;/text&gt;
          &lt;/view&gt;
        &lt;/view&gt;
      &lt;/view&gt;
    &lt;/view&gt;
  &lt;/template&gt;
  &lt;template #right&gt;
    &lt;wd-button size="small" type="primary" @click.stop="goToEdit(asset.id)"&gt;编辑&lt;/wd-button&gt;
    &lt;wd-button size="small" type="danger" @click.stop="handleDelete(asset.id)"&gt;删除&lt;/wd-button&gt;
  &lt;/template&gt;
&lt;/wd-swipe-cell&gt;
```

### 禁止横向滚动

```vue
&lt;style scoped&gt;
.page-container {
  overflow-x: hidden; /* 关键：禁止页面横向滚动 */
  min-height: 100vh;
  background-color: #f5f5f5;
}
&lt;/style&gt;
```
