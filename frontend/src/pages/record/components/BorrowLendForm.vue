<template>
  <view class="borrow-lend-form">
    <view class="direction-section">
      <view 
        class="direction-btn" 
        :class="{ active: direction === 'out' }"
        @tap="direction = 'out'"
      >
        <text class="direction-icon">🤝</text>
        <text class="direction-label">{{ isLend ? '借出' : '收回' }}</text>
      </view>
      <view 
        class="direction-btn" 
        :class="{ active: direction === 'in' }"
        @tap="direction = 'in'"
      >
        <text class="direction-icon">📋</text>
        <text class="direction-label">{{ isLend ? '收回' : '借入' }}</text>
      </view>
    </view>
    
    <view class="counterparty-section">
      <text class="section-label">对方</text>
      <view class="counterparty-input-wrap">
        <input 
          class="counterparty-input" 
          v-model="counterparty"
          placeholder="请输入对方名称"
        />
        <picker v-if="counterparties.length > 0" :value="counterpartyIndex" :range="counterparties" @change="onCounterpartyChange">
          <view class="counterparty-picker">
            <text>▼</text>
          </view>
        </picker>
      </view>
    </view>
    
    <view class="account-section">
      <text class="section-label">{{ isOutDirection ? '从' : '到' }}</text>
      <picker :value="accountIndex" :range="accounts" range-key="name" @change="onAccountChange">
        <view class="account-picker">
          <text>{{ selectedAccount?.name || '请选择账户' }}</text>
          <text class="picker-arrow">▼</text>
        </view>
      </picker>
    </view>
    
    <view v-if="showImplicitAccounts" class="implicit-accounts-section">
      <text class="section-label">{{ isOutDirection ? '应收账款' : '应付账款' }}</text>
      <view class="implicit-accounts-list">
        <view 
          v-for="account in implicitAccounts" 
          :key="account.id"
          class="implicit-account-item"
          :class="{ active: selectedImplicitAccount?.id === account.id }"
          @tap="selectedImplicitAccount = account"
        >
          <text class="implicit-account-name">{{ account.name }}</text>
          <text class="implicit-account-balance">¥{{ account.balance.toFixed(2) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Account } from '../../types/account'

const props = defineProps<{
  type: 'lend' | 'borrow'
  accounts: Account[]
  implicitAccounts: Account[]
  counterparties: string[]
}>()

const emit = defineEmits<{
  (e: 'update:direction', value: 'out' | 'in'): void
  (e: 'update:counterparty', value: string): void
  (e: 'update:account', value: Account | null): void
  (e: 'update:implicitAccount', value: Account | null): void
}>()

const direction = ref<'out' | 'in'>('out')
const counterparty = ref('')
const counterpartyIndex = ref(0)
const accountIndex = ref(0)
const selectedImplicitAccount = ref<Account | null>(null)

const isLend = computed(() => props.type === 'lend')
const isOutDirection = computed(() => direction.value === 'out')

const showImplicitAccounts = computed(() => {
  return props.implicitAccounts.length > 0 && !isOutDirection.value === isLend.value
})

const selectedAccount = computed(() => {
  return props.accounts[accountIndex.value]
})

const onCounterpartyChange = (e: { detail: { value: number } }) => {
  counterpartyIndex.value = e.detail.value
  counterparty.value = props.counterparties[e.detail.value]
  emit('update:counterparty', counterparty.value)
}

const onAccountChange = (e: { detail: { value: number } }) => {
  accountIndex.value = e.detail.value
  emit('update:account', selectedAccount.value || null)
}

watch(direction, (val) => {
  emit('update:direction', val)
})

watch(counterparty, (val) => {
  emit('update:counterparty', val)
})

watch(selectedAccount, (val) => {
  emit('update:account', val || null)
})

watch(selectedImplicitAccount, (val) => {
  emit('update:implicitAccount', val)
})
</script>

<style lang="scss" scoped>
.borrow-lend-form {
  padding: 24rpx;
}

.direction-section {
  display: flex;
  gap: 20rpx;
  margin-bottom: 32rpx;
}

.direction-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 24rpx;
  background: #FFFFFF;
  border-radius: 16rpx;
  border: 2rpx solid #E2E8F0;
  transition: all 0.2s ease;
  
  &.active {
    border-color: #0D9488;
    background: rgba(13, 148, 136, 0.05);
  }
}

.direction-icon {
  font-size: 48rpx;
}

.direction-label {
  font-size: 28rpx;
  font-weight: 500;
  color: #475569;
  
  .active & {
    color: #0D9488;
  }
}

.counterparty-section {
  margin-bottom: 24rpx;
}

.section-label {
  font-size: 26rpx;
  color: #64748B;
  margin-bottom: 12rpx;
  display: block;
}

.counterparty-input-wrap {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border-radius: 12rpx;
  border: 1rpx solid #E2E8F0;
  padding: 0 20rpx;
}

.counterparty-input {
  flex: 1;
  height: 88rpx;
  font-size: 28rpx;
  color: #1E293B;
}

.counterparty-picker {
  padding: 0 16rpx;
  font-size: 20rpx;
  color: #94A3B8;
}

.account-section {
  margin-bottom: 24rpx;
}

.account-picker {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #FFFFFF;
  border-radius: 12rpx;
  border: 1rpx solid #E2E8F0;
  padding: 24rpx 20rpx;
  font-size: 28rpx;
  color: #1E293B;
}

.picker-arrow {
  font-size: 20rpx;
  color: #94A3B8;
}

.implicit-accounts-section {
  background: #F8FAFC;
  border-radius: 16rpx;
  padding: 20rpx;
}

.implicit-accounts-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.implicit-account-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 20rpx;
  background: #FFFFFF;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s ease;
  
  &.active {
    border-color: #0D9488;
    background: rgba(13, 148, 136, 0.05);
  }
}

.implicit-account-name {
  font-size: 26rpx;
  color: #1E293B;
}

.implicit-account-balance {
  font-size: 26rpx;
  font-weight: 600;
  color: #0D9488;
}
</style>