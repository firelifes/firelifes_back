<template>
  <BottomScrollPopup
    ref="popupRef"
    v-model="visible"
    :z-index="2000"
    :height="80"
    :title="title"
    @close="handleClose"
  >
    <AccountSelector
      ref="selectorRef"
      :filterType="filterType"
      :filterRole="filterRole"
      :excludeAccountId="excludeAccountId"
      :emptyText="emptyText"
      @select="handleSelect"
    />
  </BottomScrollPopup>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Account } from '../../../types/account'
import BottomScrollPopup from '../../../components/BottomScrollPopup.vue'
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
const popupRef = ref<InstanceType<typeof BottomScrollPopup> | null>(null)
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
