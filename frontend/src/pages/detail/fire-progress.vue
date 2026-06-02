<!--
  pages/detail/fire-progress.vue - FIRE进度页
  功能：展示净资产、FIRE目标进度、距FIRE差距，支持设置FIRE目标
  技术：Vue3 + TypeScript + uni-app + Wot Design
-->
<template>
  <view class="page">
    <wd-navbar
      title="FIRE进度"
      left-arrow
      fixed
      placeholder
      bordered
      safe-area-inset-top
      @click-left="goBack"
    />

    <view class="content">
      <view class="progress-section">
        <view class="progress-ring-wrapper">
          <view class="progress-ring">
            <view class="ring-bg"></view>
            <view
              class="ring-fill"
              :style="{ background: `conic-gradient(var(--color-primary) ${firePercent * 3.6}deg, transparent ${firePercent * 3.6}deg)` }"
            ></view>
            <view class="ring-inner">
              <text class="ring-percent">{{ firePercent.toFixed(1) }}%</text>
              <text class="ring-label">FIRE进度</text>
            </view>
          </view>
        </view>

        <view class="stats-row">
          <view class="stat-item">
            <text class="stat-value">¥{{ formatAmount(netWorth) }}</text>
            <text class="stat-label">当前净资产</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-value">¥{{ formatAmount(fireGoal) }}</text>
            <text class="stat-label">FIRE目标</text>
          </view>
        </view>

        <view v-if="fireGoal > 0 && netWorth !== null" class="gap-card">
          <text class="gap-label">距离FIRE还差</text>
          <text class="gap-amount">¥{{ formatAmount(fireGoal - netWorth) }}</text>
          <view class="gap-bar">
            <view class="gap-bar-fill" :style="{ width: firePercent + '%' }"></view>
          </view>
        </view>
      </view>

      <view class="goal-section">
        <view class="section-header">
          <text class="section-title">FIRE目标设置</text>
        </view>

        <view class="goal-card">
          <view class="goal-input-row">
            <text class="goal-input-label">目标金额</text>
            <view class="goal-input-wrapper">
              <text class="goal-input-prefix">¥</text>
              <input
                class="goal-input"
                v-model="goalInput"
                type="digit"
                placeholder="输入FIRE目标金额"
                @blur="saveGoal"
              />
            </view>
          </view>

          <view class="goal-tip">
            <view class="category-icon-svg tip-icon category-icon-dengpao"></view>
            <text class="tip-text">按4%规则：FIRE目标 = 年支出 × 25</text>
          </view>

          <view class="quick-calc">
            <text class="quick-label">快速计算</text>
            <view class="quick-input-row">
              <text class="quick-input-label">月支出</text>
              <view class="quick-input-wrapper">
                <text class="quick-input-prefix">¥</text>
                <input
                  class="quick-input"
                  v-model="monthlyExpense"
                  type="digit"
                  placeholder="输入月均支出"
                />
              </view>
            </view>
            <view v-if="monthlyExpenseNum > 0" class="quick-result">
              <text class="quick-result-text">建议FIRE目标：¥{{ formatAmount(monthlyExpenseNum * 12 * 25) }}</text>
              <view class="quick-apply" @tap="applyQuickGoal">
                <text class="quick-apply-text">应用此目标</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="info-section">
        <view class="section-header">
          <text class="section-title">关于FIRE</text>
        </view>
        <view class="info-card">
          <view class="info-item">
            <text class="info-dot">•</text>
            <text class="info-text">FIRE（Financial Independence, Retire Early）即财务独立、提早退休</text>
          </view>
          <view class="info-item">
            <text class="info-dot">•</text>
            <text class="info-text">4%规则：当净资产达到年支出的25倍时，每年提取4%即可覆盖生活开支</text>
          </view>
          <view class="info-item">
            <text class="info-dot">•</text>
            <text class="info-text">坚持记账、控制支出、积累资产，一步步走向FIRE</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { recordApi } from '../../api/record'

const netWorth = ref<number | null>(null)
const fireGoal = ref(0)
const goalInput = ref('')
const monthlyExpense = ref('')
const loading = ref(false)

const monthlyExpenseNum = computed(() => {
  const val = parseFloat(monthlyExpense.value)
  return isNaN(val) ? 0 : val
})

const firePercent = computed(() => {
  if (fireGoal.value <= 0 || netWorth.value === null) return 0
  return Math.min((netWorth.value / fireGoal.value) * 100, 100)
})

const formatAmount = (val: number | null) => {
  if (val === null) return '--'
  return Math.abs(val).toLocaleString('zh-CN', { maximumFractionDigits: 0 })
}

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.redirectTo({ url: '/pages/detail/index' })
  }
}

const fetchNetWorth = async () => {
  loading.value = true
  try {
    const res = await recordApi.getNetWorth()
    if (res.success && res.data) {
      netWorth.value = res.data.netWorth
    }
  } catch {
    netWorth.value = null
  } finally {
    loading.value = false
  }
}

const loadGoal = () => {
  try {
    const saved = uni.getStorageSync('fire_goal')
    if (saved) {
      const val = parseFloat(String(saved))
      if (!isNaN(val) && val > 0) {
        fireGoal.value = val
        goalInput.value = String(val)
      }
    }
  } catch {
    // ignore
  }
}

