<!-- ErrorState - 错误状态组件 -->
<template>
  <view class="error-state">
    <view class="error-icon-wrap">
      <view class="category-icon-svg category-icon-cuowu-tianchong error-icon"></view>
    </view>
    <text class="error-title">{{ title || '加载失败' }}</text>
    <text v-if="description" class="error-desc">{{ description }}</text>
    <view v-if="showRetry" class="retry-btn" @tap="emit('retry')">
      <text class="retry-text">{{ retryText || '重新加载' }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
const props = defineProps<{
  type?: string
  title?: string
  description?: string
  retryText?: string
  showRetry?: boolean
}>()

const emit = defineEmits<{
  (e: 'retry'): void
}>()
</script>

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 40rpx;
  gap: 12rpx;
}
.error-icon-wrap {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8rpx;
}
.error-icon {
  font-size: 40rpx;
  color: #EF4444;
}
.error-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #64748B;
}
.error-desc {
  font-size: 24rpx;
  color: #94A3B8;
  text-align: center;
}
.retry-btn {
  margin-top: 12rpx;
  padding: 12rpx 36rpx;
  background: #0D9488;
  border-radius: 40rpx;
}
.retry-text {
  font-size: 26rpx;
  color: #FFFFFF;
  font-weight: 500;
}
</style>
