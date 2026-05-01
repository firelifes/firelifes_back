<template>
  <view class="category-selector">
    <view v-for="group in categoryGroups" :key="group.id" class="group-section">
      <view class="group-header">
        <text class="group-name">{{ group.name }}</text>
      </view>
      <view class="category-grid">
        <view
          v-for="category in group.children"
          :key="category.id"
          class="category-item"
          :class="{ selected: selectedCategoryId === category.id }"
          @click="selectCategoryItem(category)"
        >
          <view class="category-icon">
            {{ getIconUrl(category.iconId) }}
          </view>
          <text class="category-name">{{ category.name }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { categoryApi, type CategoryGroup, type CategoryItem, type CategoryIcon } from '../../../api/category'

const props = defineProps<{
  transactionType: 'income' | 'expense'
  selectedCategoryId: number
}>()

const emit = defineEmits<{
  (e: 'select', category: { id: number; name: string; icon: string }): void
}>()

const categoryGroups = ref<CategoryGroup[]>([])
const selectedCategoryId = ref<number>(0)
const userIcons = ref<Map<number, string>>(new Map())

watch(() => props.transactionType, async () => {
  selectedCategoryId.value = 0
  await loadCategories()
})

onMounted(async () => {
  await loadIcons()
  await loadCategories()
})

const loadIcons = async () => {
  try {
    const res = await categoryApi.getUserIcons()
    if (res.success && res.data) {
      const iconMap = new Map<number, string>()
      res.data.forEach((icon: CategoryIcon) => {
        iconMap.set(icon.id, icon.url)
      })
      userIcons.value = iconMap
    }
  } catch (error) {
    console.error('加载图标失败:', error)
  }
}

const loadCategories = async () => {
  try {
    const res = await categoryApi.getUserCategories(props.transactionType)
    if (res.success && res.data) {
      categoryGroups.value = res.data
    }
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

const getIconUrl = (iconId: number): string => {
  return userIcons.value.get(iconId) || '📦'
}

const selectCategoryItem = (category: CategoryItem) => {
  selectedCategoryId.value = category.id
  emit('select', {
    id: category.id,
    name: category.name,
    icon: getIconUrl(category.iconId),
  })
}

defineExpose({
  reload: loadCategories
})
</script>

<style scoped>
.category-selector {
  padding: 20rpx;
}

.group-section {
  margin-bottom: 32rpx;
}

.group-header {
  padding: 12rpx 0;
  margin-bottom: 16rpx;
  border-bottom: 2rpx solid #FFD166;
}

.group-name {
  font-size: 28rpx;
  color: #333;
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
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  margin-bottom: 10rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.category-item.selected .category-icon {
  background: linear-gradient(135deg, #FFD166 0%, #FFC145 100%);
  box-shadow: 0 4rpx 16rpx rgba(255, 209, 102, 0.3);
}

.category-name {
  font-size: 24rpx;
  color: #333;
  text-align: center;
}
</style>
