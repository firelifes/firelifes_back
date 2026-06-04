<template>
  <WdPopup
    position="bottom"
    v-model="visible"
    :z-index="1005"
    :modal="true"
    :close-on-click-modal="true"
    custom-style="border-radius: 32rpx 32rpx 0 0; background: var(--color-bg-card, #FFFFFF);"
    @close="handleClose"
  >
    <view class="popup-header">
      <text class="popup-title">选择利息分类</text>
      <text class="popup-close" @tap="handleClose">×</text>
    </view>
    <view class="category-list">
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
    </view>
  </WdPopup>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
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
  visible.value = false
  emit('close')
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
}

const handleClose = () => {
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

.category-list {
  max-height: 70vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 20rpx;
}

.group-section {
  margin-bottom: 32rpx;
}

.group-header {
  padding: 12rpx 0;
  margin-bottom: 16rpx;
  border-bottom: 2rpx solid var(--color-primary, #0D9488);
}

.group-name {
  font-size: var(--text-body);
  color: var(--color-text-primary, #1E293B);
  font-weight: 600;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30rpx 20rpx;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.category-item:active {
  transform: scale(0.95);
}

.category-icon {
  width: 88rpx;
  height: 88rpx;
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  color: var(--color-primary, #0D9488);
}

.category-item.selected .category-icon {
  background: linear-gradient(135deg, var(--color-primary, #0D9488) 0%, var(--color-primary-dark, #0B7A70) 100%);
  box-shadow: 0 4rpx 16rpx rgba(13, 148, 136, 0.3);
  color: var(--color-text-inverse, #FFFFFF);
}

.category-icon-svg {
  width: 44rpx;
  height: 44rpx;
}

.category-name {
  font-size: var(--text-small);
  color: var(--color-text-primary, #1E293B);
  text-align: center;
}
</style>
