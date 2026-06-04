<template>
  <WdPopup
    position="bottom"
    v-model="visible"
    :z-index="3000"
    :modal="true"
    :close-on-click-modal="true"
    custom-style="border-radius: 32rpx 32rpx 0 0; background: var(--color-bg-card, #FFFFFF); max-height: 70vh; display: flex; flex-direction: column; overflow: hidden;"
    @close="handleClose"
  >
    <view class="popup-header">
      <text class="popup-title">选择利息分类</text>
      <text class="popup-close" @tap="handleClose">×</text>
    </view>
    <scroll-view scroll-y class="category-list" :show-scrollbar="false">
      <view
        v-for="group in categoryGroups"
        :key="group.id"
        class="group-section"
      >
        <view class="group-header">
          <text class="group-name">{{ group.name }}</text>
        </view>
        <view class="category-grid">
          <view
            v-for="category in group.children"
            :key="category.id"
            class="category-item"
            :class="{ selected: selectedCategoryId === category.id }"
            @tap="handleSelectCategory(category)"
          >
            <view class="category-icon">
              <view class="category-icon-svg" :class="getIconClass(category.name)"></view>
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
import { categoryApi, type CategoryGroup, type CategoryItem } from '../../../api/category'
import { getCategoryIconClass } from '../../../utils/category-icon-map'

const emit = defineEmits<{
  (e: 'select', category: CategoryItem): void
  (e: 'open'): void
  (e: 'close'): void
}>()

const categoryGroups = ref<CategoryGroup[]>([])
const visible = ref(false)
const selectedCategoryId = ref<number>(0)

const open = async (selectedId?: number) => {
  visible.value = true
  emit('open')
  await loadCategories()
  if (selectedId) {
    selectedCategoryId.value = selectedId
  }
}

const close = () => {
  handleClose()
}

const loadCategories = async () => {
  try {
    const res = await categoryApi.getUserCategories('expense')
    if (res.success && res.data) {
      categoryGroups.value = res.data
    }
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

const getIconClass = (name: string): string => {
  return getCategoryIconClass(name)
}

const handleSelectCategory = (category: CategoryItem) => {
  selectedCategoryId.value = category.id
  emit('select', category)
  visible.value = false
  emit('close')
}

const handleClose = () => {
  visible.value = false
  emit('close')
}

defineExpose({ open, close })
</script>

<style lang="scss" scoped>
.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 32rpx 20rpx;
  border-bottom: 1rpx solid var(--color-border, #E2E8F0);
  background: var(--color-bg-card, #FFFFFF);
  flex-shrink: 0;
}

.popup-title {
  font-size: var(--text-title, 32rpx);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
  letter-spacing: -0.3rpx;
}

.popup-close {
  font-size: 48rpx;
  font-weight: 300;
  color: var(--color-text-secondary, #94A3B8);
  padding: 4rpx 12rpx;
  line-height: 1;
}

.category-list {
  flex: 1;
  padding: 20rpx 24rpx 40rpx;
  overflow-y: auto;
}

.group-section {
  margin-bottom: 24rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.group-header {
  padding: 8rpx 0 16rpx;
}

.group-name {
  font-size: var(--text-body, 28rpx);
  color: var(--color-text-primary, #1E293B);
  font-weight: 600;
  letter-spacing: 0.3rpx;
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
  border-radius: 16rpx;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:active {
    transform: scale(0.92);
  }
}

.category-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid transparent;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--color-text-secondary, #94A3B8);
}

.category-item.selected .category-icon {
  background: var(--color-primary-light, #E6F7F5);
  border-color: var(--color-primary, #0D9488);
  box-shadow: 0 4rpx 16rpx rgba(13, 148, 136, 0.15);
  color: var(--color-primary, #0D9488);
}

.category-icon-svg {
  width: 48rpx;
  height: 48rpx;
}

.category-name {
  font-size: var(--text-small, 24rpx);
  color: var(--color-text-primary, #1E293B);
  text-align: center;
  line-height: 1.3;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 2rpx;
  transition: color 0.2s ease;
}

.category-item.selected .category-name {
  color: var(--color-primary, #0D9488);
  font-weight: 600;
}
</style>
