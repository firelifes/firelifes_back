<!--
  pages/detail/cashflow.vue - 现金流分析页面
  功能：现金流总览（自由现金流、现金余额）、自由现金流趋势（柱状图+折线图）、其他指标
  技术：Vue3 + TypeScript + uni-app + Canvas 双轴图表
-->
<template>
  <view class="page">
    <view class="navbar">
      <view class="nav-back" @tap="goBack">
        <text class="nav-back-icon">‹</text>
      </view>
      <text class="nav-title">现金流</text>
      <view class="nav-placeholder"></view>
    </view>

    <scroll-view scroll-y class="scroll-area" refresher-enabled :refresher-triggered="isRefreshing" @refresherrefresh="handleRefresh">
      <!-- 总览卡片 -->
      <view class="overview-card">
        <view class="overview-left">
          <text class="overview-label">当月自由现金流</text>
          <text class="overview-amount" :class="{ 'is-negative': summary.currentMonthFreeCashflow < 0 }">
            {{ formatSignedShort(summary.currentMonthFreeCashflow) }}
          </text>
          <text class="overview-sub">收入 - 支出</text>
        </view>
        <view class="overview-divider"></view>
        <view class="overview-right">
          <text class="overview-label">现金余额</text>
          <text class="overview-amount">{{ formatShort(summary.totalCashBalance) }}</text>
          <text class="overview-sub">现金 + 投资类账户</text>
        </view>
      </view>

      <!-- 自由现金流趋势 -->
      <view class="section-card">
        <view class="section-header">
          <text class="section-title">自由现金流趋势</text>
          <text class="section-sub">近 6 个月</text>
        </view>

        <view class="chart-container">
          <!-- 左轴标签 -->
          <view class="axis-left">
            <text class="axis-label">{{ formatShort(leftAxisMax) }}</text>
            <text class="axis-label zero">0</text>
            <text class="axis-label">{{ formatSignedShort(leftAxisMin) }}</text>
          </view>

          <!-- 图表主体（Canvas） -->
          <view class="chart-main">
            <canvas
              canvas-id="cashflowChart"
              id="cashflowChart"
              class="chart-canvas"
              :style="{ width: chartWidth + 'px', height: chartHeight + 'px' }"
            ></canvas>
            <!-- 横轴标签 -->
            <view class="axis-bottom">
              <view v-for="(item, idx) in summary.monthlyTrend" :key="item.month" class="axis-bottom-item">
                <text class="axis-bottom-label">{{ formatMonthLabel(item.month) }}</text>
              </view>
            </view>
          </view>

          <!-- 右轴标签 -->
          <view class="axis-right">
            <text class="axis-label">{{ formatShort(rightAxisMax) }}</text>
            <text class="axis-label zero">0</text>
            <text class="axis-label">{{ formatShort(rightAxisMin) }}</text>
          </view>
        </view>

        <!-- 图例 -->
        <view class="legend-row">
          <view class="legend-item">
            <view class="legend-bar bar-free"></view>
            <text class="legend-text">自由现金流</text>
          </view>
          <view class="legend-item">
            <view class="legend-dot dot-balance"></view>
            <text class="legend-text">现金余额</text>
          </view>
        </view>
      </view>

      <!-- 其他指标 -->
      <view class="section-card">
        <view class="section-header">
          <text class="section-title">其他指标</text>
        </view>

        <view class="metric-list">
          <!-- 储蓄率 -->
          <view class="metric-row">
            <view class="metric-icon">
              <view class="category-icon-svg category-icon-cunkuan"></view>
            </view>
            <view class="metric-info">
              <text class="metric-name">储蓄率</text>
              <view class="metric-bar-wrap">
                <view class="metric-bar" :style="{ width: Math.max(0, Math.min(100, summary.savingsRate)) + '%' }"></view>
              </view>
            </view>
            <view class="metric-value-wrap">
              <text class="metric-value">{{ summary.savingsRate.toFixed(1) }}%</text>
            </view>
          </view>

          <!-- 被动现金流 -->
          <view class="metric-row">
            <view class="metric-icon">
              <view class="category-icon-svg category-icon-licai"></view>
            </view>
            <view class="metric-info">
              <text class="metric-name">被动现金流</text>
              <view class="metric-bar-wrap">
                <view class="metric-bar metric-bar-alt" :style="{ width: Math.max(0, Math.min(100, summary.passiveCashflowRatio)) + '%' }"></view>
              </view>
            </view>
            <view class="metric-value-wrap">
              <text class="metric-value">{{ summary.passiveCashflowRatio.toFixed(0) }}%</text>
              <text class="metric-amount">{{ formatShort(summary.passiveCashflow) }}</text>
            </view>
          </view>

          <!-- 非必要支出 -->
          <view class="metric-row">
            <view class="metric-icon">
              <view class="category-icon-svg category-icon-yule"></view>
            </view>
            <view class="metric-info">
              <text class="metric-name">非必要支出</text>
              <view class="metric-bar-wrap">
                <view class="metric-bar metric-bar-warn" :style="{ width: Math.max(0, Math.min(100, summary.nonEssentialExpenseRatio)) + '%' }"></view>
              </view>
            </view>
            <view class="metric-value-wrap">
              <text class="metric-value">{{ summary.nonEssentialExpenseRatio.toFixed(0) }}%</text>
              <text class="metric-amount">{{ formatShort(summary.nonEssentialExpense) }}</text>
            </view>
          </view>

          <!-- 债务覆盖倍数 -->
          <view class="metric-row">
            <view class="metric-icon">
              <view class="category-icon-svg category-icon-fangdai"></view>
            </view>
            <view class="metric-info">
              <text class="metric-name">债务覆盖倍数</text>
              <text class="metric-sub">月度自由现金流 ÷ 月度债务偿还</text>
            </view>
            <view class="metric-value-wrap">
              <text class="metric-value">{{ summary.debtCoverage.toFixed(1) }}x</text>
            </view>
          </view>

          <!-- 生存月数 -->
          <view class="metric-row">
            <view class="metric-icon">
              <view class="category-icon-svg category-icon-shijian"></view>
            </view>
            <view class="metric-info">
              <text class="metric-name">生存月数</text>
              <text class="metric-sub">现金余额 ÷ 月度必要支出</text>
            </view>
            <view class="metric-value-wrap">
              <text class="metric-value">{{ summary.survivalMonths.toFixed(1) }} 月</text>
            </view>
          </view>
        </view>
      </view>

      <view class="footer-space"></view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, reactive } from 'vue'
