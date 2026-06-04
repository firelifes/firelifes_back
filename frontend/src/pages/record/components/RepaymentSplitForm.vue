<template>
  <view class="repayment-split-form">
    <view class="split-card">
      <view class="split-header">
        <text class="split-title">本金利息拆分</text>
        <text class="split-hint">本金 + 利息 = 还款总额</text>
      </view>

      <view class="amount-block">
        <view class="amount-row">
          <view class="amount-side">
            <text class="amount-label">本金</text>
            <view class="amount-value">
              <text class="amount-currency">¥</text>
              <input
                class="amount-input"
                type="digit"
                :value="formattedPrincipal"
                placeholder="0.00"
                @input="onPrincipalInput"
              />
            </view>
          </view>
          <view class="amount-divider"></view>
          <view class="amount-side">
            <text class="amount-label">利息</text>
            <view class="amount-value">
              <text class="amount-currency">¥</text>
              <input
                class="amount-input"
                type="digit"
                :value="formattedInterest"
                placeholder="0.00"
                @input="onInterestInput"
              />
            </view>
          </view>
        </view>
      </view>

      <view
        class="category-picker"
        @tap="emit('openInterestCategoryPicker')"
      >
        <view class="picker-left">
          <view class="picker-icon-wrap">
            <view v-if="selectedCategory" class="category-icon-svg picker-icon" :class="getIconClass(selectedCategory.name)"></view>
            <view v-else class="category-icon-svg picker-icon picker-icon-empty"></view>
          </view>
          <view class="picker-text">
            <text class="picker-label">利息分类</text>
            <text v-if="selectedCategory" class="picker-value-text">{{ selectedCategory.name }}</text>
            <text v-else class="picker-value-text muted">请选择分类</text>
          </view>
        </view>
        <view class="picker-chevron">
          <text>›</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { getCategoryIconClass } from '../../../utils/category-icon-map'
import type { CategoryItem } from '../../../api/category'

const props = defineProps<{
  totalAmount: number
  selectedCategory?: CategoryItem | null
  loanAccount?: {
    originalPrincipal?: number
    annualInterestRate?: number
    repaymentMethod?: string
    remainingMonths?: number
  }
}>()

const emit = defineEmits<{
  (e: 'update:principal', value: number): void
  (e: 'update:interest', value: number): void
  (e: 'update:interestTypeId', value: number): void
  (e: 'openInterestCategoryPicker'): void
}>()

const principal = ref(0)
const interest = ref(0)

const formattedPrincipal = computed(() => {
  return principal.value > 0 ? principal.value.toFixed(2) : ''
})

const formattedInterest = computed(() => {
  return interest.value > 0 ? interest.value.toFixed(2) : ''
})

const calculateAutoPrincipal = (): number => {
  const { loanAccount, totalAmount } = props
  if (loanAccount && loanAccount.annualInterestRate) {
    const monthlyRate = loanAccount.annualInterestRate / 100 / 12
    let calculatedInterest = totalAmount * monthlyRate
    calculatedInterest = Math.max(0, Math.min(totalAmount, calculatedInterest))
    return Math.round((totalAmount - calculatedInterest) * 100) / 100
  }
  return Math.round(totalAmount * 100) / 100
}

const calculateAutoInterest = (): number => {
  const { loanAccount, totalAmount } = props
  if (loanAccount && loanAccount.annualInterestRate) {
    const monthlyRate = loanAccount.annualInterestRate / 100 / 12
    let calculatedInterest = totalAmount * monthlyRate
    calculatedInterest = Math.max(0, Math.min(totalAmount, calculatedInterest))
    return Math.round(calculatedInterest * 100) / 100
  }
  return 0
}

const onPrincipalInput = (e: any) => {
  const value = parseFloat(e.detail.value) || 0
  const newPrincipal = Math.max(0, Math.min(props.totalAmount, value))
  principal.value = Math.round(newPrincipal * 100) / 100
  interest.value = Math.max(0, Math.round((props.totalAmount - principal.value) * 100) / 100)
  emitValues()
}

const onInterestInput = (e: any) => {
  const value = parseFloat(e.detail.value) || 0
  const newInterest = Math.max(0, Math.min(props.totalAmount, value))
  interest.value = Math.round(newInterest * 100) / 100
  principal.value = Math.max(0, Math.round((props.totalAmount - interest.value) * 100) / 100)
  emitValues()
}

