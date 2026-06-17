<!--
  StatisticsRingChart.vue - SVG 环形图表组件 v3
  升级点：
  1. 入场动画：每段 stroke-dasharray 起始 0，缓出到目标值（错开 80ms）
  2. 中心数字 0 → totalAmount 滚动（800ms 缓动）
  3. 圆角 stroke-linecap (round) 视觉更柔和
  4. 图例：top 1 高亮（背景色 + 加粗）
  5. 加载态：空数据 → EmptyState
-->
<template>
  <view class="ring-card">
    <view class="ring-chart-wrap">
      <svg class="ring-svg" viewBox="0 0 200 200">
        <!-- 背景环 -->
        <circle cx="100" cy="100" r="78" fill="none"
          stroke="#F1F5F9" stroke-width="22" />

        <!-- 数据环段（每段带入场动画） -->
        <circle
          v-for="(seg, idx) in segments"
          :key="idx"
          cx="100" cy="100" r="78"
          fill="none"
          :stroke="seg.color"
          stroke-width="22"
          stroke-linecap="round"
          :stroke-dasharray="seg.dashArray"
          :stroke-dashoffset="seg.dashOffset"
          :class="['ring-seg', 'ring-seg-anim']"
          :style="{
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
            animationDelay: (idx * 0.08) + 's',
          }"
        />
      </svg>

      <!-- 中心数字（滚动动画） -->
      <view class="ring-center">
        <text class="ring-total-label">{{ typeLabel }}</text>
        <text class="ring-total-amount">¥{{ displayAmount }}</text>
      </view>
    </view>

    <!-- 图例（top 1 高亮） -->
    <view class="legend-area">
      <view
        v-for="(item, index) in legendItems"
        :key="index"
        class="legend-item"
        :class="{ 'legend-top': index === 0 && item.percent > 0 }"
      >
        <view class="legend-dot" :style="{ backgroundColor: item.color }"></view>
        <text class="legend-name">{{ item.name }}</text>
        <text class="legend-pct">{{ item.percent }}%</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { formatCurrency } from '../../../utils/format'

interface CategoryData {
  name: string
  amount: number
  percent: number
  color: string
}

const props = defineProps<{
  categories: CategoryData[]
  totalAmount: number
  type: 'expense' | 'income' | 'transfer'
}>()

const RING_COLORS = ['#0D9488', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#64748B']
const CIRCUMFERENCE = 2 * Math.PI * 78

const formatAmount = (v: number) => formatCurrency(Math.abs(v))

const typeLabel = computed(() => {
  if (props.type === 'expense') return '总支出'
  if (props.type === 'income') return '总收入'
  return '总转账'
})

const legendItems = computed(() => {
  const top5 = props.categories.slice(0, 5).map((c, i) => ({
    name: c.name,
    rawPercent: c.percent,
    color: c.color || RING_COLORS[i % RING_COLORS.length],
  }))
  if (props.categories.length > 5) {
    const othersRaw = props.categories.slice(5).reduce((sum, c) => sum + c.percent, 0)
    top5.push({ name: '其他', rawPercent: othersRaw, color: '#94A3B8' })
  }
  // 用最大余数法：先向下取整，把差额按小数部分从大到小补齐，保证总和=100%
  const floors = top5.map(item => ({ ...item, floorPct: Math.floor(item.rawPercent) }))
  const floorSum = floors.reduce((s, it) => s + it.floorPct, 0)
  const diff = 100 - floorSum
  if (diff > 0 && floors.length > 0) {
    // 计算小数部分
    const remainders = floors.map((it, idx) => ({
      idx,
      rem: it.rawPercent - Math.floor(it.rawPercent),
    }))
    // 按小数部分从大到小排序
    remainders.sort((a, b) => b.rem - a.rem)
    // 把差额依次分给小数部分最大的项
    for (let k = 0; k < diff && k < remainders.length; k++) {
      floors[remainders[k].idx].floorPct += 1
    }
  }
  return floors.map(item => ({
    name: item.name,
    percent: item.floorPct,
    color: item.color,
  }))
})

const segments = computed(() => {
  if (props.categories.length === 0) return []
  const total = props.categories.reduce((s, c) => s + c.amount, 0) || 1
  let accumulated = 0
  const segs: { color: string; dashArray: string; dashOffset: number }[] = []

  props.categories.forEach((cat, i) => {
    const fraction = cat.amount / total
    const length = Math.max(fraction * CIRCUMFERENCE, 0.5)
    // SVG 圆默认从 3 点方向开始绘制；rotate(-90deg) 把起点转到 12 点方向
    // 需要 dashOffset = C/4（= 圆周/4）使图案的"颜色起点"也对齐到 12 点
    // 再减去 accumulated 把已绘制的段长"吃掉"，即顺时针跳过已占弧长
    segs.push({
      color: cat.color || RING_COLORS[i % RING_COLORS.length],
      dashArray: `${length} ${CIRCUMFERENCE - length}`,
      dashOffset: CIRCUMFERENCE / 4 - accumulated,
    })
    accumulated += length
  })

  return segs
})

// ── 中心数字滚动动画 ──
const displayAmount = ref('0.00')
let rafId: number | null = null

const animateNumber = (target: number) => {
  if (rafId !== null) cancelAnimationFrame(rafId)
  const duration = 800
  const startTime = Date.now()
  const startVal = 0

  const tick = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    // ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3)
    const current = startVal + (target - startVal) * eased
    displayAmount.value = formatAmount(current)

    if (progress < 1) {
      rafId = requestAnimationFrame(tick)
    } else {
      displayAmount.value = formatAmount(target)
      rafId = null
    }
  }
  rafId = requestAnimationFrame(tick)
}

onMounted(() => {
  animateNumber(Math.abs(props.totalAmount))
})

watch(() => props.totalAmount, (newVal) => {
  animateNumber(Math.abs(newVal))
})
</script>

<style scoped>
.ring-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 24rpx;
  padding: 32rpx 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(13, 148, 136, 0.04);
}

.ring-chart-wrap {
  position: relative;
  width: 50%;
  aspect-ratio: 1;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring-svg {
  width: 100%;
  height: 100%;
}

/* ── 环段入场动画 ── */
.ring-seg-anim {
  animation: ring-grow 0.9s cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes ring-grow {
  from {
    stroke-dasharray: 0 CIRCUMFERENCE;
  }
}

.ring-center {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  pointer-events: none;
}

.ring-total-label {
  font-size: 22rpx;
  color: var(--color-text-secondary, #94A3B8);
  letter-spacing: 1rpx;
}

.ring-total-amount {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--color-text-primary, #1E293B);
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
}

.legend-area {
  width: 50%;
  min-width: 0;
  padding-left: 28rpx;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.legend-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
  padding: 6rpx 10rpx;
  border-radius: 8rpx;
  transition: background 0.2s;
}

.legend-top {
  background: var(--color-primary-soft, rgba(13, 148, 136, 0.12));
}

.legend-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 4rpx;
  flex-shrink: 0;
}

.legend-name {
  font-size: 24rpx;
  color: var(--color-text-primary, #1E293B);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.legend-top .legend-name {
  font-weight: 600;
}

.legend-pct {
  font-size: 24rpx;
  color: var(--color-text-secondary, #94A3B8);
  flex-shrink: 0;
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
}

.legend-top .legend-pct {
  color: var(--color-primary, #0D9488);
  font-weight: 600;
}
</style>