import { cashflowApi, type CashflowSummaryData, type CashflowMonthTrendItem } from '../../api/cashflow'

// 初始空数据
const emptySummary: CashflowSummaryData = {
  currentMonthFreeCashflow: 0,
  totalCashBalance: 0,
  monthlyTrend: [],
  savingsRate: 0,
  passiveCashflowRatio: 0,
  passiveCashflow: 0,
  nonEssentialExpenseRatio: 0,
  nonEssentialExpense: 0,
  debtCoverage: 0,
  survivalMonths: 0,
  totalIncome: 0,
  totalExpense: 0,
  monthlyDebtRepayment: 0,
  monthlyEssentialExpense: 0,
}

const summary = reactive<CashflowSummaryData>({ ...emptySummary })
const isRefreshing = ref(false)

// 图表尺寸
const chartWidth = ref(280)
const chartHeight = ref(200)

// 计算左右轴范围
const leftAxisMax = computed(() => {
  const values = summary.monthlyTrend.map((t) => t.freeCashflow)
  const maxAbs = Math.max(...values.map((v) => Math.abs(v)), 1)
  return niceNumber(maxAbs, true)
})

const leftAxisMin = computed(() => -leftAxisMax.value)

const rightAxisMax = computed(() => {
  const values = summary.monthlyTrend.map((t) => t.cashBalance)
  const max = Math.max(...values, 0, 1)
  return niceNumber(max, true)
})

