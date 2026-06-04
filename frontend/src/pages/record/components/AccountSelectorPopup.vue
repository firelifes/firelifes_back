<template>
  <WdPopup
    position="bottom"
    v-model="visible"
    :z-index="1005"
    custom-style="border-radius: 32rpx 32rpx 0 0; background: var(--color-bg-card, #FFFFFF);"
    :close-on-click-modal="true"
    @close="handleClose"
  >
    <view class="popup-header">
      <text class="popup-title">{{ title }}</text>
      <text class="popup-close" @tap="handleClose">×</text>
    </view>
    <AccountSelector
      ref="selectorRef"
      :filterType="filterType"
      :filterRole="filterRole"
      :excludeAccountId="excludeAccountId"
      :emptyText="emptyText"
      @select="handleSelect"
    />
  </WdPopup>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Account } from '../../../types/account'
import AccountSelector from './AccountSelector.vue'

const props = defineProps<{
  title?: string
  filterType?: 'expense' | 'income' | 'transfer' | 'repayment'
  filterRole?: 'from' | 'to'
  excludeAccountId?: string
  emptyText?: string
}>()

const emit = defineEmits<{
  (e: 'select', account: Account): void
}>()

const visible = ref(false)
const selectorRef = ref<InstanceType<typeof AccountSelector> | null>(null)

const open = (selectedId?: string) => {
  visible.value = true
  if (selectedId) {
    setTimeout(() => {
      selectorRef.value?.setSelected(selectedId)
    }, 100)
  }
}

const close = () => {
  visible.value = false
}

const handleClose = () => {
  visible.value = false
}

const handleSelect = (account: Account) => {
  emit('select', account)
  visible.value = false
}

defineExpose({ open, close })
</script>

<style scoped>
.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 32rpx 20rpx;
  border-bottom: 1rpx solid var(--color-border, #E2E8F0);
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 32rpx 32rpx 0 0;
}

.popup-title {
  font-size: var(--text-title);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}

.popup-close {
  font-size: var(--text-number);
  color: var(--color-text-secondary, #94A3B8);
  padding: 4rpx 12rpx;
}
</style>
