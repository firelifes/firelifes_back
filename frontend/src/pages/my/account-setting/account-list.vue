<template>
  <view class="page-container">
    <view class="settings-header">
      <view class="header-back" @click="goBack">
        <view class="header-back-icon category-icon-svg category-icon-chevron-left"></view>
      </view>
      <text class="header-title">我的账户</text>
      <view class="header-right" @click="goToAdd">
        <text class="header-add-icon">+</text>
      </view>
    </view>

    <view class="content-scroll">
      <view v-if="loading" class="skeleton-container">
        <view v-for="i in 3" :key="i" class="skeleton-card">
          <view class="skeleton-icon"></view>
          <view class="skeleton-info">
            <view class="skeleton-line skeleton-line-long"></view>
            <view class="skeleton-line skeleton-line-short"></view>
          </view>
          <view class="skeleton-balance"></view>
        </view>
      </view>

      <view v-else-if="!hasAccounts" class="empty-state">
        <view class="empty-icon-wrap">
          <view class="empty-icon category-icon-svg account-icon-wallet"></view>
        </view>
        <text class="empty-title">还没有添加账户</text>
        <text class="empty-subtitle">添加你的第一个账户开始记账吧</text>
        <view class="empty-btn" @click="goToAdd">
          <text class="empty-btn-text">添加账户</text>
        </view>
      </view>

      <view v-else>
        <view v-for="group in groupedAccounts" :key="group.type" class="group-section">
          <view class="group-title">
            <text class="title-text">{{ getTypeLabel(group.type) }}</text>
          </view>

          <view class="account-list">
            <wd-swipe-action
              v-for="account in group.accounts"
              :key="account.id"
              :right-width="(account.isDefaultExpense || account.isDefaultIncome) ? 70 : 140"
            >
              <template #default>
                <view class="account-card" @click="goToEdit(account.id)">
                  <view class="account-icon category-icon-svg" :class="getAccountIconClass(account.icon, account.type)"></view>
                  <view class="account-info">
                    <view class="name-row">
                      <text class="account-name">{{ account.name }}</text>
                      <view class="badges-row">
                        <view v-if="account.isDefaultExpense" class="default-badge expense">
                          <text class="badge-text">默认支出</text>
                        </view>
                        <view v-if="account.isDefaultIncome" class="default-badge income">
                          <text class="badge-text">默认收入</text>
                        </view>
                      </view>
                    </view>
                    <text v-if="account.description" class="account-desc">{{ account.description }}</text>
                  </view>
                  <view class="card-right">
                    <text class="balance" :class="{ negative: account.balance < 0 }">
                      {{ formatBalance(account.balance) }}
                    </text>
                    <text class="card-arrow">›</text>
                  </view>
                </view>
              </template>

              <template #right>
                <view class="swipe-actions">
                  <view
                    class="swipe-btn swipe-btn-edit"
                    @click.stop="handleEdit(account)"
                  >
                    <text class="swipe-btn-text">编辑</text>
                  </view>
                  <view
                    v-if="!account.isDefaultExpense && !account.isDefaultIncome"
                    class="swipe-btn swipe-btn-delete"
                    @click.stop="handleDeleteClick(account)"
                  >
                    <text class="swipe-btn-text">删除</text>
                  </view>
                </view>
              </template>
            </wd-swipe-action>
          </view>
        </view>
      </view>

      <view class="safe-bottom"></view>
    </view>

    <wd-dialog
      v-model="showDeleteDialog"
      title="删除账户"
      show-cancel-button
      show-confirm-button
      confirm-button-text="删除"
      cancel-button-text="取消"
      @confirm="confirmDelete"
    >
      <text>确定要删除「{{ deleteTarget?.name }}」吗？删除后不可恢复。</text>
    </wd-dialog>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getAccountList, deleteAccount } from '../../../api/account'
