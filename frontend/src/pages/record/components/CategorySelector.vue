<template>
  <view class="category-selector">
    <view v-if="frequentGroup" class="group-section">
      <view class="group-header">
        <text class="group-name">常用</text>
      </view>
      <view class="category-grid">
        <view
          v-for="category in frequentGroup.children"
          :key="category.id"
          class="category-item"
          :class="{ selected: selectedCategoryId === category.id }"
          @click="selectCategoryItem(category)"
        >
          <view class="category-icon">
            <view class="category-icon-svg" :class="getIconClass(category.iconId, category.name)"></view>
          </view>
          <text class="category-name">{{ category.name }}</text>
        </view>
      </view>
    </view>
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
            <view class="category-icon-svg" :class="getIconClass(category.iconId, category.name)"></view>
          </view>
          <text class="category-name">{{ category.name }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { categoryApi, type CategoryGroup, type CategoryItem, type CategoryIcon } from '../../../api/category'
import { getFrequentCategoryIds } from '../../../utils/category-frequency'
import { getCategoryIconClass } from '../../../utils/category-icon-map'

const props = defineProps<{
  transactionType: 'income' | 'expense'
  selectedCategoryId: number
}>()

const emit = defineEmits<{
  (e: 'select', category: { id: number; name: string; icon: string }): void
}>()

const categoryGroups = ref<CategoryGroup[]>([])
const frequentCategoryIds = ref<number[]>([])

const frequentGroup = computed(() => {
  if (frequentCategoryIds.value.length === 0) return null

  const allChildren: CategoryItem[] = []
  for (const group of categoryGroups.value) {
    for (const child of group.children) {
      allChildren.push(child)
    }
  }

  const topChildren = frequentCategoryIds.value
    .map(id => allChildren.find(c => c.id === id))
    .filter((c): c is CategoryItem => !!c)

  if (topChildren.length === 0) return null

  return {
    id: -1,
    name: '常用',
    sortOrder: -1,
    children: topChildren
  } as CategoryGroup
})
const selectedCategoryId = ref<number>(0)
const userIcons = ref<Map<number, string>>(new Map())

const getIconClass = (_iconId: number, name: string): string => {
  return getCategoryIconClass(name)
}

watch(() => props.transactionType, async () => {
  selectedCategoryId.value = 0
  await loadCategories()
  await loadFrequentCategories()
})

watch(() => props.selectedCategoryId, (newVal) => {
  selectedCategoryId.value = newVal
})

onMounted(async () => {
  await loadIcons()
  await loadCategories()
  await loadFrequentCategories()
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

const loadFrequentCategories = async () => {
  try {
    const frequencies = await getFrequentCategoryIds(props.transactionType)
    frequentCategoryIds.value = frequencies.map(f => f.typeId)
  } catch {
    frequentCategoryIds.value = []
  }
}

// 根据分类名返回 SVG 图标 class
const getIconUrl = (iconId: number): string => {
  return userIcons.value.get(iconId) || ''
}

const selectCategoryItem = (category: CategoryItem) => {
  selectedCategoryId.value = category.id
  emit('select', {
    id: category.id,
    name: category.name,
    icon: getIconClass(category.iconId, category.name),
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
  font-size: var(--text-number);
  margin-bottom: 10rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  color: var(--color-primary, #0D9488);
}

.category-item.selected .category-icon {
  background: linear-gradient(135deg, var(--color-primary, #0D9488) 0%, var(--color-primary-dark, #0B7A70) 100%);
  box-shadow: 0 4rpx 16rpx rgba(13, 148, 136, 0.3);
  color: var(--color-text-inverse, #FFFFFF);
}

.category-name {
  font-size: var(--text-small);
  color: var(--color-text-primary, #1E293B);
  text-align: center;
}
</style>
