<template>
  <view class="confirm-overlay" @tap.stop>
    <view class="confirm-card">
      <view class="check-icon category-icon-svg category-icon-duigou"></view>
      <text class="confirm-title">记账成功</text>

      <text class="confirm-amount" :class="type">
        {{ type === 'income' ? '+' : '-' }}¥{{ formatAmount(amount) }}
      </text>

      <text class="confirm-category">{{ categoryName }}</text>

      <view class="confirm-account">
        <text>{{ accountIcon }} {{ accountName }}</text>
        <text class="account-balance">余额 ¥{{ formatAmount(accountBalance) }}</text>
      </view>

      <view v-if="hasAsset" class="confirm-asset-hint">
        <view class="confirm-asset-icon category-icon-svg category-icon-mobile"></view>
        <text>已记入折旧资产</text>
      </view>

      <view v-if="netWorth !== null" class="net-worth-section">
        <view class="section-divider"></view>
        <view class="net-worth-row">
          <text class="net-worth-label">当前净资产</text>
          <text class="net-worth-value">¥{{ formatAmount(netWorth) }}</text>
        </view>
        <view v-if="fireGoal > 0" class="fire-progress-row">
          <view class="fire-progress-bar">
            <view class="fire-progress-fill" :style="{ width: firePercent + '%' }"></view>
          </view>
          <text class="fire-progress-text">{{ firePercent.toFixed(1) }}%</text>
        </view>
        <view v-if="fireGoal > 0" class="fire-gap-row">
          <text class="fire-gap-text">距离FIRE还差 ¥{{ formatAmount(fireGoal - netWorth) }}</text>
        </view>
      </view>

      <view v-if="netWorthLoading" class="net-worth-loading">
        <text>计算净资产中...</text>
      </view>

      <view class="confirm-buttons">
        <view class="confirm-btn primary" @tap="$emit('continue')">
          <text>继续记</text>
        </view>
        <view class="confirm-btn outline" @tap="$emit('back')">
          <text>返回明细</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{
  type: 'income' | 'expense'
  amount: number
  categoryName: string
  accountName: string
  accountIcon: string
  accountBalance: number
  hasAsset: boolean
}>()

defineEmits<{
  continue: []
  back: []
}>()

const netWorth = ref<number | null>(null)
const netWorthLoading = ref(false)
const fireGoal = ref(0)

const firePercent = computed(() => {
  if (fireGoal.value <= 0 || netWorth.value === null) return 0
  const pct = (netWorth.value / fireGoal.value) * 100
  return Math.min(pct, 100)
})

const formatAmount = (val: number) => Math.abs(val).toFixed(2)

const loadNetWorth = async () => {
  netWorthLoading.value = true
  try {
    const { recordApi } = await import('../../../api/record')
    const res = await recordApi.getNetWorth()
    if (res.success && res.data) {
      netWorth.value = res.data.netWorth
    }
    // FIRE目标后续从存储/接口读取，默认按4%规则估算
  } catch {
    netWorth.value = null
  } finally {
    netWorthLoading.value = false
  }
}

onMounted(() => {
  loadNetWorth()
})
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(6rpx);
}

.confirm-card {
  width: 600rpx;
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 32rpx;
  padding: 60rpx 48rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: cardIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.check-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: var(--color-success, #10B981);
  color: var(--color-text-inverse, #FFFFFF);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: checkBounce 0.4s ease;
  padding: 20rpx;
  box-sizing: border-box;
}

@keyframes checkBounce {
  0% { transform: scale(0); }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

.confirm-title {
  font-size: var(--text-title);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
  margin-top: 24rpx;
}

.confirm-amount {
  font-size: var(--text-number-xl);
  font-weight: 700;
  margin-top: 20rpx;
  color: var(--color-text-primary, #1E293B);
}

.confirm-amount.income {
  color: var(--color-success, #10B981);
}

.confirm-category {
  font-size: var(--text-body);
  color: var(--color-text-secondary, #94A3B8);
  margin-top: 12rpx;
}

.confirm-account {
  margin-top: 24rpx;
  padding: 16rpx 28rpx;
  background: var(--color-border-light, #F1F5F9);
  border-radius: 16rpx;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-small);
  color: var(--color-text-primary, #1E293B);
}

.account-balance {
  color: var(--color-primary, #0D9488);
  font-weight: 600;
}

.confirm-asset-hint {
  margin-top: 16rpx;
  font-size: var(--text-small);
  color: var(--color-primary, #0D9488);
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.confirm-asset-icon {
  width: 32rpx;
  height: 32rpx;
  flex-shrink: 0;
}

.section-divider {
  width: 100%;
  height: 1rpx;
  background: var(--color-border, #E2E8F0);
  margin: 24rpx 0;
}

.net-worth-section {
  width: 100%;
}

.net-worth-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.net-worth-label {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
}

.net-worth-value {
  font-size: var(--text-title);
  font-weight: 700;
  color: var(--color-primary, #0D9488);
}

.fire-progress-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 16rpx;
}

.fire-progress-bar {
  flex: 1;
  height: 14rpx;
  background: var(--color-border-light, #F1F5F9);
  border-radius: 7rpx;
  overflow: hidden;
}

.fire-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary, #0D9488), var(--color-primary-dark, #0B7A70));
  border-radius: 7rpx;
  transition: width 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.fire-progress-text {
  font-size: var(--text-small);
  color: var(--color-primary, #0D9488);
  font-weight: 600;
  min-width: 60rpx;
  text-align: right;
}

.fire-gap-row {
  margin-top: 10rpx;
  text-align: right;
}

.fire-gap-text {
  font-size: var(--text-note);
  color: var(--color-text-secondary, #94A3B8);
}

.net-worth-loading {
  margin-top: 24rpx;
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
}

.confirm-buttons {
  display: flex;
  gap: 20rpx;
  margin-top: 36rpx;
  width: 100%;
}

.confirm-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-body);
  font-weight: 600;
  transition: all 0.15s ease;
}

.confirm-btn:active {
  transform: scale(0.96);
}

.confirm-btn.primary {
  background: linear-gradient(135deg, var(--color-primary, #0D9488) 0%, var(--color-primary-dark, #0B7A70) 100%);
  color: var(--color-text-inverse, #FFFFFF);
  box-shadow: 0 4rpx 16rpx rgba(13, 148, 136, 0.25);
}

.confirm-btn.outline {
  background: var(--color-bg-card, #FFFFFF);
  color: var(--color-text-secondary, #94A3B8);
  border: 2rpx solid var(--color-border, #E2E8F0);
}
</style>
