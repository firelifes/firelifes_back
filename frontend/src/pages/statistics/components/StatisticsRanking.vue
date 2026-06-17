<!--
  StatisticsRanking.vue - 排行榜组件 v3
  升级点：
  1. 前 3 名加金银铜徽章（#1金 #2银 #3铜）
  2. 进度条入场动画：width 从 0 → target，每行错开 60ms
  3. 排名数字颜色：1=金 2=银 3=铜 其他=灰
  4. 加载态 → EmptyState
-->
<template>
  <view class="ranking-card">
    <text class="ranking-title">{{ typeLabel }}</text>
    <view class="ranking-list">
      <view
        v-for="(item, index) in formattedItems"
        :key="index"
        class="ranking-row"
        :class="{
          'ranking-row-top': index < 3,
          [`ranking-rank-${index + 1}`]: true,
        }"
        @tap="emit('item-tap', item)"
      >
        <!-- 排名/徽章 -->
        <view class="ranking-rank-col">
          <view v-if="index < 3" :class="['ranking-medal', `ranking-medal-${index + 1}`]">
            <text class="ranking-medal-text">{{ ['🥇', '🥈', '🥉'][index] }}</text>
          </view>
          <text v-else class="ranking-rank-num">{{ index + 1 }}</text>
        </view>

        <!-- 图标 -->
        <view class="ranking-icon">
          <view v-if="item.iconClass" :class="['category-icon-svg', 'ranking-svg-icon', item.iconClass]"></view>
          <text v-else class="ranking-icon-emoji">{{ item.icon || '📋' }}</text>
        </view>

        <!-- 内容 -->
        <view class="ranking-content">
          <view class="ranking-info">
            <text class="ranking-name">{{ item.name }}</text>
            <text class="ranking-pct">{{ item.percent }}%</text>
            <view class="ranking-amount-wrap">
              <text class="ranking-amount">{{ item.type === 'expense' ? '-' : '' }}¥{{ formatAmount(item.amount) }}</text>
            </view>
          </view>
          <view class="ranking-bar-bg">
            <view
              class="ranking-bar-fill"
              :style="{
                width: item.barWidth + '%',
                transitionDelay: (index * 0.06) + 's',
              }"
            ></view>
          </view>
        </view>
      </view>
    </view>

    <EmptyState
      v-if="formattedItems.length === 0"
      type="no-data"
      title="暂无排行数据"
      size="small"
    />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from '../../../utils/format'
import EmptyState from '../../../components/EmptyState.vue'

interface RankItem {
  name: string
  icon: string
  iconClass?: string
  amount: number
  percent: number
  color: string
  type: string
  typeId: number
}

interface FormattedRankItem extends RankItem {
  barWidth: number
}

const props = defineProps<{
  items: RankItem[]
  type: 'expense' | 'income' | 'transfer'
}>()

const emit = defineEmits<{
  (e: 'item-tap', item: RankItem): void
}>()

const formatAmount = (v: number) => formatCurrency(Math.abs(v))

const typeLabel = computed(() => {
  if (props.type === 'expense') return '支出排行榜'
  if (props.type === 'income') return '收入排行榜'
  return '转账排行榜'
})

const maxAmount = computed(() => Math.max(...props.items.map(i => i.amount), 1))

const formattedItems = computed<FormattedRankItem[]>(() => {
  // 用最大余数法确保百分比相加=100%
  const items = props.items.map(item => ({
    ...item,
    barWidth: maxAmount.value > 0 ? Math.round((item.amount / maxAmount.value) * 100) : 0,
    rawPercent: item.percent,
  }))
  const floors = items.map(it => ({ ...it, floorPct: Math.floor(it.rawPercent) }))
  const floorSum = floors.reduce((s, it) => s + it.floorPct, 0)
  const diff = 100 - floorSum
  if (diff > 0 && floors.length > 0) {
    const remainders = floors.map((it, idx) => ({
      idx,
      rem: it.rawPercent - Math.floor(it.rawPercent),
    }))
    remainders.sort((a, b) => b.rem - a.rem)
    for (let k = 0; k < diff && k < remainders.length; k++) {
      floors[remainders[k].idx].floorPct += 1
    }
  }
  return floors.map(it => ({ ...it, percent: it.floorPct }))
})
</script>

