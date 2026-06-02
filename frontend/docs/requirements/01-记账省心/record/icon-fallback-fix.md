# 图标兜底修复
&gt; 文件：`icon-fallback-fix.md` | 中文名称：记账分类图标加载失败兜底显示方案 | 所属模块：记账省心
&gt; 版本：v2.0 | 状态：已实现 | 最后更新：2026-05-10

## 版本历史
| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v1.0 | 2026-05-09 | 初始版本（SVG方案） | AI |
| v2.0 | 2026-05-10 | 更新为iconfont方案，已实现 | AI |

---

&gt; 最后更新：2026-05-10

---

## 功能概述
使用 iconfont 图标方案替代 emoji 作为分类图标，确保在不同设备上显示一致。通过分类名映射到对应的 iconfont 类名，兜底使用默认图标。

## 用户故事
作为用户，我希望在不同设备上看到的分类图标样式一致，不会出现某些设备 emoji 显示异常或大小不一的问题。

## 交互设计

### 实现方案
使用 iconfont 图标库，通过分类名称映射到对应的 iconfont 类名：

| 分类名 | iconfont 类名 |
|--------|---------------|
| 餐饮 | icon-canyin |
| 零食 | icon-lingshi |
| 交通 | icon-jiaotong |
| 购物 | icon-gouwuche |
| 居住 | icon-fangzi |
| 娱乐 | icon-youxiyouxiji |
| 医疗 | icon-yiliao |
| 教育 | icon-jiaoyu |
| 通讯 | icon-shouji |
| 旅行 | icon-lvhang |
| 美容 | icon-meirong |
| 服饰 | icon-yifu |
| 运动 | icon-yundong- |
| 日用品 | icon-riyongpin |
| 宠物 | icon-xiedaichongwu |
| 烟酒 | icon-yanjiu |
| 社交 | icon-13 |
| 汽车 | icon-qiche |
| 数码家电 | icon-shumajiadianleimu |
| 工资 | icon-gongzijianyi |
| 工资条 | icon-gongzitiao |
| 奖金 | icon-jiangjinxiangqing |
| 红包 | icon-jiangjinjilu |
| 兼职 | icon-a-068_jianzhi |
| 礼金 | icon-a-068_lijin |
| 退款 | icon-tuikuan |
| 闲置 | icon-xianzhi |
| 理财收益 | icon-licaishouyi |
| 其他 | icon-qita |

### 交互流程
1. 应用启动，加载分类数据
2. 分类渲染时，根据分类名称查找对应的 iconfont 类名
3. 如果找到匹配，显示对应的 iconfont 图标
4. 如果未找到匹配，显示兜底图标（icon-qita）

### 状态变化
| 状态 | 触发条件 | 行为 |
|------|----------|------|
| 正常 | 分类名在映射表中 | 显示对应的 iconfont 图标 |
| 兜底 | 分类名不在映射表中 | 显示默认兜底图标（icon-qita） |

## UI 设计规范

### 布局
- 图标容器：88rpx × 88rpx
- 图标大小：44rpx，居中显示
- 图标背景：未选中时 rgba(255,255,255,0.8)，选中时蓝色渐变

### 颜色
- 图标颜色：未选中时 #00BFFF，选中时 #FFFFFF
- 选中背景：linear-gradient(135deg, #00BFFF 0%, #0099CC 100%)
- 图标大小：44rpx

### 字体
- 分类名称：24rpx，#333

## 数据结构

### 图标映射
```typescript
// 分类名→iconfont类名映射
const CATEGORY_ICON_MAP: Record<string, string> = {
  // 支出
  '餐饮': 'icon-canyin', '零食': 'icon-lingshi', '交通': 'icon-jiaotong',
  '购物': 'icon-gouwuche', '居住': 'icon-fangzi', '娱乐': 'icon-youxiyouxiji',
  '医疗': 'icon-yiliao', '教育': 'icon-jiaoyu', '通讯': 'icon-shouji',
  '旅行': 'icon-lvhang', '美容': 'icon-meirong', '服饰': 'icon-yifu',
  '运动': 'icon-yundong-', '日用品': 'icon-riyongpin', '宠物': 'icon-xiedaichongwu',
  '烟酒': 'icon-yanjiu', '社交': 'icon-13', '汽车': 'icon-qiche',
  '数码家电': 'icon-shumajiadianleimu', '其他': 'icon-qita',
  // 收入
  '工资': 'icon-gongzijianyi', '工资条': 'icon-gongzitiao', '奖金': 'icon-jiangjinxiangqing',
  '红包': 'icon-jiangjinjilu', '兼职': 'icon-a-068_jianzhi', '礼金': 'icon-a-068_lijin',
  '退款': 'icon-tuikuan', '闲置': 'icon-xianzhi', '理财收益': 'icon-licaishouyi',
}
```

## 与现有功能的关联

### 已修改的文件
- `src/pages/record/components/CategorySelector.vue`：实现了 iconfont 图标映射和兜底逻辑

### 实现细节
- 使用分类名优先匹配 iconfont 类名
- 兜底使用 icon-qita
- 选中状态有视觉反馈（蓝色渐变背景 + 白色图标）

## 边界情况
1. **分类名不在映射表**：显示兜底图标 icon-qita
2. **iconfont 加载失败**：页面无图标显示（依赖 iconfont 库正确加载）
3. **新增分类**：需要在映射表中添加对应的 iconfont 类名

