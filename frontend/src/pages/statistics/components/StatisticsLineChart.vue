<!--
  StatisticsLineChart.vue - SVG 折线图组件 v3
  升级点：
  1. 折线下方渐变填充（主色 12% → 0%）
  2. 路径入场动画（stroke-dashoffset 1.2s ease-out）
  3. 数据点弹出动画（cubic-bezier 0.34, 1.56, 0.64, 1，错开 30ms）
  4. 点击数据点：浮动气泡显示金额
  5. maxVal 标签动态定位（避让数据点）
-->
<template>
  <view class="line-card">
    <view class="line-summary">
      <view class="line-sum-item">
        <text class="line-sum-label">{{ typeLabel }}：</text>
        <text class="line-sum-value line-sum-value-primary">¥{{ formatAmount(totalAmount) }}</text>
      </view>
      <view class="line-sum-divider"></view>
      <view class="line-sum-item">
        <text class="line-sum-label">平均值：</text>
        <text class="line-sum-value">¥{{ formatAmount(average) }}/{{ labelUnit }}</text>
      </view>
    </view>

    <view ref="chartWrapRef" class="line-chart-wrap" @tap="onChartTap">
      <svg
        class="line-svg"
        :viewBox="`0 0 ${W} ${H}`"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <!-- 折线下方渐变 -->
          <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" :stop-color="DOT_FILL_COLOR" stop-opacity="0.22" />
            <stop offset="100%" :stop-color="DOT_FILL_COLOR" stop-opacity="0" />
          </linearGradient>
        </defs>

        <!-- 水平网格线 -->
        <line v-for="(y, i) in gridYs" :key="'g'+i"
          :x1="padLR" :y1="y" :x2="W - padLR" :y2="y"
          stroke="#F1F5F9" stroke-width="0.5" />

        <!-- 最大值参考虚线 -->
        <line v-if="maxVal > 0"
          :x1="padLR" :y1="maxValY" :x2="W - padLR" :y2="maxValY"
          stroke="#CBD5E1" stroke-width="0.5" stroke-dasharray="4 3" />

        <!-- 折线下方填充 -->
        <polygon
          v-if="coords.length >= 2"
          :points="areaPoints"
          :fill="`url(#${gradientId})`"
          class="line-area"
        />

        <!-- 折线（带入场动画） -->
        <polyline
          v-if="coords.length >= 2"
          :points="polylinePoints"
          fill="none"
          :stroke="DOT_FILL_COLOR"
          stroke-width="2"
          stroke-linejoin="round"
          stroke-linecap="round"
          class="line-path"
          :style="{ strokeDasharray: polylineLength, strokeDashoffset: polylineLength }"
        />

        <!-- 数据点：实心 + 描边（点击有反馈） -->
        <g v-for="(pt, i) in coords" :key="'pt'+i"
          :class="['pt-group', 'pt-anim', pt.value > 0 ? 'pt-active' : 'pt-empty']"
          :style="{ animationDelay: 0.3 + i * 0.02 + 's' }"
          @tap.stop="onPointTap(i, $event)">
          <!-- 触摸热区（半径更大，提升点击体验） -->
          <circle :cx="pt.x" :cy="pt.y" r="8" fill="transparent" />
          <!-- 实际点 -->
          <circle
            :cx="pt.x" :cy="pt.y" r="2.8"
            :fill="pt.value > 0 ? DOT_FILL_COLOR : '#FFFFFF'"
            :stroke="DOT_FILL_COLOR"
            stroke-width="1.2"
          />
        </g>

        <!-- X 轴底线 -->
        <line :x1="padLR" :y1="chartBtm" :x2="W - padLR" :y2="chartBtm"
          stroke="#E2E8F0" stroke-width="0.5" />
      </svg>

      <!-- 最大值金额标签：跟随最大点位置 -->
      <view v-if="maxVal > 0" class="max-tag" :style="maxTagStyle">
        ¥{{ formatAmount(maxVal) }}
      </view>

      <!-- 浮动气泡：点击数据点显示金额（精修版：渐变 + 毛玻璃 + 三角箭头） -->
      <view v-if="activePoint" class="point-tooltip" :style="tooltipStyle">
        <view class="point-tooltip-inner">
          <text class="point-tooltip-day">{{ activePoint.label }}</text>
          <text class="point-tooltip-amount">¥{{ formatAmount(activePoint.value) }}</text>
        </view>
        <view class="point-tooltip-arrow" />
      </view>

      <!-- X 轴标签 -->
      <view class="x-axis-row">
        <view v-for="(lb, i) in xLabels" :key="'xl'+i"
          class="x-axis-label"
          :style="{ left: lb.pct + '%' }"
        >{{ lb.text }}</view>
      </view>

      <EmptyState
        v-if="points.length === 0"
        type="no-data"
        title="暂无趋势数据"
        size="small"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { formatCurrency } from '../../../utils/format'
import EmptyState from '../../../components/EmptyState.vue'

interface DataPoint {
  label: string
  value: number
  isMax: boolean
}

