<!--
  pages/statistics/index.vue - 统计页面
  功能：月度支出分类分析、近6月收支趋势、TOP排行
  技术：Vue3 + TypeScript + uni-app
-->
<template>
  <view class="page">
    <view class="month-selector">
      <view class="month-arrow" @tap="prevMonth">◀</view>
      <text class="month-text">{{ displayYearMonth }}</text>
      <view class="month-arrow" @tap="nextMonth">▶</view>
    </view>

    <view class="summary-row">
      <view class="summary-item">
        <text class="summary-label">支出</text>
        <text class="summary-value expense">-¥{{ formatAmount(monthExpense) }}</text>
      </view>
      <view class="summary-divider"></view>
      <view class="summary-item">
        <text class="summary-label">收入</text>
        <text class="summary-value income">¥{{ formatAmount(monthIncome) }}</text>
      </view>
    </view>

    <view v-if="loading" class="loading-state">
      <text class="loading-text">加载中...</text>
    </view>

    <view v-else class="content">
      <view v-if="ringChartData.length > 0" class="section">
        <text class="section-title">支出分类占比</text>
        <view class="ring-chart-wrap">
          <view class="ring-chart">
            <view class="ring-svg-wrap">
              <svg viewBox="0 0 100 100" class="ring-svg">
                <circle cx="50" cy="50" r="34" fill="none" stroke="#F1F5F9" stroke-width="12" />
                <circle
                  v-for="(seg, idx) in ringChartData"
                  :key="'seg-' + seg.typeId"
                  cx="50"
                  cy="50"
                  r="34"
                  fill="none"
                  :stroke="seg.color"
                  stroke-width="12"
                  :stroke-dasharray="seg.segmentLength + ' ' + ringCircumference"
                  :stroke-dashoffset="seg.segmentOffset"
                  stroke-linecap="butt"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <view class="ring-chart-inner">
                <text class="ring-chart-amount">¥{{ formatAmount(monthExpense) }}</text>
                <text class="ring-chart-label">总支出</text>
              </view>
            </view>
          </view>
          <view class="legend-area">
            <view
              v-for="(item, index) in ringChartData"
              :key="'leg-' + item.typeId"
              class="legend-row"
            >
              <view class="legend-color" :style="{ backgroundColor: item.color }"></view>
              <text class="legend-name">{{ item.name }}</text>
              <text class="legend-percent">{{ item.displayPercent.toFixed(1) }}%</text>
              <text class="legend-amount">¥{{ formatAmount(item.amount) }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="trendData.length > 0" class="section">
        <text class="section-title">近6月收支趋势</text>
        <view class="trend-chart">
          <view v-for="(m, i) in trendData" :key="m.month" class="trend-col">
            <view class="trend-bars">
              <view class="trend-bar income-bar" :style="{ height: barHeight(i, 'income') }"></view>
              <view class="trend-bar expense-bar" :style="{ height: barHeight(i, 'expense') }"></view>
            </view>
            <text class="trend-label">{{ m.label }}</text>
          </view>
        </view>
        <view class="trend-legend">
          <view class="legend-item">
            <view class="legend-dot income-dot"></view>
            <text class="legend-text">收入</text>
          </view>
          <view class="legend-item">
            <view class="legend-dot expense-dot"></view>
            <text class="legend-text">支出</text>
          </view>
        </view>
      </view>

      <view v-if="categoryBreakdown.length === 0 && trendData.length === 0" class="empty-state">
        <text class="empty-text">暂无数据</text>
      </view>
    </view>

    <CustomTabbar />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { recordApi } from '../../api/record'
import { categoryApi } from '../../api/category'
import CustomTabbar from '../../components/CustomTabbar.vue'
import { getCategoryIconClass } from '../../utils/category-icon-map'

const ICON_BG = 'rgba(0, 191, 255, 0.08)'

const getIconBg = () => ICON_BG

const getCategoryIcon = (categoryName: string): string => {
  return getCategoryIconClass(categoryName)
}

const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth() + 1)

