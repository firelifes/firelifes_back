<!--
  pages/detail/function-list.vue - 功能页
  功能：展示全部功能入口，支持拖拽排序，排序后明细页前4个入口同步更新
  技术：Vue3 + TypeScript + uni-app + Pinia + Wot Design
-->
<template>
  <view class="page">
    <wd-navbar
      title="功能页"
      left-arrow
      fixed
      placeholder
      bordered
      safe-area-inset-top
      @click-left="goBack"
    />

    <view class="hint-bar">
      <view class="hint-icon category-icon-svg category-icon-dengpao"></view>
      <text class="hint-text">拖拽左侧手柄可排序，前 4 个将展示在明细页</text>
    </view>

    <view class="section" v-if="topItems.length">
      <view class="section-header">
        <view class="section-dot"></view>
        <text class="section-title">明细页展示</text>
        <text class="section-sub">前 4 个</text>
      </view>

      <view class="function-grid">
        <view
          v-for="(item, index) in topItems"
          :key="item.key"
          class="function-card top-card"
          :class="{ 'is-dragging': dragIndex === index }"
          :style="dragIndex === index ? dragStyle : {}"
          @tap="handleItemClick(item)"
        >
          <view
            class="drag-handle"
            @touchstart.prevent="onDragStart($event, index)"
            @touchmove.prevent="onDragMove($event)"
            @touchend.prevent="onDragEnd"
          >
            <view class="drag-dots">
              <view class="drag-dot"></view>
              <view class="drag-dot"></view>
              <view class="drag-dot"></view>
            </view>
          </view>
          <view class="function-icon" :style="{ background: item.bg || 'rgba(0, 191, 255, 0.08)' }">
            <view class="function-icon-svg category-icon-svg" :class="getFunctionIconClass(item.key)"></view>
          </view>
          <view class="function-info">
            <text class="function-name">{{ item.text }}</text>
            <text class="function-desc">{{ item.desc || '' }}</text>
          </view>
          <view class="rank-badge">{{ index + 1 }}</view>
        </view>
      </view>
    </view>

    <view class="section" v-if="restItems.length">
      <view class="section-header">
        <view class="section-dot secondary"></view>
        <text class="section-title">更多功能</text>
      </view>

      <view class="function-grid">
        <view
          v-for="(item, index) in restItems"
          :key="item.key"
          class="function-card"
          :class="{ 'is-dragging': dragIndex === index + 4 }"
          :style="dragIndex === index + 4 ? dragStyle : {}"
          @tap="handleItemClick(item)"
        >
          <view
            class="drag-handle"
            @touchstart.prevent="onDragStart($event, index + 4)"
            @touchmove.prevent="onDragMove($event)"
            @touchend.prevent="onDragEnd"
          >
            <view class="drag-dots">
              <view class="drag-dot"></view>
              <view class="drag-dot"></view>
              <view class="drag-dot"></view>
            </view>
          </view>
          <view class="function-icon" :style="{ background: item.bg || 'rgba(108, 92, 231, 0.08)' }">
            <view class="function-icon-svg category-icon-svg" :class="getFunctionIconClass(item.key)"></view>
          </view>
          <view class="function-info">
            <text class="function-name">{{ item.text }}</text>
            <text class="function-desc">{{ item.desc || '' }}</text>
          </view>
          <text class="function-arrow">›</text>
        </view>
      </view>
    </view>

    <view v-if="!localItems.length" class="empty-state">
      <view class="empty-icon category-icon-svg category-icon-zhangdan"></view>
      <text class="empty-text">暂无功能入口</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useFunctionItemsStore, type FunctionItem } from '../../stores/functionItems'
import { getFunctionIconClass } from '../../utils/category-icon-map'

const store = useFunctionItemsStore()
const localItems = ref<FunctionItem[]>([])

const dragIndex = ref(-1)
const dragStartY = ref(0)
const dragOffsetY = ref(0)
const ITEM_HEIGHT = 96

const topItems = computed(() => localItems.value.slice(0, 4))
const restItems = computed(() => localItems.value.slice(4))

const dragStyle = computed(() => ({
  transform: `translateY(${dragOffsetY.value}px) scale(1.02)`,
  zIndex: 10,
  opacity: 0.95,
}))

