<!--
  pages/detail/bill.vue - 账单汇总页面
  功能：月账单/年账单 Tab 切换，年度汇总卡片，各年份账单列表
  技术：Vue3 + TypeScript + uni-app
-->
<template>
  <view class="page">
    <wd-navbar
      title="账单汇总"
      left-arrow
      fixed
      placeholder
      bordered
      safe-area-inset-top
      @click-left="goBack"
    />

    <view class="tab-bar">
      <view
        class="tab-item"
        :class="{ active: activeTab === 'month' }"
        @tap="switchTab('month')"
      >
        <text class="tab-text">月账单</text>
      </view>
      <view
        class="tab-item"
        :class="{ active: activeTab === 'year' }"
        @tap="switchTab('year')"
      >
        <text class="tab-text">年账单</text>
      </view>
    </view>

    <!-- 月账单 -->
    <view v-if="activeTab === 'month'" class="tab-content">
      <view class="month-selector">
        <view class="month-arrow" @tap="prevMonth">◀</view>
        <text class="month-text">{{ displayYearMonth }}</text>
        <view class="month-arrow" @tap="nextMonth">▶</view>
      </view>

      <view class="summary-card">
        <view class="summary-item">
          <text class="summary-label">月收入</text>
          <text class="summary-value income">¥{{ formatAmount(monthIncome) }}</text>
        </view>
        <view class="summary-divider"></view>
        <view class="summary-item">
          <text class="summary-label">月支出</text>
          <text class="summary-value expense">-¥{{ formatAmount(monthExpense) }}</text>
        </view>
        <view class="summary-divider"></view>
        <view class="summary-item">
          <text class="summary-label">月结余</text>
          <text class="summary-value" :class="monthBalance >= 0 ? 'income' : 'expense'">
            ¥{{ formatAmount(monthBalance) }}
          </text>
        </view>
      </view>

      <view v-if="monthlyBills.length > 0" class="bill-list">
        <view class="list-header">
          <text class="header-cell month-cell">月份</text>
          <text class="header-cell amount-cell">收入</text>
          <text class="header-cell amount-cell">支出</text>
          <text class="header-cell amount-cell">结余</text>
        </view>
        <view v-for="bill in monthlyBills" :key="bill.month" class="bill-row">
          <text class="bill-cell month-cell">{{ bill.label }}</text>
          <text class="bill-cell amount-cell income">¥{{ formatAmount(bill.income) }}</text>
          <text class="bill-cell amount-cell expense">-¥{{ formatAmount(bill.expense) }}</text>
          <text class="bill-cell amount-cell" :class="bill.balance >= 0 ? 'income' : 'expense'">
            ¥{{ formatAmount(bill.balance) }}
          </text>
        </view>
      </view>

      <view v-else-if="!loadingMonth" class="empty-state">
        <text class="empty-text">暂无数据</text>
      </view>
    </view>

    <!-- 年账单 -->
    <view v-if="activeTab === 'year'" class="tab-content">
      <view class="summary-card yearly-summary">
        <view class="summary-item">
          <text class="summary-label">总结余</text>
          <text class="summary-value total-balance" :class="yearlySummary.totalBalance >= 0 ? 'income' : 'expense'">
            ¥{{ formatAmount(yearlySummary.totalBalance) }}
          </text>
        </view>
        <view class="summary-row">
          <view class="summary-half">
            <text class="summary-label">总收入</text>
            <text class="summary-value income">¥{{ formatAmount(yearlySummary.totalIncome) }}</text>
          </view>
          <view class="summary-half">
            <text class="summary-label">总支出</text>
            <text class="summary-value expense">-¥{{ formatAmount(yearlySummary.totalExpense) }}</text>
          </view>
        </view>
      </view>

      <view v-if="yearlyBills.length > 0" class="bill-list">
        <view class="list-header">
          <text class="header-cell month-cell">年份</text>
          <text class="header-cell amount-cell">年收入</text>
          <text class="header-cell amount-cell">年支出</text>
          <text class="header-cell amount-cell">年结余</text>
        </view>
        <view v-for="bill in yearlyBills" :key="bill.year" class="bill-row">
          <text class="bill-cell month-cell">{{ bill.year }}</text>
          <text class="bill-cell amount-cell income">¥{{ formatAmount(bill.income) }}</text>
          <text class="bill-cell amount-cell expense">-¥{{ formatAmount(bill.expense) }}</text>
          <text class="bill-cell amount-cell" :class="bill.balance >= 0 ? 'income' : 'expense'">
            ¥{{ formatAmount(bill.balance) }}
          </text>
        </view>
      </view>

      <view v-else-if="!loadingYear" class="empty-state">
        <text class="empty-text">暂无数据</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { recordApi } from '../../api/record'

const activeTab = ref<'month' | 'year'>('month')

const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth() + 1)

const displayYearMonth = computed(() =>
  `${currentYear.value}年${String(currentMonth.value).padStart(2, '0')}月`
)
const yearMonth = computed(() =>
  `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}`
)

const monthIncome = ref(0)
const monthExpense = ref(0)
const monthBalance = computed(() => monthIncome.value - monthExpense.value)
const loadingMonth = ref(false)
const monthlyBills = ref<Array<{ month: string; label: string; income: number; expense: number; balance: number }>>([])