const rightAxisMin = computed(() => 0)

// 工具函数
function niceNumber(value: number, round: boolean): number {
  if (value <= 0) return 100
  const exp = Math.floor(Math.log10(value))
  const f = value / Math.pow(10, exp)
  let nf: number
  if (round) {
    if (f < 1.5) nf = 1
    else if (f < 3) nf = 2
    else if (f < 7) nf = 5
    else nf = 10
  } else {
    if (f <= 1) nf = 1
    else if (f <= 2) nf = 2
    else if (f <= 5) nf = 5
    else nf = 10
  }
  return nf * Math.pow(10, exp)
}

function formatShort(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 10000) return (value / 10000).toFixed(1) + 'w'
  if (abs >= 1000) return (value / 1000).toFixed(1) + 'k'
  return value.toFixed(0)
}

function formatSignedShort(value: number): string {
  if (value > 0) return '+' + formatShort(value)
  return formatShort(value)
}

function formatMonthLabel(month: string): string {
  if (!month) return ''
  const parts = month.split('-')
  if (parts.length >= 2) return parseInt(parts[1]) + '月'
  return month
}

// 绘制图表
function drawChart() {
  const ctx = uni.createCanvasContext('cashflowChart')
  const W = chartWidth.value
  const H = chartHeight.value
  const padding = { top: 10, bottom: 0, left: 0, right: 0 }
  const chartAreaW = W - padding.left - padding.right
  const chartAreaH = H - padding.top - padding.bottom

  // 清空
  ctx.clearRect(0, 0, W, H)

  // 零轴位置（左轴的0坐标）
  const leftRange = leftAxisMax.value - leftAxisMin.value || 1
  const zeroY = padding.top + chartAreaH * ((leftAxisMax.value) / leftRange)

  // 画零线（浅色横线）
  ctx.setStrokeStyle('#E2E8F0')
  ctx.setLineWidth(1)
  ctx.beginPath()
  ctx.moveTo(padding.left, zeroY)
  ctx.lineTo(padding.left + chartAreaW, zeroY)
  ctx.stroke()

  // 画顶部和底部参考线
  ctx.setStrokeStyle('#F1F5F9')
  ctx.beginPath()
  ctx.moveTo(padding.left, padding.top)
  ctx.lineTo(padding.left + chartAreaW, padding.top)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(padding.left, padding.top + chartAreaH)
  ctx.lineTo(padding.left + chartAreaW, padding.top + chartAreaH)
  ctx.stroke()

  if (summary.monthlyTrend.length === 0) {
    ctx.draw()
    return
  }

  const barGap = 8
  const barAreaW = chartAreaW / summary.monthlyTrend.length
  const barWidth = Math.min(barAreaW - barGap, 28)

  // 右轴范围（用于折线）
  const rightRange = rightAxisMax.value - rightAxisMin.value || 1

  // 画柱状图（自由现金流）
  summary.monthlyTrend.forEach((item, idx) => {
    const centerX = padding.left + barAreaW * (idx + 0.5)
    const barLeft = centerX - barWidth / 2

    // 柱状图高度（相对于零轴）
    const value = item.freeCashflow
    const height = Math.abs(value) / (leftRange / 2) * (chartAreaH / 2)
    const clampedHeight = Math.min(height, chartAreaH / 2)

    if (value >= 0) {
      // 正数：从零轴向上画
      ctx.setFillStyle('#0D9488')
      ctx.beginPath()
      // 使用圆角矩形
      const barY = zeroY - clampedHeight
      ctx.moveTo(barLeft, zeroY)
      ctx.lineTo(barLeft, barY + 4)
      ctx.arc(barLeft + 4, barY + 4, 4, Math.PI, Math.PI * 1.5)
      ctx.lineTo(barLeft + barWidth - 4, barY)
      ctx.arc(barLeft + barWidth - 4, barY + 4, 4, Math.PI * 1.5, Math.PI * 2)
      ctx.lineTo(barLeft + barWidth, zeroY)
      ctx.closePath()
      ctx.fill()
    } else {
      // 负数：从零轴向下画
      ctx.setFillStyle('#EF4444')
      ctx.beginPath()
      const barY = zeroY + clampedHeight
      ctx.moveTo(barLeft, zeroY)
      ctx.lineTo(barLeft, barY - 4)
      ctx.arc(barLeft + 4, barY - 4, 4, Math.PI * 0.5, Math.PI)
      ctx.lineTo(barLeft + barWidth - 4, barY)
      ctx.arc(barLeft + barWidth - 4, barY - 4, 4, 0, Math.PI * 0.5)
      ctx.lineTo(barLeft + barWidth, zeroY)
      ctx.closePath()
      ctx.fill()
    }
  })

  // 画折线图（现金余额）
  ctx.setStrokeStyle('#1E293B')
  ctx.setLineWidth(2)
  ctx.beginPath()
  summary.monthlyTrend.forEach((item, idx) => {
    const centerX = padding.left + barAreaW * (idx + 0.5)
    const value = item.cashBalance
    const y = padding.top + chartAreaH - ((value - rightAxisMin.value) / rightRange) * chartAreaH
    const clampedY = Math.max(padding.top, Math.min(padding.top + chartAreaH, y))
    if (idx === 0) ctx.moveTo(centerX, clampedY)
    else ctx.lineTo(centerX, clampedY)
  })
  ctx.stroke()

  // 画折线上的数据点
  summary.monthlyTrend.forEach((item, idx) => {
    const centerX = padding.left + barAreaW * (idx + 0.5)
    const value = item.cashBalance
    const y = padding.top + chartAreaH - ((value - rightAxisMin.value) / rightRange) * chartAreaH
    const clampedY = Math.max(padding.top, Math.min(padding.top + chartAreaH, y))
    ctx.setFillStyle('#1E293B')
    ctx.beginPath()
    ctx.arc(centerX, clampedY, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.setFillStyle('#FFFFFF')
    ctx.beginPath()
    ctx.arc(centerX, clampedY, 2, 0, Math.PI * 2)
    ctx.fill()
  })

  ctx.draw()
}

// 加载数据
const loadData = async () => {
  try {
    const res = await cashflowApi.getSummary()
    if (res.success && res.data) {
      Object.assign(summary, res.data)
      await nextTick()
      setTimeout(() => drawChart(), 100)
    }
  } catch (e) {
    console.error('加载现金流失败', e)
  }
}

const handleRefresh = async () => {
  isRefreshing.value = true
  try {
    await loadData()
  } finally {
    isRefreshing.value = false
  }
}

const goBack = () => {
  uni.navigateBack({ fail: () => uni.redirectTo({ url: '/pages/detail/index' }) })
}

onMounted(() => {
  // 自适应尺寸
  const sysInfo = uni.getSystemInfoSync()
  const screenW = sysInfo.windowWidth || 375
  chartWidth.value = Math.max(240, screenW * 0.65)
  chartHeight.value = 200
  loadData()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg-page, #F5F7FA);
  display: flex;
  flex-direction: column;
}

.navbar {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  background: var(--color-bg-card, #FFFFFF);
  padding-top: calc(var(--status-bar-height, 40rpx) + 20rpx);
}

.nav-back {
  padding: 8rpx 16rpx;
  margin-left: -16rpx;
}

.nav-back-icon {
  font-size: 48rpx;
  color: var(--color-text-primary, #1E293B);
  font-weight: 300;
  line-height: 1;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: var(--text-title);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}

.nav-placeholder {
  width: 80rpx;
}

.scroll-area {
  flex: 1;
  height: 0;
}

/* 总览卡片 */
.overview-card {
  display: flex;
  align-items: center;
  margin: 20rpx;
  padding: 36rpx 24rpx;
  background: linear-gradient(135deg, var(--color-primary, #0D9488), var(--color-primary-dark, #0B7A70));
  border-radius: 20rpx;
}

.overview-left,
.overview-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.overview-divider {
  width: 1rpx;
  height: 80rpx;
  background: rgba(255, 255, 255, 0.25);
}

.overview-label {
  font-size: var(--text-note);
  color: rgba(255, 255, 255, 0.75);
}

.overview-amount {
  font-size: 44rpx;
  font-weight: 700;
  color: #FFFFFF;
  line-height: 1.2;
}

.overview-amount.is-negative {
  color: #FECACA;
}

.overview-sub {
  font-size: var(--text-note);
  color: rgba(255, 255, 255, 0.6);
}

/* 区块卡片 */
.section-card {
  margin: 0 20rpx 20rpx;
  padding: 28rpx;
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 20rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: var(--text-body);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}

.section-sub {
  font-size: var(--text-note);
  color: var(--color-text-secondary, #94A3B8);
}

/* 图表容器 */
.chart-container {
  display: flex;
  align-items: stretch;
  gap: 8rpx;
}

.axis-left,
.axis-right {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 10rpx 0 0;
  min-width: 60rpx;
}

.axis-left {
  align-items: flex-end;
}

.axis-right {
  align-items: flex-start;
}

.axis-label {
  font-size: 20rpx;
  color: var(--color-text-secondary, #94A3B8);
  line-height: 1;
}

.axis-label.zero {
  color: var(--color-text-tertiary, #CBD5E1);
}

.chart-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chart-canvas {
  width: 280px;
  height: 200px;
}

.axis-bottom {
  display: flex;
  justify-content: space-around;
  width: 100%;
  margin-top: 8rpx;
}

.axis-bottom-item {
  flex: 1;
  text-align: center;
}

.axis-bottom-label {
  font-size: 20rpx;
  color: var(--color-text-secondary, #94A3B8);
}

/* 图例 */
.legend-row {
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

.legend-bar {
  width: 24rpx;
  height: 12rpx;
  border-radius: 4rpx;
}

.bar-free {
  background: #0D9488;
}

.legend-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  border: 2rpx solid #FFFFFF;
}

.dot-balance {
  background: #1E293B;
  box-shadow: 0 0 0 2rpx #1E293B;
}

.legend-text {
  font-size: var(--text-note);
  color: var(--color-text-secondary, #94A3B8);
}

/* 指标列表 */
.metric-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.metric-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.metric-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: rgba(13, 148, 136, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.metric-icon .category-icon-svg {
  width: 32rpx;
  height: 32rpx;
  color: var(--color-primary, #0D9488);
}

.metric-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.metric-name {
  font-size: var(--text-small);
  color: var(--color-text-primary, #1E293B);
  font-weight: 500;
}

.metric-sub {
  font-size: 20rpx;
  color: var(--color-text-tertiary, #CBD5E1);
}

.metric-bar-wrap {
  height: 10rpx;
  background: var(--color-border-light, #F1F5F9);
  border-radius: 6rpx;
  overflow: hidden;
}

.metric-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary, #0D9488), var(--color-primary-dark, #0B7A70));
  border-radius: 6rpx;
  transition: width 0.5s ease;
}

.metric-bar-alt {
  background: linear-gradient(90deg, #6366F1, #4F46E5);
}

.metric-bar-warn {
  background: linear-gradient(90deg, #F59E0B, #D97706);
}

.metric-value-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
  min-width: 120rpx;
}

.metric-value {
  font-size: var(--text-small);
  color: var(--color-text-primary, #1E293B);
  font-weight: 600;
}

.metric-amount {
  font-size: 20rpx;
  color: var(--color-text-secondary, #94A3B8);
}

.footer-space {
  height: 60rpx;
}
</style>
