<template>
  <view class="budget-progress">
    <view v-if="loading" class="loading-state">
      <text class="loading-text">加载中...</text>
    </view>

    <view v-else-if="!overview && !hasAnnualData" class="empty-state">
      <text class="empty-title">还没有设置预算</text>
      <text class="empty-hint">点击右上角 <text class="inline-icon">设置</text> 年度预算，开始管理支出</text>
    </view>

    <template v-else>
      <!-- 年度预算摘要 -->
      <view v-if="annualSummary" class="overview-card annual-card">
        <view class="overview-header">
          <text class="overview-title">{{ annualSummary.year }}年 年度预算</text>
        </view>
        <view class="overview-grid">
          <view class="overview-item">
            <text class="ov-label">年度总预算</text>
            <text class="ov-value">¥{{ formatAmount(annualSummary.totalYearlyBudget) }}</text>
          </view>
          <view class="overview-item">
            <text class="ov-label">年度已支出</text>
            <text class="ov-value expense">¥{{ formatAmount(annualSummary.totalYearlySpent) }}</text>
          </view>
          <view class="overview-item">
            <text class="ov-label">年度剩余</text>
            <text class="ov-value" :class="annualRemaining >= 0 ? 'income' : 'expense'">
              ¥{{ formatAmount(annualRemaining) }}
            </text>
          </view>
          <view class="overview-item">
            <text class="ov-label">已过月份</text>
            <text class="ov-value">{{ currentMonth }}/12</text>
          </view>
        </view>
        <BudgetBar
          :spent="annualSummary.totalYearlySpent"
          :amount="annualSummary.totalYearlyBudget"
          :show-label="true"
        />
      </view>

      <!-- 月度预算总览 -->
      <view v-if="overview" class="overview-card">
        <view class="overview-header">
          <text class="overview-title">{{ overview.year }}年{{ overview.month }}月 月度预算</text>
        </view>
        <view class="overview-grid">
          <view class="overview-item">
            <text class="ov-label">月度总预算</text>
            <text class="ov-value">¥{{ formatAmount(overview.totalBudget) }}</text>
          </view>
          <view class="overview-item">
            <text class="ov-label">已支出</text>
            <text class="ov-value expense">¥{{ formatAmount(overview.totalUsed) }}</text>
          </view>
          <view class="overview-item">
            <text class="ov-label">剩余</text>
            <text class="ov-value" :class="overview.totalRemaining >= 0 ? 'income' : 'expense'">
              ¥{{ formatAmount(overview.totalRemaining) }}
            </text>
          </view>
          <view class="overview-item">
            <text class="ov-label">日均可用</text>
            <text class="ov-value">¥{{ formatAmount(overview.dailyAverage) }}</text>
          </view>
        </view>
        <BudgetBar
          :spent="overview.totalUsed"
          :amount="overview.totalBudget"
          :show-label="true"
        />
        <text class="projected-text">预计月末余额 ¥{{ formatAmount(overview.projectedMonthEnd) }}</text>
      </view>

      <!-- 预警区域 -->
      <view v-if="warningBudgets.length > 0" class="alert-section">
        <view class="section-title-row">
          <view class="section-title-icon category-icon-svg category-icon-jinggao"></view>
          <text class="section-title">预算预警</text>
        </view>
        <view v-for="item in displayWarnings" :key="item.id" class="alert-card" :class="'alert-' + item.alertStatus">
          <view class="alert-left">
            <view class="alert-icon category-icon-svg" :class="item.alertStatus === 'danger' ? 'category-icon-hongse' : 'category-icon-huangse'"></view>
            <view class="alert-info">
              <text class="alert-name">{{ item.name }}</text>
              <text class="alert-detail">
                {{ item.alertStatus === 'danger' ? '已超支' : '接近预算' }}
                {{ item.usedPercentage.toFixed(0) }}%
                 · 预算¥{{ formatAmount(item.amount) }} · 已用¥{{ formatAmount(item.spent) }}
              </text>
            </view>
          </view>
        </view>
        <view v-if="warningBudgets.length > 2" class="alert-more" @tap="showAllWarnings = !showAllWarnings">
          <text>{{ showAllWarnings ? '收起' : `+${warningBudgets.length - 2}条更多预警` }}</text>
        </view>
      </view>

      <!-- 分类预算进度 -->
      <view v-if="overview && overview.budgets.length > 0" class="category-section">
        <text class="section-title">分类预算进度</text>
        <view v-for="item in overview.budgets" :key="item.id" class="category-card" @tap="toggleExpand(item.id)">
          <view class="category-header">
            <text class="category-name">{{ getCategoryName(item.typeId) || item.name }}</text>
            <view class="category-right">
              <text class="category-amount">
                ¥{{ formatAmount(item.spent) }} / ¥{{ formatAmount(item.amount) }}
              </text>
              <text class="category-arrow">{{ expandedId === item.id ? '▲' : '▼' }}</text>
            </view>
          </view>
          <BudgetBar
            :spent="item.spent"
            :amount="item.amount"
          />
          <view class="category-footer">
            <text class="category-remaining">
              {{ item.remainingAmount >= 0 ? '剩余' : '已超支' }}
              ¥{{ formatAmount(Math.abs(item.remainingAmount)) }}
            </text>
          </view>

          <view v-if="expandedId === item.id" class="expand-hint">
            <text class="expand-text">可跳转至明细页查看该分类的支出记录</text>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { BudgetOverview, AnnualBudgetSummary } from '../../../../api/budget'
