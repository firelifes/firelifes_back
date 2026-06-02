<template>
  <view class="page">
    <wd-navbar
      title="预算"
      left-arrow
      fixed
      placeholder
      bordered
      safe-area-inset-top
      @click-left="goBack"
    >
      <template #right>
        <view class="nav-right" @tap="goToSetting">
          <text class="setting-icon">⚙️</text>
        </view>
      </template>
    </wd-navbar>

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

.content {
  padding: 16rpx 24rpx;
}

.nav-right {
  padding: 8rpx 16rpx;
}

.setting-icon {
  font-size: var(--text-number);
}
</style>
