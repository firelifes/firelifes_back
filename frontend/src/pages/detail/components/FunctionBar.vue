<template>
  <view class="function-bar-wrapper">
    <view class="function-bar">
      <view
        v-for="item in visibleItems"
        :key="item.key"
        class="function-item"
        @tap="handleItemClick(item)"
      >
        <view class="function-icon">
          <view class="function-icon-svg category-icon-svg" :class="getFunctionIconClass(item.key)"></view>
        </view>
        <text class="function-text">{{ item.text }}</text>
      </view>
      <view
        class="function-item"
        @tap="handleMoreClick"
      >
        <view class="function-icon">
          <view class="function-icon-svg category-icon-svg category-icon-gengduo"></view>
        </view>
        <text class="function-text">更多</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getFunctionIconClass } from '../../../utils/category-icon-map'

export interface FunctionItem {
  key: string
  icon: string
  text: string
  emoji?: string
}

const props = withDefaults(defineProps<{
  items: FunctionItem[]
  maxVisible?: number
}>(), {
  maxVisible: 5
})

const emit = defineEmits<{
  'item-click': [item: FunctionItem]
  'more-click': []
}>()

const visibleItems = computed(() => {
  return props.items.slice(0, props.maxVisible - 1)
})

const handleItemClick = (item: FunctionItem) => {
  emit('item-click', item)
}

const handleMoreClick = () => {
  emit('more-click')
}
</script>

<style scoped>
.function-bar-wrapper {
  flex-shrink: 0;
  width: 100%;
  position: relative;
  z-index: 1;
}

.function-bar {
  display: flex;
  justify-content: space-around;
  padding: 18rpx 20rpx;
  background: var(--color-bg-card, #FFFFFF);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.function-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.function-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: var(--color-primary-light, #E6F7F5);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8rpx;
}

.function-icon-svg {
  width: 40rpx;
  height: 40rpx;
  color: var(--color-primary, #00BFFF);
}

.function-text {
  font-size: var(--text-caption);
  color: var(--color-text-secondary, #94A3B8);
}
</style>