import { navigateBack } from '../../../utils/navigate'
import type { Account, AccountType } from '../../../types/account'
import { ACCOUNT_TYPE_OPTIONS, getBalanceColor, getAccountIconClass } from '../../../types/account'

const loading = ref(false)
const accounts = ref<Account[]>([])
const showDeleteDialog = ref(false)
const deleteTarget = ref<Account | null>(null)

const groupedAccounts = computed(() => {
  const groups: { type: AccountType; accounts: Account[] }[] = []
  const typeOrder: AccountType[] = ['cash', 'investment', 'fixed_asset', 'depreciable_asset', 'liability', 'credit_card']
  typeOrder.forEach(type => {
    const typeAccounts = accounts.value.filter(a => a.type === type)
    if (typeAccounts.length > 0) {
      groups.push({ type, accounts: typeAccounts })
    }
  })
  return groups
})

const hasAccounts = computed(() => accounts.value.length > 0)

const getTypeLabel = (type: AccountType): string => {
  const option = ACCOUNT_TYPE_OPTIONS.find(o => o.value === type)
  return option?.label || type
}

const getTypeIconClass = (type: AccountType): string => {
  const map: Record<AccountType, string> = {
    cash: 'account-icon-wallet',
    investment: 'account-icon-trending',
    fixed_asset: 'account-icon-house',
    depreciable_asset: 'account-icon-mobile',
    liability: 'account-icon-loan',
    credit_card: 'account-icon-credit-card',
  }
  return map[type] || 'account-icon-wallet'
}