onMounted(() => {
  localItems.value = [...store.sortedItems]
})

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.redirectTo({ url: '/pages/detail/index' })
  }
}

const handleItemClick = (item: FunctionItem) => {
  if (dragIndex.value >= 0) return
  if (item.key === 'bill') {
    uni.navigateTo({ url: '/pages/detail/bill' })
    return
  }
  if (item.key === 'fire') {
    uni.navigateTo({ url: '/pages/detail/fire-progress' })
    return
  }
  uni.showToast({ title: `${item.text}功能开发中`, icon: 'none' })
}

const onDragStart = (e: any, index: number) => {
  dragIndex.value = index
  dragStartY.value = e.touches[0].clientY
  dragOffsetY.value = 0
}

const onDragMove = (e: any) => {
  if (dragIndex.value < 0) return
  const currentY = e.touches[0].clientY
  dragOffsetY.value = currentY - dragStartY.value

  const moveSteps = Math.round(dragOffsetY.value / ITEM_HEIGHT)
  if (moveSteps === 0) return

  const fromIndex = dragIndex.value
  const toIndex = Math.max(0, Math.min(localItems.value.length - 1, fromIndex + moveSteps))

  if (toIndex !== fromIndex) {
    const items = [...localItems.value]
    const [moved] = items.splice(fromIndex, 1)
    items.splice(toIndex, 0, moved)
    localItems.value = items
    dragIndex.value = toIndex
    dragStartY.value = currentY
    dragOffsetY.value = 0
  }
}

const onDragEnd = () => {
  if (dragIndex.value >= 0) {
    const newOrder = localItems.value.map((item) => item.key)
    store.reorder(newOrder)
  }
  dragIndex.value = -1
  dragOffsetY.value = 0
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg-page, #F5F7FA);
}

.hint-bar {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background: var(--color-primary-light, #E6F7F5);
  gap: 12rpx;
}

.hint-icon {
  width: 36rpx;
  height: 36rpx;
  color: var(--color-primary, #00BFFF);
  flex-shrink: 0;
}

.hint-text {
  font-size: var(--text-small);
  color: var(--color-primary, #00BFFF);
  line-height: 1.5;
}

.section {
  margin: 20rpx;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 0 16rpx;
}

.section-dot {
  width: 8rpx;
  height: 28rpx;
  border-radius: 4rpx;
  background: var(--color-primary, #00BFFF);
}

.section-dot.secondary {
  background: var(--color-text-secondary, #94A3B8);
}

.section-title {
  font-size: var(--text-body);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}

.section-sub {
  font-size: var(--text-note);
  color: var(--color-text-secondary, #94A3B8);
}

.function-grid {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.function-card {
  display: flex;
  align-items: center;
  padding: 16rpx 20rpx;
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 16rpx;
  gap: 20rpx;
  transition: transform 0.2s ease;
  position: relative;
}

.function-card.top-card {
  border: 1rpx solid rgba(0, 191, 255, 0.15);
}

.function-card.is-dragging {
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);
}

.drag-handle {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  padding: 8rpx;
  touch-action: none;
}

.drag-dots {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.drag-dot {
  width: 6rpx;
  height: 6rpx;
  border-radius: 50%;
  background: var(--color-text-secondary, #94A3B8);
  opacity: 0.4;
}

.function-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.function-icon-svg {
  width: 40rpx;
  height: 40rpx;
  color: var(--color-primary, #00BFFF);
}

.function-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.function-name {
  font-size: var(--text-body);
  color: var(--color-text-primary, #1E293B);
  font-weight: 500;
}

.function-desc {
  font-size: var(--text-note);
  color: var(--color-text-secondary, #94A3B8);
}

.rank-badge {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: var(--color-primary, #00BFFF);
  color: #FFFFFF;
  font-size: var(--text-caption);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.function-arrow {
  font-size: var(--text-title);
  color: var(--color-text-secondary, #94A3B8);
  flex-shrink: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 160rpx 0;
  gap: 16rpx;
}

.empty-icon {
  width: 80rpx;
  height: 80rpx;
  color: var(--color-text-secondary, #94A3B8);
  opacity: 0.4;
}

.empty-text {
  font-size: var(--text-body);
  color: var(--color-text-secondary, #94A3B8);
}
</style>