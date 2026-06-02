<template>
  <WdPopup
    position="bottom"
    v-model="showPicker"
    :z-index="1001"
    :modal="true"
    :close-on-click-modal="true"
    custom-style="border-radius: 32rpx 32rpx 0 0; background: var(--color-bg-card, #FFFFFF);"
    @close="handleClose"
  >
    <view class="picker-header">
      <view class="picker-cancel" @tap="handleCancel">取消</view>
      <view class="picker-title">选择日期</view>
      <view class="picker-confirm" @tap="confirmDate">确定</view>
    </view>
    <WdDatetimePickerView
      v-if="showPicker"
      type="date"
      v-model="currentDate"
      custom-style="height: 420rpx"
    />
  </WdPopup>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps<{
  visible: boolean
  date: string
}>()

const emit = defineEmits<{
  (e: 'update:date', date: string): void
  (e: 'close'): void
}>()

const showPicker = ref(false)
const currentDate = ref<number>(0)

const getTodayDate = (): number => {
  return new Date().getTime()
}

const timestampToDateString = (timestamp: number | string): string => {
  if (!timestamp) return ''
  const date = new Date(Number(timestamp))
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const dateStringToTimestamp = (dateStr: string): number => {
  if (!dateStr) return new Date().getTime()
  return new Date(dateStr).getTime()
}

const confirmDate = () => {
  let dateStr = timestampToDateString(currentDate.value)
  if (!dateStr) {
    dateStr = timestampToDateString(getTodayDate())
  }
  emit('update:date', dateStr)
  showPicker.value = false
  emit('close')
}

const handleCancel = () => {
  showPicker.value = false
  emit('close')
}

const handleClose = () => {
  showPicker.value = false
  emit('close')
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    if (props.date) {
      currentDate.value = dateStringToTimestamp(props.date)
    } else {
      currentDate.value = getTodayDate()
    }
    showPicker.value = newVal
  } else {
    showPicker.value = newVal
  }
}, { immediate: true })

onMounted(() => {
  if (!currentDate.value) {
    currentDate.value = getTodayDate()
  }
})
</script>

<style scoped>
.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid rgba(229, 231, 235, 0.6);
  background: var(--color-bg-card, #FFFFFF);
}

.picker-cancel {
  font-size: var(--text-body);
  color: var(--color-text-secondary, #94A3B8);
  font-weight: 500;
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
}

.picker-cancel:active {
  background: rgba(156, 163, 175, 0.1);
  color: var(--color-text-secondary, #94A3B8);
}

.picker-title {
  font-size: var(--text-title);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}

.picker-confirm {
  font-size: var(--text-body);
  color: var(--color-primary, #0D9488);
  font-weight: 600;
  padding: 8rpx 20rpx;
  border-radius: 12rpx;
}

.picker-confirm:active {
  background: var(--color-primary-light, #E6F7F5);
  transform: scale(0.95);
}
</style>