<style scoped>
.ranking-card {
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(13, 148, 136, 0.04);
}

.ranking-title {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--color-text-primary, #1E293B);
  padding-bottom: 24rpx;
  border-bottom: 2rpx solid var(--color-border-light, #F1F5F9);
  margin-bottom: 24rpx;
  display: block;
  letter-spacing: 1rpx;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.ranking-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
  height: 120rpx;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border-light, #F1F5F9);
  padding: 0 8rpx;
  transition: background 0.15s, transform 0.15s;
}

.ranking-row:last-child {
  border-bottom: none;
}

.ranking-row:active {
  background: var(--color-bg-page, #F5F7FA);
  transform: scale(0.99);
}

.ranking-row-top {
  /* 前 3 名加淡色背景 */
}

.ranking-row-top.ranking-rank-1 {
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.04) 0%, transparent 60%);
}

.ranking-row-top.ranking-rank-2 {
  background: linear-gradient(90deg, rgba(192, 192, 192, 0.04) 0%, transparent 60%);
}

.ranking-row-top.ranking-rank-3 {
  background: linear-gradient(90deg, rgba(205, 127, 50, 0.04) 0%, transparent 60%);
}

/* ── 排名/徽章列 ── */
.ranking-rank-col {
  width: 48rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ranking-rank-num {
  font-size: 26rpx;
  color: var(--color-text-secondary, #94A3B8);
  font-weight: 600;
  font-feature-settings: 'tnum';
}

.ranking-medal {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

.ranking-medal-text {
  font-size: 22rpx;
  line-height: 1;
}

.ranking-medal-1 {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
}

.ranking-medal-2 {
  background: linear-gradient(135deg, #E8E8E8 0%, #B8B8B8 100%);
}

.ranking-medal-3 {
  background: linear-gradient(135deg, #CD7F32 0%, #8B5A2B 100%);
}

/* ── 图标 ── */
.ranking-icon {
  flex-shrink: 0;
  width: 72rpx;
  height: 72rpx;
  border-radius: 16rpx;
  background: var(--color-primary-soft, rgba(13, 148, 136, 0.12));
  display: flex;
  align-items: center;
  justify-content: center;
}

.ranking-row-top.ranking-rank-1 .ranking-icon {
  background: linear-gradient(135deg, #FFF7CC 0%, #FFE680 100%);
}

.ranking-svg-icon {
  width: 48rpx;
  height: 48rpx;
}

.ranking-icon-emoji {
  font-size: 36rpx;
}

.ranking-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  min-width: 0;
}

.ranking-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12rpx;
}

.ranking-name {
  font-size: 28rpx;
  color: var(--color-text-primary, #1E293B);
  max-width: 45%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.ranking-row-top .ranking-name {
  font-weight: 600;
}

.ranking-pct {
  font-size: 24rpx;
  color: var(--color-text-secondary, #94A3B8);
  width: 70rpx;
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
}

.ranking-amount-wrap {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.ranking-amount {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
}

.ranking-bar-bg {
  width: 100%;
  height: 14rpx;
  background: var(--color-border-light, #F1F5F9);
  border-radius: 8rpx;
  overflow: hidden;
}

.ranking-bar-fill {
  height: 100%;
  border-radius: 8rpx;
  background: linear-gradient(90deg, var(--color-primary, #0D9488) 0%, var(--color-primary-dark, #0B7A70) 100%);
  /* 入场动画：width 从 0 → target，由 v-for index 错开 60ms */
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  width: 0;
  animation: ranking-bar-grow 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes ranking-bar-grow {
  /* 由内联 style 的 transitionDelay 控制延迟 */
}

.ranking-row-top.ranking-rank-1 .ranking-bar-fill {
  background: linear-gradient(90deg, #FFD700 0%, #FFA500 100%);
}

.ranking-row-top.ranking-rank-2 .ranking-bar-fill {
  background: linear-gradient(90deg, #B8B8B8 0%, #888888 100%);
}

.ranking-row-top.ranking-rank-3 .ranking-bar-fill {
  background: linear-gradient(90deg, #CD7F32 0%, #8B5A2B 100%);
}
</style>