const saveGoal = () => {
  const val = parseFloat(goalInput.value)
  if (!isNaN(val) && val > 0) {
    fireGoal.value = val
    uni.setStorageSync('fire_goal', val)
  } else {
    goalInput.value = fireGoal.value > 0 ? String(fireGoal.value) : ''
  }
}

const applyQuickGoal = () => {
  const goal = monthlyExpenseNum.value * 12 * 25
  fireGoal.value = goal
  goalInput.value = String(goal)
  uni.setStorageSync('fire_goal', goal)
}

onMounted(() => {
  loadGoal()
  fetchNetWorth()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg-page, #F5F7FA);
}

.content {
  padding: 20rpx 24rpx;
}

.progress-section {
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 20rpx;
  padding: 40rpx 24rpx 32rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.progress-ring-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 32rpx;
}

.progress-ring {
  width: 280rpx;
  height: 280rpx;
  position: relative;
}

.ring-bg {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--color-border, #E2E8F0);
  position: absolute;
}

.ring-fill {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  position: absolute;
  mask: radial-gradient(transparent 108rpx, #000 110rpx);
  -webkit-mask: radial-gradient(transparent 108rpx, #000 110rpx);
}

.ring-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ring-percent {
  font-size: 52rpx;
  font-weight: 700;
  color: var(--color-primary, #0D9488);
}

.ring-label {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
  margin-top: 8rpx;
}

.stats-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40rpx;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: var(--text-title);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}

.stat-label {
  font-size: var(--text-note);
  color: var(--color-text-secondary, #94A3B8);
  margin-top: 6rpx;
}

.stat-divider {
  width: 2rpx;
  height: 48rpx;
  background: var(--color-border, #E2E8F0);
}

.gap-card {
  margin-top: 28rpx;
  padding: 20rpx;
  background: linear-gradient(135deg, var(--color-primary-light, #E6F7F5), var(--color-border-light, #F1F5F9));
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.gap-label {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
}

.gap-amount {
  font-size: var(--text-number);
  font-weight: 700;
  color: var(--color-danger, #EF4444);
  margin: 8rpx 0 16rpx;
}

.gap-bar {
  width: 100%;
  height: 12rpx;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 6rpx;
  overflow: hidden;
}

.gap-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary, #0D9488), var(--color-info, #3B82F6));
  border-radius: 6rpx;
  transition: width 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.goal-section {
  margin-bottom: 20rpx;
}

.section-header {
  padding: 0 4rpx 16rpx;
}

.section-title {
  font-size: var(--text-body);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}

.goal-card {
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 20rpx;
  padding: 28rpx 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.goal-input-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.goal-input-label {
  font-size: var(--text-body);
  color: var(--color-text-primary, #1E293B);
  font-weight: 500;
}

.goal-input-wrapper {
  display: flex;
  align-items: center;
  background: var(--color-border-light, #F1F5F9);
  border-radius: 12rpx;
  padding: 12rpx 20rpx;
}

.goal-input-prefix {
  font-size: var(--text-body);
  color: var(--color-text-secondary, #94A3B8);
  margin-right: 8rpx;
}

.goal-input {
  width: 240rpx;
  font-size: var(--text-body);
  color: var(--color-text-primary, #1E293B);
  text-align: right;
}

.goal-tip {
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
  margin-top: 20rpx;
  padding: 12rpx 16rpx;
  background: var(--color-primary-light, #E6F7F5);
  border-radius: 8rpx;
}

.tip-icon {
  width: 28rpx;
  height: 28rpx;
  flex-shrink: 0;
  margin-top: 2rpx;
}

.tip-text {
  flex: 1;
  font-size: var(--text-note);
  color: var(--color-text-secondary, #94A3B8);
}

.quick-calc {
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid var(--color-border, #E2E8F0);
}

.quick-label {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
  margin-bottom: 16rpx;
  display: block;
}

.quick-input-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.quick-input-label {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
}

.quick-input-wrapper {
  display: flex;
  align-items: center;
  background: var(--color-border-light, #F1F5F9);
  border-radius: 12rpx;
  padding: 10rpx 20rpx;
}

.quick-input-prefix {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
  margin-right: 8rpx;
}

.quick-input {
  width: 200rpx;
  font-size: var(--text-small);
  color: var(--color-text-primary, #1E293B);
  text-align: right;
}

.quick-result {
  margin-top: 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 20rpx;
  background: var(--color-primary-light, #E6F7F5);
  border-radius: 12rpx;
}

.quick-result-text {
  font-size: var(--text-small);
  color: var(--color-primary, #0D9488);
  font-weight: 500;
}

.quick-apply {
  padding: 8rpx 20rpx;
  background: var(--color-primary, #0D9488);
  border-radius: 8rpx;
}

.quick-apply-text {
  font-size: var(--text-note);
  color: var(--color-text-inverse, #FFFFFF);
}

.info-section {
  margin-bottom: 40rpx;
}

.info-card {
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 20rpx;
  padding: 28rpx 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.info-item {
  display: flex;
  margin-bottom: 16rpx;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-dot {
  font-size: var(--text-small);
  color: var(--color-primary, #0D9488);
  margin-right: 12rpx;
  flex-shrink: 0;
}

.info-text {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
  line-height: 1.6;
}
</style>