<template>
  <WdPopup
    position="bottom"
    v-model="visible"
    :z-index="1002"
    custom-style="border-radius: 32rpx 32rpx 0 0; background: var(--color-bg-card, #FFFFFF); max-height: 70vh; display: flex; flex-direction: column;"
    :close-on-click-modal="true"
    @close="handleClose"
  >
    <view class="popup-header">
      <text class="popup-title">修改分类</text>
      <text class="popup-close" @tap="handleClose">×</text>
    </view>
    <scroll-view scroll-y class="popup-body">
      <view v-for="group in categories" :key="group.id" class="group-section">
        <view class="group-header">
          <text class="group-name">{{ group.name }}</text>
        </view>
        <view class="category-grid">
          <view
            v-for="category in group.children"
            :key="category.id"
            class="category-item"
            :class="{ selected: selectedTypeId === category.id }"
            @click="handleSelect(category)"
          >
            <view class="category-icon">
              <view class="category-icon-svg" :class="getCategoryIconClass(category.name)"></view>
            </view>
            <text class="category-name">{{ category.name }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </WdPopup>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { CategoryGroup } from '../../../api/category'
import { getCategoryIconClass } from '../../../utils/category-icon-map'

const props = defineProps<{
  categories: CategoryGroup[]
  selectedTypeId: number
}>()

const emit = defineEmits<{
  (e: 'select', typeId: number): void
}>()

const visible = ref(false)

const open = () => {
  visible.value = true
}

const close = () => {
  visible.value = false
}

const handleClose = () => {
  visible.value = false
}

const handleSelect = (category: { id: number }) => {
  emit('select', category.id)
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
  flex-shrink: 0;
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

.popup-body {
  padding: 20rpx 24rpx 40rpx;
  overflow-y: auto;
}

.group-section {
  margin-bottom: 24rpx;
}

.group-header {
  padding: 8rpx 0 16rpx;
}

.group-name {
  font-size: var(--text-body);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24rpx 16rpx;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8rpx 0;
  transition: all 0.2s ease;
}

.category-item:active {
  transform: scale(0.92);
}

.category-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: var(--color-bg-card, #FFFFFF);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid transparent;
  transition: all 0.2s ease;
}

.category-icon .category-icon-svg {
  width: 40rpx;
  height: 40rpx;
  color: var(--color-text-secondary, #94A3B8);
}

.category-item.selected .category-icon {
  background: var(--color-primary-light, #E6F7F5);
  border-color: var(--color-primary, #00BFFF);
  box-shadow: 0 4rpx 16rpx rgba(0, 191, 255, 0.15);
}

.category-item.selected .category-icon .category-icon-svg {
  color: var(--color-primary, #00BFFF);
}

.category-name {
  font-size: var(--text-small);
  color: var(--color-text-primary, #1E293B);
  text-align: center;
}

.category-item.selected .category-name {
  color: var(--color-primary, #00BFFF);
  font-weight: 600;
}
</style>