const props = defineProps<{
  points: DataPoint[]
  totalAmount: number
  type: 'expense' | 'income' | 'transfer'
  dimension?: 'month' | 'year'
  totalDays?: number
}>()

const emit = defineEmits<{
  (e: 'day-tap', day: number): void
}>()

const formatAmount = (v: number) => formatCurrency(Math.abs(v))

const typeLabel = computed(() => {
  if (props.type === 'expense') return '总支出'
  if (props.type === 'income') return '总收入'
  return '总转账'
})

const labelUnit = computed(() => props.dimension === 'year' ? '月' : '天')

const average = computed(() => {
  if (props.totalAmount <= 0) return 0
  const days = props.totalDays || 1
  return Math.round(props.totalAmount / days)
})

// ── SVG 坐标系统 ──
const W = 360, H = 260
const padLR = 8
const padT = 44
const padB = 48
const chartW = W - padLR * 2
const chartH = H - padT - padB
const chartTop = padT
const chartBtm = padT + chartH

// 主色（折线 + 数据点），用主题色
const DOT_FILL_COLOR = '#0D9488'

// 渐变 ID：每实例唯一，避免多页面 ID 冲突
// uni-app 不支持 Vue 3.5 useId，用自增 ID 替代
let _chartIdCounter = 0
const chartId = ref(_chartIdCounter++)
const gradientId = `line-grad-${chartId.value}`

const gridYs = computed(() => [0, 1, 2, 3].map(i => chartTop + (chartH / 3) * i))

const maxVal = computed(() => {
  if (props.points.length === 0) return 0
  return Math.max(...props.points.map(p => p.value))
})

const coords = computed(() => {
  if (props.points.length === 0) return []
  const max = maxVal.value || 1
  const stepX = props.points.length > 1 ? chartW / (props.points.length - 1) : chartW / 2

  return props.points.map((p, i) => ({
    x: padLR + stepX * i,
    y: chartBtm - (p.value / max) * chartH,
    ...p,
  }))
})

const polylinePoints = computed(() =>
  coords.value.map(pt => `${pt.x},${pt.y}`).join(' ')
)

// 折线下方多边形：从第一个点下方到最后一个点下方，围成填充区
const areaPoints = computed(() => {
  if (coords.value.length < 2) return ''
  const top = coords.value.map(pt => `${pt.x},${pt.y}`).join(' ')
  const first = coords.value[0]
  const last = coords.value[coords.value.length - 1]
  return `${top} ${last.x},${chartBtm} ${first.x},${chartBtm}`
})

// 估算折线总长度（用于 stroke-dasharray 入场动画）
const polylineLength = computed(() => {
  let len = 0
  for (let i = 1; i < coords.value.length; i++) {
    const dx = coords.value[i].x - coords.value[i-1].x
    const dy = coords.value[i].y - coords.value[i-1].y
    len += Math.sqrt(dx*dx + dy*dy)
  }
  return Math.ceil(len)
})

// 最大点 Y 坐标（用于虚线 + 标签定位）
const maxValY = computed(() => {
  const m = coords.value.find(c => c.isMax)
  return m ? m.y : chartTop
})

// maxVal 标签位置：随最大点移动，避免遮挡
const maxTagStyle = computed(() => {
  const m = coords.value.find(c => c.isMax)
  if (!m) return { top: '8rpx', right: '8rpx' }
  // 标签定位到最大点正上方 8rpx
  return {
    top: `calc(${(m.y / H) * 100}% - 18rpx)`,
    left: `${(m.x / W) * 100}%`,
    transform: 'translateX(-50%)',
  }
})

// 浮动气泡：点击数据点显示
const activePoint = ref<{ idx: number; x: number; y: number; label: string; value: number } | null>(null)

const tooltipStyle = computed(() => {
  if (!activePoint.value) return { display: 'none' }
  const { x, y } = activePoint.value
  // 气泡显示在点的正上方
  return {
    left: `${(x / W) * 100}%`,
    top: `calc(${(y / H) * 100}% - 56rpx)`,
    transform: 'translateX(-50%)',
  }
})

const onPointTap = (idx: number, e: any) => {
  const pt = coords.value[idx]
  if (!pt) return
  e?.preventDefault?.()
  if (activePoint.value?.idx === idx) {
    activePoint.value = null
    return
  }
  activePoint.value = { idx, x: pt.x, y: pt.y, label: pt.label, value: pt.value }
  // 3 秒后自动消失
  setTimeout(() => {
    if (activePoint.value?.idx === idx) activePoint.value = null
  }, 3000)
}

const xLabels = computed(() => {
  if (props.points.length === 0) return []
  const total = props.points.length
  const labels: { pct: number; text: string }[] = []

  for (let i = 0; i < total; i++) {
    if (i === 0 || i === total - 1 || (i + 1) % 5 === 0) {
      const x = padLR + (chartW / (total - 1 || 1)) * i
      const raw = props.points[i].label.replace(/[^0-9]/g, '')
      const num = parseInt(raw, 10)
      labels.push({
        pct: (x / W) * 100,
        text: String(num).padStart(2, '0'),
      })
    }
  }
  return labels
})

