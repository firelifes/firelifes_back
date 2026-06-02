<template>
  <view class="savings-card" v-if="monthIncome > 0 || monthExpense > 0">
    <view class="savings-left">
      <view class="savings-icon category-icon-svg category-icon-jinqian"></view>
      <view class="savings-info">
        <text class="savings-label">本月存下</text>
        <text class="savings-amount">¥{{ formatAmount(savings) }}</text>
      </view>
    </view>
    <view class="savings-right">
      <text class="savings-rate">{{ savingsRate }}%</text>
      <text class="savings-rate-label">储蓄率</text>
    </view>
    <view class="savings-bar">
      <view class="savings-bar-fill" :style="{ width: barWidth + '%' }"></view>
    </view>
    <view class="savings-detail">
      <text class="savings-detail-text">收入 ¥{{ formatAmount(monthIncome) }}</text>
      <text class="savings-detail-text">支出 -¥{{ formatAmount(monthExpense) }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  monthIncome: number
  monthExpense: number
}>()

const savings = computed(() => props.monthIncome - props.monthExpense)

const savingsRate = computed(() => {
  if (props.monthIncome <= 0) return '0.0'
  const rate = ((props.monthIncome - props.monthExpense) / props.monthIncome) * 100
  return Math.max(0, rate).toFixed(1)
})

const barWidth = computed(() => {
  return Math.min(parseFloat(savingsRate.value), 100)
})

const formatAmount = (val: number) => Math.abs(val).toFixed(2)
</script>

<style scoped>
.savings-card {
  margin: 0 20rpx 16rpx;
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  position: relative;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
}

.savings-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.savings-icon {
  width: 36rpx;
  height: 36rpx;
}

.savings-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.savings-label {
  font-size: var(--text-note);
  color: var(--color-text-secondary, #94A3B8);
}

.savings-amount {
  font-size: var(--text-body);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}

.savings-right {
  position: absolute;
  top: 20rpx;
  right: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.savings-rate {
  font-size: var(--text-body);
  font-weight: 700;
  color: var(--color-primary, #0D9488);
}

.savings-rate-label {
  font-size: var(--text-caption);
  color: var(--color-text-secondary, #94A3B8);
}

.savings-bar {
  margin-top: 12rpx;
  height: 10rpx;
  background: var(--color-border-light, #F1F5F9);
  border-radius: 5rpx;
  overflow: hidden;
}

.savings-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary, #0D9488) 0%, var(--color-primary-dark, #0B7A70) 100%);
  border-radius: 5rpx;
  transition: width 0.4s ease;
}

.savings-detail {
  display: flex;
  justify-content: space-between;
  margin-top: 8rpx;
}

.savings-detail-text {
  font-size: var(--text-caption);
  color: var(--color-text-tertiary, #CBD5E1);
}
</style>
