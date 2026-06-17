<!-- LoadingState - 加载中状态组件 -->
<template>
  <view class="loading-state" :class="'size-' + (size || 'normal')">
    <view class="loading-spinner">
      <view class="spinner-ring"></view>
    </view>
    <text class="loading-text">{{ text || '加载中...' }}</text>
  </view>
</template>

<script setup lang="ts">
const props = defineProps<{
  text?: string
  size?: 'small' | 'normal'
}>()
</script>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  padding: 80rpx 0;
}
.loading-state.size-small {
  padding: 40rpx 0;
  gap: 10rpx;
}
.loading-spinner {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.size-small .loading-spinner {
  width: 32rpx;
  height: 32rpx;
}
.spinner-ring {
  width: 100%;
  height: 100%;
  border: 4rpx solid rgba(13, 148, 136, 0.2);
  border-top-color: #0D9488;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.size-small .spinner-ring {
  border-width: 3rpx;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loading-text {
  font-size: 26rpx;
  color: #94A3B8;
}
.size-small .loading-text {
  font-size: 22rpx;
}
</style>