const formatBalance = (balance: number): string => {
  const prefix = balance < 0 ? '-' : ''
  return prefix + '¥' + Math.abs(balance).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

async function loadAccounts() {
  loading.value = true
  try {
    const res = await getAccountList()
    if (res.success) {
      accounts.value = res.data
    } else {
      uni.showToast({ title: res.message || '获取账户列表失败', icon: 'none' })
    }
  } catch (error) {
    console.error('加载账户列表失败:', error)
    uni.showToast({ title: '网络错误', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function goBack() {
  navigateBack('/pages/my/index')
}

function goToAdd() {
  uni.navigateTo({ url: '/pages/my/account-setting/account-edit' })
}

function goToEdit(id: string) {
  uni.navigateTo({ url: `/pages/my/account-setting/account-edit?id=${id}` })
}

function handleEdit(account: Account) {
  goToEdit(account.id)
}

function handleDeleteClick(account: Account) {
  deleteTarget.value = account
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  const account = deleteTarget.value
  try {
    const apiRes = await deleteAccount(account.id)
    if (apiRes.success) {
      uni.showToast({ title: `已删除「${account.name}」`, icon: 'success', duration: 2000 })
      showDeleteDialog.value = false
      deleteTarget.value = null
      loadAccounts()
    } else {
      uni.showToast({ title: apiRes.message || '删除失败', icon: 'none' })
    }
  } catch (err) {
    uni.showToast({ title: '网络错误', icon: 'none' })
  }
}

onShow(() => {
  loadAccounts()
})
</script>

<style lang="scss" scoped>
.page-container {
  overflow-x: hidden;
  min-height: 100vh;
  background-color: #F8F9FA;
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

.header-add-icon {
  font-size: 40rpx;
  color: #fff;
  line-height: 1;
}

.content-scroll {
  padding: 24rpx;
  padding-top: 16rpx;
}

.skeleton-container {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.skeleton-card {
  height: 96rpx;
  background-color: $uni-bg-color;
  border-radius: 12rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  border: 1px solid $uni-border-color;
}

.skeleton-icon {
  width: 48rpx;
  height: 48rpx;
  border-radius: 12rpx;
  background: linear-gradient(90deg, #F5F5F5 25%, #EEEEEE 50%, #F5F5F5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  flex-shrink: 0;
}

.skeleton-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-left: 16rpx;
}

.skeleton-line {
  border-radius: 6rpx;
  background: linear-gradient(90deg, #F5F5F5 25%, #EEEEEE 50%, #F5F5F5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-line-long {
  width: 200rpx;
  height: 24rpx;
}

.skeleton-line-short {
  width: 120rpx;
  height: 18rpx;
}

.skeleton-balance {
  width: 100rpx;
  height: 28rpx;
  border-radius: 6rpx;
  background: linear-gradient(90deg, #F5F5F5 25%, #EEEEEE 50%, #F5F5F5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 160rpx 48rpx;
}

.empty-icon-wrap {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: var(--color-primary-light, #E6F7F5);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
}

.empty-icon {
  width: 60rpx;
  height: 60rpx;
  color: $uni-color-primary;
}

.empty-title {
  font-size: var(--text-body);
  font-weight: 600;
  color: $uni-text-color;
  margin-bottom: 12rpx;
}

.empty-subtitle {
  font-size: var(--text-small);
  color: $uni-text-color-grey;
  margin-bottom: 48rpx;
}

.empty-btn {
  width: 280rpx;
  height: 72rpx;
  border-radius: 36rpx;
  background: $uni-color-primary;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms ease;
}

.empty-btn:active {
  opacity: 0.9;
  transform: scale(0.98);
}

.empty-btn-text {
  font-size: var(--text-body);
  font-weight: 500;
  color: $uni-text-color-inverse;
}

.group-section {
  margin-bottom: 48rpx;
}

.group-title {
  display: flex;
  align-items: center;
  height: 40rpx;
  margin-bottom: 16rpx;
}

.title-icon {
  display: none;
}

.title-text {
  font-size: var(--text-small);
  font-weight: 500;
  color: #94A3B8;
}

.title-count {
  display: none;
}

.account-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.account-card {
  height: 112rpx;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
  background-color: #FFFFFF;
  border-radius: 16rpx;
  transition: all 150ms ease;
}

.account-card + .account-card {
  margin-top: 2rpx;
}

.account-card:first-child {
  border-radius: 16rpx 16rpx 0 0;
}

.account-card:last-child {
  border-radius: 0 0 16rpx 16rpx;
}

.account-card:only-child {
  border-radius: 16rpx;
}

.account-card:active {
  background-color: #FAFAFA;
}

.account-icon {
  flex-shrink: 0;
  margin-right: 16rpx;
  color: $uni-color-primary;
}

.account-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.account-name {
  font-size: var(--text-body);
  font-weight: 500;
  color: $uni-text-color;
  line-height: 1.2;
}

.badges-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.default-badge {
  padding: 0;
}

.default-badge.expense {
  background: transparent;
}

.default-badge.income {
  background: transparent;
}

.badge-text {
  font-size: var(--text-caption);
  color: $uni-color-primary;
  font-weight: 500;
}

.default-badge.income .badge-text {
  color: $uni-color-success;
}

.account-desc {
  font-size: var(--text-small);
  color: #CBD5E1;
  margin-top: 4rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-right {
  display: flex;
  align-items: center;
  margin-left: 16rpx;
  flex-shrink: 0;
}

.balance {
  font-size: var(--text-body);
  font-weight: 600;
  color: $uni-text-color;
  margin-right: 8rpx;
}

.balance.negative {
  color: $uni-color-error;
}

.card-arrow {
  font-size: var(--text-title);
  color: $uni-text-color-disable;
  font-weight: 300;
}

.swipe-actions {
  display: flex;
  height: 100%;
}

.swipe-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 70rpx;
  transition: all 150ms ease;
}

.swipe-btn-edit {
  background: #F5F5F5;
}

.swipe-btn-delete {
  background: var(--color-danger-light, #FEF2F2);
}

.swipe-btn-text {
  font-size: var(--text-small);
  font-weight: 500;
}

.swipe-btn-edit .swipe-btn-text {
  color: $uni-text-color-grey;
}

.swipe-btn-delete .swipe-btn-text {
  color: $uni-color-error;
}

.safe-bottom {
  height: 48rpx;
}
</style>