const displayYearMonth = computed(() => `${currentYear.value}年${String(currentMonth.value).padStart(2, '0')}月`)
const yearMonth = computed(() => `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}`)

const monthIncome = ref(0)
const monthExpense = ref(0)
const loading = ref(false)
const categoryBreakdown = ref<{ typeId: number; name: string; icon: string; amount: number; percent: number }[]>([])
const trendData = ref<{ month: string; label: string; income: number; expense: number }[]>([])

const maxTrend = ref(0)

const RING_COLORS = ['#0D9488', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#10B981']

type RingSegment = {
  typeId: number
  name: string
  amount: number
  percent: number
  displayPercent: number
  color: string
  segmentLength: number
  segmentOffset: number
}

const ringChartData = computed<RingSegment[]>(() => {
  const raw = categoryBreakdown.value
  if (!raw || raw.length === 0) return []

  // ≤6 个分类：全部展示；>6：前5个 + "其他"
  let segments: RingSegment[]
  if (raw.length <= 6) {
    segments = raw.map((item, idx) => ({
      typeId: item.typeId,
      name: item.name,
      amount: item.amount,
      percent: item.percent,
      displayPercent: 0,
      color: RING_COLORS[idx % RING_COLORS.length],
      segmentLength: 0,
      segmentOffset: 0,
    }))
  } else {
    const top5 = raw.slice(0, 5)
    const rest = raw.slice(5)
    const restAmount = rest.reduce((sum, c) => sum + c.amount, 0)
    const total = monthExpense.value || 1
    const restPercent = (restAmount / total) * 100

    segments = [
      ...top5.map((item, idx) => ({
        typeId: item.typeId,
        name: item.name,
        amount: item.amount,
        percent: item.percent,
        displayPercent: 0,
        color: RING_COLORS[idx % RING_COLORS.length],
        segmentLength: 0,
        segmentOffset: 0,
      })),
      {
        typeId: -1,
        name: '其他',
        amount: restAmount,
        percent: restPercent,
        displayPercent: 0,
        color: RING_COLORS[5],
        segmentLength: 0,
        segmentOffset: 0,
      },
    ]
  }

  // 计算比例（0-1）用于 SVG 弧长
  const total = monthExpense.value || 1
  segments.forEach(s => {
    s.percent = (s.amount / total) * 100
  })

  // 让 displayPercent 总和精确等于 100（四舍五入后修正最后一项，避免 99.9% 或 100.1%）
  const n = segments.length
  const rounded = segments.map(s => Math.round(s.percent * 10) / 10)
  const sumRounded = rounded.reduce((a, b) => a + b, 0)
  const diff = Math.round((100 - sumRounded) * 10) / 10
  // 把差值加到最大的一项上（避免负数修正导致 0% 项变负）
  if (Math.abs(diff) >= 0.1 && n > 0) {
    let maxIdx = 0
    for (let i = 1; i < n; i++) {
      if (rounded[i] > rounded[maxIdx]) maxIdx = i
    }
    rounded[maxIdx] = Math.round((rounded[maxIdx] + diff) * 10) / 10
  }
  segments.forEach((s, i) => {
    s.displayPercent = rounded[i]
  })

  // 计算 SVG 圆环段：周长 C = 2*PI*r；每段长度 = C * (percent/100)；累计偏移用于 dashoffset
  const C = 2 * Math.PI * 34 // r=34（SVG viewBox 100，留出边距）
  let accumulated = 0
  for (const s of segments) {
    const ratio = Math.max(0, Math.min(1, s.percent / 100))
    s.segmentLength = C * ratio
    // 起点：从 12 点方向顺时针 → 先 -90deg rotate；再以累计长度作为偏移
    s.segmentOffset = C - accumulated
    accumulated += s.segmentLength
  }

  return segments
})

const ringCircumference = 2 * Math.PI * 34

const formatAmount = (val: number) => Math.abs(val).toFixed(2)

const barHeight = (i: number, type: 'income' | 'expense'): string => {
  const val = type === 'income' ? trendData.value[i].income : trendData.value[i].expense
  if (maxTrend.value <= 0) return '0rpx'
  return Math.max((val / maxTrend.value) * 160, 4) + 'rpx'
}

const prevMonth = () => {
  if (currentMonth.value === 1) {
    currentYear.value -= 1
    currentMonth.value = 12
  } else {
    currentMonth.value -= 1
  }
  loadData()
}

const nextMonth = () => {
  const now = new Date()
  if (currentYear.value === now.getFullYear() && currentMonth.value === now.getMonth() + 1) return
  if (currentMonth.value === 12) {
    currentYear.value += 1
    currentMonth.value = 1
  } else {
    currentMonth.value += 1
  }
  loadData()
}

const loadData = async () => {
  loading.value = true
  try {
    const [summaryRes, recordsRes] = await Promise.all([
      recordApi.getMonthSummary(yearMonth.value),
      recordApi.getRecordsByMonth(yearMonth.value, 1, 500),
    ])

    if (summaryRes.success && summaryRes.data) {
      monthIncome.value = summaryRes.data.income
      monthExpense.value = summaryRes.data.expense
    }

    if (recordsRes.success && recordsRes.data) {
      const expenseRecords = recordsRes.data.list.filter((r: any) => r.type === 'expense')

      const categoryMap = new Map<number, number>()
      expenseRecords.forEach((r: any) => {
        categoryMap.set(r.typeId, (categoryMap.get(r.typeId) || 0) + Math.abs(r.amount))
      })

      const categories = await categoryApi.getUserCategories('expense')
      const nameMap = new Map<number, string>()
      if (categories.success && categories.data) {
        categories.data.forEach((g: any) => {
          g.children?.forEach((c: any) => {
            nameMap.set(c.id, c.name)
          })
        })
      }

      const total = monthExpense.value || 1
      const breakdown = Array.from(categoryMap.entries())
        .map(([typeId, amount]) => ({
          typeId,
          name: nameMap.get(typeId) || '未知',
          icon: getCategoryIcon(nameMap.get(typeId) || ''),
          amount,
          percent: (amount / total) * 100,
        }))
        .sort((a, b) => b.amount - a.amount)

      categoryBreakdown.value = breakdown
    }
  } catch {
    // ignore
  }

  await loadTrend()
  loading.value = false
}

const loadTrend = async () => {
  const months: { year: number; month: number; label: string }[] = []
  for (let i = 5; i >= 0; i--) {
    let y = currentYear.value
    let m = currentMonth.value - i
    if (m <= 0) { y -= 1; m += 12 }
    months.push({ year: y, month: m, label: `${m}月` })
  }

  const trend: { month: string; label: string; income: number; expense: number }[] = []
  for (const mo of months) {
    try {
      const yyyymm = `${mo.year}-${String(mo.month).padStart(2, '0')}`
      const res = await recordApi.getMonthSummary(yyyymm)
      if (res.success && res.data) {
        trend.push({ month: yyyymm, label: mo.label, income: res.data.income, expense: res.data.expense })
      }
    } catch {
      trend.push({ month: '', label: mo.label, income: 0, expense: 0 })
    }
  }

  trendData.value = trend
  maxTrend.value = Math.max(...trend.map(t => Math.max(t.income, t.expense)), 1)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg-page, #F5F7FA);
  padding-bottom: 80px;
}

.month-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx 0;
  gap: 40rpx;
  background: var(--color-bg-card, #FFFFFF);
}

.month-arrow {
  font-size: var(--text-body);
  color: var(--color-text-secondary, #94A3B8);
  padding: 12rpx 20rpx;
}

.month-text {
  font-size: var(--text-title);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
  min-width: 180rpx;
  text-align: center;
}

.summary-row {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, var(--color-primary, #0D9488), var(--color-primary-dark, #0B7A70));
  margin: 20rpx;
  border-radius: 20rpx;
  padding: 32rpx 0;
}

.summary-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.summary-label {
  font-size: var(--text-small);
  color: rgba(255, 255, 255, 0.7);
}

.summary-value {
  font-size: var(--text-title);
  font-weight: 700;
  color: var(--color-text-inverse, #FFFFFF);
}

.summary-divider {
  width: 1rpx;
  height: 56rpx;
  background: rgba(255, 255, 255, 0.25);
}

.loading-state {
  padding: 100rpx 0;
  text-align: center;
}

.loading-text {
  font-size: var(--text-body);
  color: var(--color-text-secondary, #94A3B8);
}

.content {
  padding: 0 20rpx;
}

.section {
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: var(--text-body);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
  margin-bottom: 24rpx;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.ring-chart-wrap {
  display: flex;
  align-items: center;
  gap: 32rpx;
}

.ring-chart {
  flex-shrink: 0;
  width: 280rpx;
  height: 280rpx;
  position: relative;
}

.ring-svg-wrap {
  width: 100%;
  height: 100%;
  position: relative;
}

.ring-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.ring-chart-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  text-align: center;
}

.ring-chart-amount {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--color-text-primary, #1E293B);
  line-height: 1.2;
}

.ring-chart-label {
  font-size: 20rpx;
  color: var(--color-text-secondary, #94A3B8);
}

.legend-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  min-width: 0;
}

.legend-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: nowrap;
}

.legend-color {
  width: 16rpx;
  height: 16rpx;
  border-radius: 4rpx;
  flex-shrink: 0;
}

.legend-name {
  font-size: 24rpx;
  color: var(--color-text-primary, #1E293B);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.legend-percent {
  font-size: 24rpx;
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
  min-width: 76rpx;
  text-align: right;
  flex-shrink: 0;
}

.legend-amount {
  font-size: 22rpx;
  color: var(--color-text-secondary, #94A3B8);
  min-width: 120rpx;
  text-align: right;
  flex-shrink: 0;
}

.category-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.rank-num {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
  min-width: 32rpx;
  text-align: center;
}

.category-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.category-icon .category-icon-svg {
  width: 32rpx;
  height: 32rpx;
}

.category-name {
  font-size: var(--text-small);
  color: var(--color-text-primary, #1E293B);
  min-width: 100rpx;
}

.category-bar-wrap {
  flex: 1;
  height: 12rpx;
  background: var(--color-border-light, #F1F5F9);
  border-radius: 6rpx;
  overflow: hidden;
}

.category-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary, #0D9488), var(--color-primary-dark, #0B7A70));
  border-radius: 6rpx;
  transition: width 0.5s ease;
}

.category-amount {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
  font-weight: 500;
  min-width: 120rpx;
  text-align: right;
}

.category-percent {
  font-size: var(--text-note);
  color: var(--color-text-secondary, #94A3B8);
  min-width: 60rpx;
  text-align: right;
}

.trend-chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 240rpx;
  padding-top: 40rpx;
}

.trend-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  flex: 1;
}

.trend-bars {
  display: flex;
  gap: 6rpx;
  align-items: flex-end;
  height: 200rpx;
}

.trend-bar {
  width: 28rpx;
  border-radius: 6rpx 6rpx 0 0;
  transition: height 0.4s ease;
}

.income-bar {
  background: var(--color-success, #10B981);
}

.expense-bar {
  background: var(--color-primary, #0D9488);
}

.trend-label {
  font-size: var(--text-note);
  color: var(--color-text-secondary, #94A3B8);
}

.trend-legend {
  display: flex;
  justify-content: center;
  gap: 40rpx;
  margin-top: 20rpx;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.legend-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 4rpx;
}

.income-dot {
  background: var(--color-success, #10B981);
}

.expense-dot {
  background: var(--color-primary, #0D9488);
}

.legend-text {
  font-size: var(--text-note);
  color: var(--color-text-secondary, #94A3B8);
}

.empty-state {
  padding: 120rpx 0;
  text-align: center;
}

.empty-text {
  font-size: var(--text-body);
  color: var(--color-text-tertiary, #CBD5E1);
}
</style>