const emitValues = () => {
  emit('update:principal', principal.value)
  emit('update:interest', interest.value)
}

const getIconClass = (name: string): string => {
  return getCategoryIconClass(name)
}

onMounted(() => {
  principal.value = calculateAutoPrincipal()
  interest.value = calculateAutoInterest()
  emitValues()
})

// 监听总金额变化，重新自动拆分本金/利息
// 关键修复：去掉 "principal===0 && interest===0" 条件，
// 否则用户连续输入 "8"→"89" 时，第一次拆分后 principal=8，第二次条件不满足，
// 拆分停留在 8，导致 principal + interest ≠ 用户输入的总金额。
// 修复后：只要 totalAmount > 0 就用最新金额重算，保证本金+利息=总金额始终成立。
watch(
  () => props.totalAmount,
  (newTotal) => {
    if (newTotal > 0) {
      const interestAmount = calculateAutoInterest()
      const principalAmount = Math.max(0, Math.round((newTotal - interestAmount) * 100) / 100)
      principal.value = principalAmount
      interest.value = interestAmount
      emitValues()
    } else if (newTotal === 0) {
      principal.value = 0
      interest.value = 0
      emitValues()
    }
  },
)
</script>

<style lang="scss" scoped>
.repayment-split-form {
  padding: 0 24rpx 20rpx;
}

.split-card {
  background: linear-gradient(180deg, #FFFFFF 0%, #FAFCFC 100%);
  border-radius: 24rpx;
  border: 1rpx solid rgba(13, 148, 136, 0.08);
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.split-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 24rpx 28rpx 16rpx;
}

.split-title {
  font-size: var(--text-title, 32rpx);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
  letter-spacing: -0.3rpx;
}

.split-hint {
  font-size: var(--text-caption, 20rpx);
  color: var(--color-text-tertiary, #94A3B8);
  font-weight: 400;
}

.amount-block {
  margin: 0 20rpx 12rpx;
  background: var(--color-border-light, #F1F5F9);
  border-radius: 18rpx;
  padding: 6rpx 20rpx;
}

.amount-row {
  display: flex;
  align-items: stretch;
  padding: 16rpx 0;
}

.amount-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.amount-label {
  font-size: var(--text-small, 24rpx);
  color: var(--color-text-secondary, #64748B);
  font-weight: 500;
}

.amount-value {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.amount-currency {
  font-size: var(--text-body, 28rpx);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}

.amount-input {
  flex: 1;
  font-size: var(--text-title, 32rpx);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
  background: transparent;
  border: none;
  outline: none;
  padding: 0;
  min-width: 0;
  letter-spacing: -0.5rpx;
}

.amount-divider {
  width: 1rpx;
  background: var(--color-border, #E2E8F0);
  margin: 8rpx 24rpx;
}

/* amount-summary 已移除：
   1) 顶部弹框 .amount-display 已显示用户输入的总金额
   2) 拆分逻辑保证 principal + interest = totalAmount（见 watcher）
   3) 合计是推导信息，不是录入信息，重复展示增加视觉噪音 */

.category-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 8rpx 20rpx 20rpx;
  padding: 20rpx 24rpx;
  background: var(--color-border-light, #F1F5F9);
  border-radius: 18rpx;
  border: 2rpx solid transparent;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:active {
    transform: scale(0.985);
    background: #E8EEF3;
  }
}

.picker-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
  min-width: 0;
}

.picker-icon-wrap {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, 0.06);
  flex-shrink: 0;
  position: relative;
}

.picker-icon {
  width: 36rpx;
  height: 36rpx;
}

.picker-icon-empty {
  background: var(--color-border, #E2E8F0);
  border-radius: 50%;
}

.picker-text {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
  min-width: 0;
  flex: 1;
}

.picker-label {
  font-size: var(--text-caption, 20rpx);
  color: var(--color-text-tertiary, #94A3B8);
  font-weight: 500;
}

.picker-value-text {
  font-size: var(--text-body, 28rpx);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.muted {
    color: var(--color-text-tertiary, #94A3B8);
    font-weight: 400;
  }
}

.picker-chevron {
  width: 32rpx;
  height: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 300;
  color: var(--color-text-secondary, #94A3B8);
  flex-shrink: 0;
}
</style>