const yearlySummary = ref({ totalIncome: 0, totalExpense: 0, totalBalance: 0 })
const yearlyBills = ref<Array<{ year: number; income: number; expense: number; balance: number }>>([])
const loadingYear = ref(false)

const formatAmount = (val: number) => Math.abs(val).toFixed(2)

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.redirectTo({ url: '/pages/detail/index' })
  }
}

const switchTab = (tab: 'month' | 'year') => {
  activeTab.value = tab
  if (tab === 'month') {
    loadMonthData()
  } else {
    loadYearData()
  }
}

const prevMonth = () => {
  if (currentMonth.value === 1) {
    currentYear.value -= 1
    currentMonth.value = 12
  } else {
    currentMonth.value -= 1
  }
  loadMonthData()
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
  loadMonthData()
}

const loadMonthData = async () => {
  loadingMonth.value = true
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
      const dateMap = new Map<string, { income: number; expense: number }>()
      recordsRes.data.list.forEach((r: any) => {
        if (r.type === 'transfer' || r.type === 'repayment') return
        const monthKey = r.date.substring(0, 7)
        if (!dateMap.has(monthKey)) {
          dateMap.set(monthKey, { income: 0, expense: 0 })
        }
        const entry = dateMap.get(monthKey)!
        if (r.type === 'income') {
          entry.income += Math.abs(r.amount)
        } else if (r.type === 'expense') {
          entry.expense += Math.abs(r.amount)
        }
      })

      monthlyBills.value = Array.from(dateMap.entries())
        .map(([month, data]) => ({
          month,
          label: month.substring(5) + '月',
          income: Math.round(data.income * 100) / 100,
          expense: Math.round(data.expense * 100) / 100,
          balance: Math.round((data.income - data.expense) * 100) / 100,
        }))
        .sort((a, b) => b.month.localeCompare(a.month))
    }
  } catch {
    // ignore
  }
  loadingMonth.value = false
}

const loadYearData = async () => {
  loadingYear.value = true
  try {
    const [summaryRes, billsRes] = await Promise.all([
      recordApi.getYearlySummary(),
      recordApi.getYearlyBills(),
    ])

    if (summaryRes.success && summaryRes.data) {
      yearlySummary.value = summaryRes.data
    }

    if (billsRes.success && billsRes.data) {
      yearlyBills.value = billsRes.data
    }
  } catch {
    // ignore
  }
  loadingYear.value = false
}

onMounted(() => {
  loadMonthData()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg-page, #F5F7FA);
}

.tab-bar {
  display: flex;
  background: var(--color-bg-card, #FFFFFF);
  padding: 0 40rpx;
  gap: 0;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  position: relative;
}

.tab-text {
  font-size: var(--text-body);
  color: var(--color-text-secondary, #94A3B8);
  font-weight: 500;
}

.tab-item.active .tab-text {
  color: var(--color-primary, #0D9488);
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 48rpx;
  height: 6rpx;
  background: var(--color-primary, #0D9488);
  border-radius: 3rpx;
}

.tab-content {
  padding: 20rpx;
}

.month-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40rpx;
  padding: 20rpx 0;
}

.month-arrow {
  font-size: var(--text-body);
  color: var(--color-primary, #0D9488);
  padding: 10rpx 20rpx;
}

.month-text {
  font-size: var(--text-body);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
  min-width: 180rpx;
  text-align: center;
}

.summary-card {
  background: linear-gradient(135deg, var(--color-primary, #0D9488), var(--color-primary-dark, #0B7A70));
  border-radius: 20rpx;
  padding: 32rpx 28rpx;
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin-bottom: 24rpx;
}

.summary-card.yearly-summary {
  flex-direction: column;
  gap: 24rpx;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.summary-label {
  font-size: var(--text-note);
  color: rgba(255, 255, 255, 0.7);
}

.summary-value {
  font-size: var(--text-title);
  font-weight: 700;
  color: var(--color-text-inverse, #FFFFFF);
}

.summary-value.income {
  color: var(--color-text-inverse, #FFFFFF);
}

.summary-value.expense {
  color: rgba(255, 255, 255, 0.85);
}

.summary-value.total-balance {
  font-size: var(--text-number);
}

.summary-divider {
  width: 1rpx;
  height: 56rpx;
  background: rgba(255, 255, 255, 0.25);
}

.summary-row {
  display: flex;
  width: 100%;
  justify-content: space-around;
}

.summary-half {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.bill-list {
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 20rpx;
  overflow: hidden;
}

.list-header {
  display: flex;
  padding: 20rpx 24rpx;
  background: var(--color-border-light, #F1F5F9);
  border-bottom: 1rpx solid var(--color-border, #E2E8F0);
}

.header-cell {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
  font-weight: 500;
}

.month-cell {
  flex: 1;
}

.amount-cell {
  width: 160rpx;
  text-align: right;
}

.bill-row {
  display: flex;
  padding: 24rpx;
  border-bottom: 1rpx solid var(--color-border, #E2E8F0);
}

.bill-row:last-child {
  border-bottom: none;
}

.bill-cell {
  font-size: var(--text-small);
  color: var(--color-text-primary, #1E293B);
}

.bill-cell.income {
  color: var(--color-primary, #0D9488);
}

.bill-cell.expense {
  color: var(--color-danger, #EF4444);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}

.empty-text {
  font-size: var(--text-body);
  color: var(--color-text-secondary, #94A3B8);
}
</style>