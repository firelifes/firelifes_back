<!--
  pages/analysis/analysis.vue - 资产页面
  功能：净资产展示、账户余额列表、资产汇总（折旧/固定资产总额）
  技术：Vue3 + TypeScript + uni-app
-->
<template>
  <view class="page">
    <view class="net-worth-card">
      <text class="nw-label">净资产</text>
      <text class="nw-value">{{ formatAmount(netWorth) }}</text>
      <view v-if="loadingNetWorth" class="nw-loading">计算中...</view>
    </view>

    <scroll-view scroll-y class="content-scroll">
      <view v-if="displayAccounts.length > 0" class="section">
        <text class="section-title">账户余额</text>
        <view v-for="account in displayAccounts" :key="account.id" class="account-row" @tap="goToAccountRecords(account)">
          <view class="account-icon category-icon-svg" :class="getAccountIconClass(account.icon, account.type)"></view>
          <view class="account-info">
            <text class="account-name">{{ account.name }}</text>
            <text class="account-type">{{ typeLabel(account.type) }}</text>
          </view>
          <text class="account-balance" :class="{ negative: account.balance < 0 }">
            {{ formatAmount(account.balance) }}
          </text>
          <text class="account-arrow">›</text>
        </view>
      </view>

      <view v-if="assetSummary.length > 0" class="section">
        <text class="section-title">资产汇总</text>
        <view v-for="item in assetSummary" :key="item.type" class="account-row" @tap="goToAssetDetail(item)">
          <view class="account-icon category-icon-svg" :class="item.iconClass"></view>
          <view class="account-info">
            <text class="account-name">{{ item.label }}</text>
            <text class="account-type">{{ item.count }}笔</text>
          </view>
          <text class="account-balance">{{ formatAmount(item.total) }}</text>
          <text class="account-arrow">›</text>
        </view>
      </view>

      <view v-if="!loadingNetWorth && displayAccounts.length === 0 && assetSummary.length === 0" class="empty-state">
        <text class="empty-icon">💼</text>
        <text class="empty-text">暂无资产数据</text>
        <text class="empty-hint">记账后资产数据会自动更新</text>
      </view>

      <view class="bottom-padding"></view>
    </scroll-view>

    <CustomTabbar />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { recordApi } from '../../api/record'
import { getAccountList } from '../../api/account'
import type { Account } from '../../types/account'
import { getAccountIconClass } from '../../types/account'
import CustomTabbar from '../../components/CustomTabbar.vue'

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: '现金',
  liability: '负债',
}

const ASSET_SUMMARY_CONFIG: Record<string, { label: string; iconClass: string }> = {
  depreciable_asset: { label: '折旧资产', iconClass: 'depreciable-asset' },
  fixed_asset: { label: '固定资产', iconClass: 'fixed-asset' },
}

const netWorth = ref(0)
const loadingNetWorth = ref(true)
const accounts = ref<Account[]>([])

const displayAccounts = computed(() =>
  accounts.value.filter((a: Account) => !a.isDeleted && a.isVisible && a.type !== 'fixed_asset' && a.type !== 'depreciable_asset')
)

const assetSummary = computed(() => {
  const result: { type: string; label: string; iconClass: string; total: number; count: number }[] = []

  for (const [type, config] of Object.entries(ASSET_SUMMARY_CONFIG)) {
    const typeAccounts = accounts.value.filter((a: Account) => a.type === type && !a.isDeleted && a.isVisible)
    if (typeAccounts.length > 0) {
      const total = typeAccounts.reduce((sum: number, a: Account) => sum + (a.balance || 0), 0)
      result.push({
        type,
        label: config.label,
        iconClass: config.iconClass,
        total,
        count: typeAccounts.length,
      })
    }
  }

  // 资产汇总统一使用 Account.balance，数据源一致可审计
  return result
})

const formatAmount = (val: number) => {
  const prefix = val < 0 ? '-¥' : '¥'
  return prefix + Math.abs(val).toFixed(2)
}
const typeLabel = (type: string) => ACCOUNT_TYPE_LABELS[type] || type

const goToAccountRecords = (account: any) => {
  uni.navigateTo({ url: `/pages/analysis/account-records?accountId=${account.id}` })
}

const goToAssetDetail = (item: any) => {
  const depAccounts = accounts.value.filter((a: Account) => a.type === item.type && !a.isDeleted && a.isVisible)
  if (depAccounts.length === 1) {
    uni.navigateTo({ url: `/pages/analysis/account-records?accountId=${depAccounts[0].id}` })
  }
}

const loadAssets = async () => {
  loadingNetWorth.value = true
  try {
    const [nwRes, accRes] = await Promise.all([
      recordApi.getNetWorth(),
      getAccountList(),
    ])

    if (nwRes.success && nwRes.data) {
      netWorth.value = nwRes.data.netWorth
    }

    if (accRes.success && accRes.data) {
      accounts.value = accRes.data.filter((a: Account) => !a.isDeleted && a.isVisible)
    }
  } catch {
    // ignore
  }
  loadingNetWorth.value = false
}

onMounted(() => {
  loadAssets()
})

onShow(() => {
  // 每次显示页面时重新加载数据，确保数据是最新的
  loadAssets()
})
</script>

<style scoped>
.page {
  height: 100vh;
  background: var(--color-bg-page, #F5F7FA);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.net-worth-card {
  background: linear-gradient(135deg, var(--color-primary, #0D9488), var(--color-primary-dark, #0B7A70));
  padding: calc(48rpx + env(safe-area-inset-top)) 32rpx 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  flex-shrink: 0;
}

.content-scroll {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 80px;
}

.nw-label {
  font-size: var(--text-body);
  color: rgba(255, 255, 255, 0.75);
  letter-spacing: 2rpx;
}

.nw-value {
  font-size: var(--text-number-hero);
  font-weight: 800;
  color: var(--color-text-inverse, #FFFFFF);
  letter-spacing: 2rpx;
}

.nw-loading {
  font-size: var(--text-note);
  color: rgba(255, 255, 255, 0.5);
}

.section {
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 20rpx;
  margin: 0 20rpx 20rpx;
  padding: 28rpx;
}

.section-title {
  font-size: var(--text-body);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid var(--color-border-light, #F1F5F9);
}

.account-row {
  display: flex;
  align-items: center;
  padding: 18rpx 0;
  border-bottom: 1rpx solid var(--color-border-light, #F1F5F9);
}

.account-row:last-child {
  border-bottom: none;
}

.account-icon {
  width: 44rpx;
  height: 44rpx;
  margin-right: 18rpx;
  color: var(--color-text-primary, #333);
}

.account-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.account-name {
  font-size: var(--text-body);
  color: var(--color-text-primary, #1E293B);
  font-weight: 500;
}

.account-type {
  font-size: var(--text-note);
  color: var(--color-text-secondary, #94A3B8);
}

.account-balance {
  font-size: var(--text-body);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}

.account-balance.negative {
  color: var(--color-danger, #EF4444);
}

.account-arrow {
  font-size: var(--text-title);
  color: var(--color-text-secondary, #CCCCCC);
  margin-left: 8rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
  gap: 16rpx;
}

.empty-icon {
  font-size: 64rpx;
}

.empty-text {
  font-size: var(--text-body);
  color: var(--color-text-secondary, #94A3B8);
}

.empty-hint {
  font-size: var(--text-small);
  color: var(--color-text-tertiary, #CBD5E1);
}

.bottom-padding {
  height: 80rpx;
}
</style>
