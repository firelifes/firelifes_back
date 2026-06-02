<template>
  <view class="card credit-card-form">
    <view class="credit-card-header">信用卡参数</view>

    <view class="form-row">
      <view class="label-row">
        <text class="form-label">账单日</text>
        <text class="label-hint">每月几号出账单</text>
      </view>
      <view class="day-grid">
        <view
          v-for="day in dayOptions"
          :key="'bd-' + day"
          class="day-item"
          :class="{ active: localData.billingDay === day }"
          @click="onBillingDayChange(day)"
        >
          <text class="day-text">{{ day }}</text>
        </view>
      </view>
    </view>

    <view class="form-row">
      <view class="label-row">
        <text class="form-label">还款日</text>
        <text class="label-hint">每月几号前需还款</text>
      </view>
      <view class="day-grid">
        <view
          v-for="day in dayOptions"
          :key="'dd-' + day"
          class="day-item"
          :class="{ active: localData.dueDay === day }"
          @click="onDueDayChange(day)"
        >
          <text class="day-text">{{ day }}</text>
        </view>
      </view>
      <text v-if="dayConflictHint" class="field-hint error-hint">{{ dayConflictHint }}</text>
    </view>

    <view class="free-period-card">
      <view class="free-period-header">
        <text class="free-period-icon">⏱</text>
        <text class="free-period-title">免息期信息（自动计算）</text>
      </view>
      <view class="free-period-values">
        <view class="free-item">
          <text class="free-value">{{ freePeriod.min }}天</text>
          <text class="free-label">最短免息</text>
        </view>
        <view class="free-divider"></view>
        <view class="free-item">
          <text class="free-value">{{ freePeriod.max }}天</text>
          <text class="free-label">最长免息</text>
        </view>
      </view>
      <text class="free-explain">账单日次日消费可享最长免息，账单日当天消费免息最短</text>
    </view>

    <view class="form-row">
      <text class="form-label">信用额度（选填）</text>
      <WdInput
        v-model.number="localData.creditLimit"
        type="digit"
        placeholder="如 50000"
        customStyle="background: var(--color-border-light, #F1F5F9); border-radius: 10rpx;"
      >
        <template #suffix>
          <text class="unit">元</text>
        </template>
      </WdInput>
    </view>

    <view class="form-row">
      <text class="form-label">最低还款比例</text>
      <text class="field-hint">默认10%，即最低还款额为账单的10%</text>
      <WdInput
        v-model.number="localData.minPaymentRate"
        type="digit"
        placeholder="10"
        customStyle="background: var(--color-border-light, #F1F5F9); border-radius: 10rpx;"
      >
        <template #suffix>
          <text class="unit">%</text>
        </template>
      </WdInput>
    </view>

    <view class="form-row">
      <text class="form-label">逾期日利率</text>
      <text class="field-hint">默认万分之五，超出免息期后按此日利率计息</text>
      <WdInput
        v-model.number="localData.dailyInterestRate"
        type="digit"
        placeholder="0.05"
        customStyle="background: var(--color-border-light, #F1F5F9); border-radius: 10rpx;"
      >
        <template #suffix>
          <text class="unit">%</text>
        </template>
      </WdInput>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { CreditCardFields } from '../../../../types/account'
import { calculateInterestFreePeriod } from '../../../../types/account'

const props = defineProps<{
  modelValue: CreditCardFields
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: CreditCardFields): void
}>()

const dayOptions = [1, 5, 10, 15, 20, 25, 28]

const localData = reactive<CreditCardFields>({
  billingDay: 5,
  dueDay: 25,
  creditLimit: undefined,
  minPaymentRate: 10,
  dailyInterestRate: 0.05,
})

const freePeriod = computed(() => {
  return calculateInterestFreePeriod(localData.billingDay, localData.dueDay)
})

const dayConflictHint = computed(() => {
  if (localData.billingDay === localData.dueDay) {
    return '还款日不能与账单日相同'
  }
  const diff = localData.dueDay > localData.billingDay
    ? localData.dueDay - localData.billingDay
    : localData.dueDay + 30 - localData.billingDay
  if (diff < 5) {
    return '账单日与还款日间隔至少5天'
  }
  return ''
})

const onBillingDayChange = (day: number) => {
  localData.billingDay = day
}

const onDueDayChange = (day: number) => {
  localData.dueDay = day
}

watch(() => props.modelValue, (val) => {
  if (val) {
    localData.billingDay = val.billingDay ?? 5
    localData.dueDay = val.dueDay ?? 25
    localData.creditLimit = val.creditLimit
    localData.minPaymentRate = val.minPaymentRate ?? 10
    localData.dailyInterestRate = val.dailyInterestRate ?? 0.05
  }
}, { immediate: true, deep: true })

watch(localData, () => {
  emit('update:modelValue', { ...localData })
}, { deep: true })
</script>

<style scoped>
.credit-card-form {
  background: rgba(124, 58, 237, 0.04);
  border: 2rpx solid rgba(124, 58, 237, 0.12);
}

.credit-card-header {
  font-size: var(--text-body);
  font-weight: 600;
  color: #7C3AED;
  margin-bottom: 24rpx;
}

.form-row {
  margin-bottom: 32rpx;
}

.form-row:last-child {
  margin-bottom: 0;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.form-label {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
  font-weight: 500;
}

.label-hint {
  font-size: var(--text-note);
  color: var(--color-text-tertiary, #CBD5E1);
}

.unit {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
  margin-right: 8rpx;
}

.field-hint {
  font-size: var(--text-note);
  color: var(--color-text-secondary, #94A3B8);
  margin-top: 8rpx;
  display: block;
}

.error-hint {
  color: var(--color-danger, #EF4444);
}

.day-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.day-item {
  width: 68rpx;
  height: 68rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-card, #FFFFFF);
  border: 2rpx solid var(--color-border, #E2E8F0);
  border-radius: 12rpx;
  transition: all 0.2s ease;
}

.day-item.active {
  border-color: #7C3AED;
  background: rgba(124, 58, 237, 0.08);
}

.day-text {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
}

.day-item.active .day-text {
  color: #7C3AED;
  font-weight: 600;
}

.free-period-card {
  background: rgba(124, 58, 237, 0.06);
  border: 1rpx solid rgba(124, 58, 237, 0.2);
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 32rpx;
}

.free-period-header {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 16rpx;
}

.free-period-icon {
  font-size: 28rpx;
}

.free-period-title {
  font-size: var(--text-small);
  font-weight: 600;
  color: #7C3AED;
}

.free-period-values {
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin-bottom: 12rpx;
}

.free-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.free-value {
  font-size: 36rpx;
  font-weight: 700;
  color: #7C3AED;
}

.free-label {
  font-size: 22rpx;
  color: #9CA3AF;
}

.free-divider {
  width: 1rpx;
  height: 50rpx;
  background: rgba(124, 58, 237, 0.2);
}

.free-explain {
  font-size: 20rpx;
  color: #9CA3AF;
  text-align: center;
  display: block;
}
</style>
