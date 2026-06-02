<template>
  <view class="header">
    <view class="header-top">
      <text class="app-title">F.I.R.E生活家</text>
    </view>
    <view class="header-summary">
      <view class="summary-col summary-month" @tap="$emit('open-date-picker')">
        <text class="summary-label">{{ currentYear }}年</text>
        <view class="summary-value-row">
          <text class="summary-value month-num">{{ String(currentMonth).padStart(2, '0') }}</text>
          <text class="month-unit">月</text>
          <text class="month-arrow">▼</text>
        </view>
      </view>
      <view class="summary-divider"></view>
      <view class="summary-col summary-income">
        <text class="summary-label">收入</text>
        <text class="summary-value">{{ formatAmount(monthIncome) }}</text>
      </view>
      <view class="summary-col summary-expense">
        <text class="summary-label">支出</text>
        <text class="summary-value">-{{ formatAmount(monthExpense) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  currentYear: string
  currentMonth: string
  monthIncome: number
  monthExpense: number
}>()

defineEmits<{
  'open-date-picker': []
}>()

const formatAmount = (amount: number) => {
  return Math.abs(amount).toFixed(2)
}
</script>

<style scoped>
.header {
  background: linear-gradient(135deg, var(--color-primary, #0D9488) 0%, var(--color-primary-dark, #0B7A70) 100%);
  padding: 24rpx 30rpx 20rpx;
  flex-shrink: 0;
  width: 100%;
}

.header-top {
  margin-bottom: 20rpx;
  text-align: center;
}

.app-title {
  font-size: var(--text-body);
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.header-summary {
  display: flex;
  align-items: flex-start;
}

.summary-col {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.summary-month {
  flex-shrink: 0;
  padding-right: 24rpx;
}

.summary-income,
.summary-expense {
  flex: 1;
  align-items: flex-start;
  padding-left: 24rpx;
}

.summary-divider {
  width: 1rpx;
  height: 72rpx;
  background: rgba(255, 255, 255, 0.25);
  flex-shrink: 0;
  align-self: center;
}

.summary-label {
  font-size: var(--text-small);
  color: rgba(255, 255, 255, 0.7);
}

.summary-value-row {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.summary-value {
  font-size: var(--text-title);
  font-weight: 700;
  color: var(--color-text-inverse, #FFFFFF);
}

.month-num {
  font-size: var(--text-number);
}

.month-unit {
  font-size: var(--text-note);
  font-weight: 400;
  color: rgba(255, 255, 255, 0.7);
  margin-left: 2rpx;
}

.month-arrow {
  font-size: var(--text-caption);
  color: rgba(255, 255, 255, 0.6);
  margin-left: 4rpx;
}
</style>