import BudgetBar from '../../../../components/BudgetBar.vue'

const props = defineProps<{
  overview: BudgetOverview | null
  annualSummary: AnnualBudgetSummary | null
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const expandedId = ref<number | null>(null)
const showAllWarnings = ref(false)

const currentMonth = new Date().getMonth() + 1

const hasAnnualData = computed(() => {
  return props.annualSummary && props.annualSummary.items.length > 0
})

const annualRemaining = computed(() => {
  if (!props.annualSummary) return 0
  return props.annualSummary.totalYearlyBudget - props.annualSummary.totalYearlySpent
})

const warningBudgets = computed(() => {
  if (!props.overview) return []
  return props.overview.budgets.filter((b) => b.alertStatus === 'warning' || b.alertStatus === 'danger')
})

const displayWarnings = computed(() => {
  if (showAllWarnings.value) return warningBudgets.value
  return warningBudgets.value.slice(0, 2)
})

const formatAmount = (val: number) => {
  return Math.abs(val).toLocaleString('zh-CN', { maximumFractionDigits: 0 })
}

const getCategoryName = (typeId: number | null) => {
  if (typeId === null) return '总预算'
  return '分类预算'
}

const toggleExpand = (id: number) => {
  expandedId.value = expandedId.value === id ? null : id
}
</script>

<style scoped>
.budget-progress {
  padding-bottom: 32rpx;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 32rpx;
}

.loading-text {
  font-size: var(--text-body);
  color: var(--color-text-secondary, #94A3B8);
}

.empty-title {
  font-size: var(--text-title);
  color: var(--color-text-primary, #1E293B);
  font-weight: 600;
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
  text-align: center;
  line-height: 1.6;
}

.overview-card {
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 16rpx;
  padding: 32rpx 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.annual-card {
  border-left: 6rpx solid var(--color-primary, #0D9488);
}

.overview-header {
  margin-bottom: 20rpx;
}

.overview-title {
  font-size: var(--text-body);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}

.overview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx 8rpx;
  margin-bottom: 20rpx;
}

.overview-item {
  text-align: center;
}

.ov-label {
  font-size: var(--text-note);
  color: var(--color-text-secondary, #94A3B8);
  display: block;
  margin-bottom: 4rpx;
}

.ov-value {
  font-size: var(--text-body);
  font-weight: 700;
  color: var(--color-text-primary, #1E293B);
}

.ov-value.expense {
  color: var(--color-danger, #EF4444);
}

.ov-value.income {
  color: var(--color-primary, #0D9488);
}

.projected-text {
  display: block;
  margin-top: 12rpx;
  font-size: var(--text-note);
  color: var(--color-text-secondary, #94A3B8);
  text-align: center;
}

.alert-section {
  margin-bottom: 20rpx;
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 12rpx;
  padding-left: 8rpx;
}
.section-title-icon {
  width: 28rpx;
  height: 28rpx;
  flex-shrink: 0;
}
.section-title {
  font-size: var(--text-body);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}

.alert-card {
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.alert-danger {
  border-left: 4rpx solid var(--color-danger, #EF4444);
}

.alert-warning {
  border-left: 4rpx solid var(--color-warning, #F59E0B);
}

.alert-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.alert-icon {
  width: 28rpx;
  height: 28rpx;
  flex-shrink: 0;
}

.alert-info {
  flex: 1;
}

.alert-name {
  font-size: var(--text-small);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
  display: block;
}

.alert-detail {
  font-size: var(--text-note);
  color: var(--color-text-secondary, #94A3B8);
  display: block;
  margin-top: 4rpx;
}

.alert-more {
  text-align: center;
  padding: 12rpx;
}

.alert-more text {
  font-size: var(--text-small);
  color: var(--color-primary, #0D9488);
}

.category-section {
  margin-bottom: 20rpx;
}

.category-card {
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.category-name {
  font-size: var(--text-body);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}

.category-right {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.category-amount {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
}

.category-arrow {
  font-size: var(--text-caption);
  color: var(--color-text-secondary, #94A3B8);
}

.category-footer {
  margin-top: 8rpx;
}

.category-remaining {
  font-size: var(--text-note);
  color: var(--color-text-secondary, #94A3B8);
}

.expand-hint {
  margin-top: 12rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid var(--color-border, #E2E8F0);
}

.expand-text {
  font-size: var(--text-note);
  color: var(--color-text-tertiary, #CBD5E1);
}
</style>
