<template>
  <view class="page">
    <view class="settings-header">
      <view class="header-back" @click="goBack">
        <view class="header-back-icon category-icon-svg category-icon-chevron-left"></view>
      </view>
      <text class="header-title">预算</text>
      <view class="header-right" @click="goToSetting">
        <text class="setting-icon">⚙️</text>
      </view>
    </view>

    <view class="content">
      <BudgetProgress
        :overview="overview"
        :annual-summary="annualSummary"
        :loading="loading"
        @refresh="fetchAll"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { budgetApi, type BudgetOverview, type AnnualBudgetSummary } from '../../../api/budget'
import BudgetProgress from './components/BudgetProgress.vue'

const overview = ref<BudgetOverview | null>(null)
const annualSummary = ref<AnnualBudgetSummary | null>(null)
const loading = ref(false)

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.redirectTo({ url: '/pages/detail/index' })
  }
}

const goToSetting = () => {
  uni.navigateTo({ url: '/pages/detail/budget/budget-setting' })
}

const fetchAll = async () => {
  loading.value = true
  try {
    const [overviewRes, annualRes] = await Promise.all([
      budgetApi.getCurrentOverview(),
      budgetApi.getAnnualSummary(),
    ])
    if (overviewRes.success && overviewRes.data) {
      overview.value = overviewRes.data
    } else {
      overview.value = null
    }
    if (annualRes.success && annualRes.data) {
      annualSummary.value = annualRes.data
    } else {
      annualSummary.value = null
    }
  } catch {
    overview.value = null
    annualSummary.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAll()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg-page, #F5F7FA);
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(env(safe-area-inset-top) + 20rpx) 30rpx 20rpx;
  background: linear-gradient(135deg, var(--color-primary, #00BFFF) 0%, var(--color-primary-dark, #0099CC) 100%);
  flex-shrink: 0;
  position: relative;
}

.header-back {
  position: absolute;
  left: 20rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-back-icon {
  width: 40rpx;
  height: 40rpx;
  color: #fff;
}

.header-title {
  font-size: var(--text-nav);
  font-weight: 600;
  color: #fff;
}

.header-right {
  position: absolute;
  right: 20rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.setting-icon {
  font-size: 40rpx;
  color: #fff;
  line-height: 1;
}

.content {
  padding: 16rpx 24rpx;
}
</style>