const chartWrapRef = ref<any>(null)

const onChartTap = (e: any) => {
  // 点击非数据点区域：清掉气泡
  activePoint.value = null
  if (props.points.length === 0) return
  try {
    const el = (chartWrapRef.value?.$el || chartWrapRef.value) as HTMLElement | null
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (!rect || rect.width <= 0) return

    const clientX: number =
      (e.touches && e.touches[0]?.clientX) ??
      (e.changedTouches && e.changedTouches[0]?.clientX) ??
      e.clientX ??
      e.detail?.x ??
      e.detail?.clientX ??
      0
    const tapX = clientX - rect.left
    if (tapX < 0 || tapX > rect.width) return

    const total = props.points.length
    const stepPx = rect.width / total
    const idx = Math.round(tapX / stepPx - 0.5)
    const clamped = Math.max(0, Math.min(total - 1, idx))
    const raw = props.points[clamped].label.replace(/[^0-9]/g, '')
    const day = parseInt(raw, 10)
    if (day > 0) emit('day-tap', day)
  } catch {
    // 静默
  }
}
</script>

<style scoped>
.line-card {
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(13, 148, 136, 0.04);
}

.line-summary {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  margin-bottom: 24rpx;
  gap: 24rpx;
}

.line-sum-item {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 8rpx;
  flex: 1;
  justify-content: center;
}

.line-sum-divider {
  width: 1rpx;
  height: 28rpx;
  background: var(--color-border, #E2E8F0);
}

.line-sum-label { font-size: 24rpx; color: var(--color-text-secondary, #94A3B8); }
.line-sum-value { font-size: 28rpx; font-weight: 600; color: var(--color-text-primary, #1E293B); }
.line-sum-value-primary { color: var(--color-primary, #0D9488); }

.line-chart-wrap {
  position: relative;
  width: 100%;
  background: linear-gradient(180deg, rgba(13, 148, 136, 0.02) 0%, rgba(13, 148, 136, 0) 60%);
  border-radius: 16rpx;
  overflow: hidden;
  cursor: pointer;
}

.line-svg {
  display: block;
  width: 100%;
  height: auto;
}

/* ── 折线入场动画（用 stroke-dashoffset 渐进） ── */
.line-path {
  animation: line-draw 1.2s ease-out forwards;
}

@keyframes line-draw {
  to { stroke-dashoffset: 0; }
}

/* ── 填充渐入 ── */
.line-area {
  animation: area-fade 0.8s ease-out 0.4s both;
}

@keyframes area-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* ── 数据点弹出动画 ── */
.pt-anim circle:last-child {
  transform-origin: center;
  transform-box: fill-box;
  animation: pt-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes pt-pop {
  from { transform: scale(0); }
  to   { transform: scale(1); }
}

/* ── 数据点交互反馈 ── */
.pt-group {
  cursor: pointer;
}

.pt-group:hover circle:last-child {
  r: 3.5;
  transition: r 0.15s ease;
}

/* 最大值标签 */
.max-tag {
  position: absolute;
  font-size: 20rpx;
  color: var(--color-text-secondary, #94A3B8);
  line-height: 1;
  z-index: 2;
  white-space: nowrap;
  padding: 4rpx 8rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 6rpx;
  pointer-events: none;
}

/* ── 浮动气泡（精修版：渐变背景 + 毛玻璃 + 三角箭头） ── */
.point-tooltip {
  position: absolute;
  z-index: 10;
  pointer-events: none;
  white-space: nowrap;
  animation: tooltip-pop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  filter: drop-shadow(0 6rpx 16rpx rgba(13, 148, 136, 0.28))
          drop-shadow(0 2rpx 6rpx rgba(0, 0, 0, 0.12));
}

.point-tooltip-inner {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.96) 0%, rgba(15, 23, 42, 0.96) 100%);
  backdrop-filter: blur(8rpx);
  color: var(--color-text-inverse, #FFFFFF);
  padding: 12rpx 20rpx;
  border-radius: 14rpx;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  align-items: center;
  border: 1rpx solid rgba(13, 148, 136, 0.3);
}

/* 三角箭头：朝下指向数据点 */
.point-tooltip-arrow {
  width: 0;
  height: 0;
  border-left: 8rpx solid transparent;
  border-right: 8rpx solid transparent;
  border-top: 10rpx solid rgba(15, 23, 42, 0.96);
  margin-top: -1rpx;
}

.point-tooltip-day {
  font-size: 18rpx;
  opacity: 0.7;
}

.point-tooltip-amount {
  font-size: 24rpx;
  font-weight: 700;
}

@keyframes tooltip-pop {
  from { opacity: 0; transform: translateX(-50%) translateY(4rpx) scale(0.8); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
}

.x-axis-row {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(48 / 260 * 100%);
  pointer-events: none;
}

.x-axis-label {
  position: absolute;
  transform: translateX(-50%);
  bottom: 4rpx;
  font-size: 20rpx;
  color: var(--color-text-secondary, #94A3B8);
  line-height: 1;
}
</style>
