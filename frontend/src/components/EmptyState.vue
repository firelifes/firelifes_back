<!-- EmptyState - 空数据状态占位组件 -->
<template>
  <view class="empty-state">
    <view class="empty-icon-wrap">
      <view class="category-icon-svg category-icon-jizhang empty-icon" v-if="type === 'no-data' || !type"></view>
      <view class="category-icon-svg category-icon-cuowu-tianchong empty-icon" v-else-if="type === 'error'"></view>
      <view class="category-icon-svg category-icon-sousuo empty-icon" v-else></view>
    </view>
    <text class="empty-title">{{ title || '暂无数据' }}</text>
    <text v-if="description" class="empty-desc">{{ description }}</text>
    <view v-if="showAction && actionText" class="empty-action" @tap="emit('action')">
      <text class="action-text">{{ actionText }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
const props = defineProps<{
  type?: string
  title?: string
  description?: string
  actionText?: string
  showAction?: boolean
}>()

const emit = defineEmits<{
  (e: 'action'): void
}>()
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 40rpx;
  gap: 16rpx;
}
.empty-icon-wrap {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8rpx;
}
.empty-icon {
  font-size: 48rpx;
  color: #94A3B8;
}
.empty-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #64748B;
}
.empty-desc {
  font-size: 24rpx;
  color: #94A3B8;
  text-align: center;
}
.empty-action {
  margin-top: 8rpx;
  padding: 12rpx 32rpx;
  background: #0D9488;
  border-radius: 40rpx;
}
.action-text {
  font-size: 26rpx;
  color: #FFFFFF;
  font-weight: 500;
}
</style>
