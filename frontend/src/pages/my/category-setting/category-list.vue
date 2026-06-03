<template>
  <view class="page-container">
    <view class="settings-header">
      <view class="header-back" @click="goBack">
        <view class="header-back-icon category-icon-svg category-icon-chevron-left"></view>
      </view>
      <text class="header-title">{{ groupName }}</text>
      <view class="header-right" @click="handleAdd">
        <text class="header-add-icon">+</text>
      </view>
    </view>

    <view class="content-scroll">
      <view v-if="loading" class="loading-state">
        <view class="loading-icon category-icon-svg category-icon-loading"></view>
        <text class="loading-text">加载中...</text>
      </view>

      <view v-else-if="!hasCategories" class="empty-state">
        <view class="empty-icon category-icon-svg category-icon-fenleishezhi"></view>
        <text class="empty-text">添加你的第一个子分类</text>
      </view>

      <view v-else class="category-list">
        <view
          v-for="(category, index) in sortedCategories"
          :key="category.id"
          class="group-row"
          :class="{ 'row-dragging': draggingIndex === index }"
        >
          <view
            class="drag-handle"
            @touchstart="onDragStart($event, index)"
            @touchmove="onDragMove($event)"
            @touchend="onDragEnd"
          >
            <view class="drag-icon category-icon-svg category-icon-shuxian"></view>
          </view>
          <view class="swipe-wrapper">
            <wd-swipe-action
              :right-width="140"
            >
              <template #default>
                <view
                  class="category-card"
                  :class="{ 'card-disabled': !category.isEnabled }"
                >
                  <view class="card-icon-wrapper">
                    <view class="card-icon" :class="getIconClass(category.name)"></view>
                  </view>
                  <view class="card-info">
                    <view class="card-title-row">
                      <text class="card-title">{{ category.name }}</text>
                      <view v-if="!category.isUserCreated" class="default-badge">
                        <text class="badge-text">默认</text>
                      </view>
                    </view>
                    <text v-if="!category.isEnabled" class="disabled-label">已禁用</text>
                  </view>
                </view>
              </template>

              <template #right>
                <view class="swipe-actions">
                  <view
                    class="swipe-btn swipe-btn-edit"
                    @click.stop="handleEdit(category)"
                  >
                    <text class="swipe-btn-text">编辑</text>
                  </view>
                  <view
                    v-if="category.isUserCreated"
                    class="swipe-btn swipe-btn-delete"
                    @click.stop="handleDelete(category)"
                  >
                    <text class="swipe-btn-text">删除</text>
                  </view>
                  <view
                    v-else
                    class="swipe-btn swipe-btn-toggle"
                    @click.stop="handleToggle(category)"
                  >
                    <text class="swipe-btn-text">{{ category.isEnabled ? '禁用' : '启用' }}</text>
                  </view>
                </view>
              </template>
            </wd-swipe-action>
          </view>
        </view>
      </view>

      <view class="safe-bottom"></view>
    </view>

    <category-edit-popup ref="editPopupRef" @saved="loadCategories" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { categoryApi, type UserCategory } from '../../../api/category'
import { getCategoryIconClass } from '../../../utils/category-icon-map'
import { navigateBack } from '../../../utils/navigate'
import CategoryEditPopup from './category-edit.vue'

const groupId = ref(0)
const groupName = ref('')
const groupType = ref<'income' | 'expense'>('expense')
const loading = ref(false)
const categories = ref<UserCategory[]>([])

const draggingIndex = ref(-1)
const dragStartY = ref(0)
const dragOffsetY = ref(0)
const itemHeightPx = ref(80)

const editPopupRef = ref<InstanceType<typeof CategoryEditPopup> | null>(null)

const hasCategories = computed(() => categories.value.length > 0)

const sortedCategories = computed(() => {
  const list = [...categories.value]
  const enabled = list.filter(c => c.isEnabled).sort((a, b) => a.sortOrder - b.sortOrder)
  const disabled = list.filter(c => !c.isEnabled).sort((a, b) => a.sortOrder - b.sortOrder)
  return [...enabled, ...disabled]
})

function getIconClass(name: string): string {
  return getCategoryIconClass(name)
}

async function loadCategories() {
  loading.value = true
  try {
    const res = await categoryApi.getCategoriesByGroup(groupId.value)
    if (res.success) {
      categories.value = res.data
    } else {
      uni.showToast({
        title: res.message || '获取分类列表失败',
        icon: 'none'
      })
    }
  } catch (err) {
    console.error('加载分类列表失败:', err)
    uni.showToast({
      title: '网络错误',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

function goBack() {
  navigateBack('/pages/my/category-setting/category-group-list')
}

function handleAdd() {
  editPopupRef.value?.openAdd({
    groupId: groupId.value,
    groupName: groupName.value,
    groupType: groupType.value
  })
}

function handleEdit(category: UserCategory) {
  editPopupRef.value?.openEdit(category, groupName.value)
}

async function handleToggle(category: UserCategory) {
  try {
    const res = await categoryApi.toggleCategory(category.id)
    if (res.success) {
      uni.showToast({
        title: res.data.isEnabled ? '已启用' : '已禁用',
        icon: 'success'
      })
      loadCategories()
    } else {
      uni.showToast({ title: res.message || '操作失败', icon: 'none' })
    }
  } catch (err) {
    console.error('操作失败:', err)
    uni.showToast({ title: '网络错误', icon: 'none' })
  }
}

async function handleDelete(category: UserCategory) {
  uni.showModal({
    title: '提示',
    content: '确定要删除此分类吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const apiRes = await categoryApi.deleteCategory(category.id)
          if (apiRes.success) {
            uni.showToast({ title: '删除成功', icon: 'success' })
            loadCategories()
          } else {
            uni.showToast({ title: apiRes.message || '删除失败', icon: 'none' })
          }
        } catch (err) {
          uni.showToast({ title: '网络错误', icon: 'none' })
        }
      }
    }
  })
}

function onDragStart(e: any, index: number) {
  const realIndex = sortedCategories.value.indexOf(categories.value[index])
  draggingIndex.value = realIndex
  const touch = e.touches ? e.touches[0] : e
  dragStartY.value = touch.clientY
  dragOffsetY.value = 0
}

function onDragMove(e: any) {
  if (draggingIndex.value === -1) return
  const touch = e.touches ? e.touches[0] : e
  const deltaY = touch.clientY - dragStartY.value
  dragOffsetY.value = deltaY

  const moveSteps = Math.round(deltaY / itemHeightPx.value)
  if (moveSteps === 0) return

  const fromIndex = draggingIndex.value
  const toIndex = Math.max(0, Math.min(categories.value.length - 1, fromIndex + moveSteps))

  const fromItem = categories.value[fromIndex]
  const toItem = categories.value[toIndex]
  if (!fromItem.isEnabled || !toItem.isEnabled) return
  if (fromIndex === toIndex) return

  const items = [...categories.value]
  const [removed] = items.splice(fromIndex, 1)
  items.splice(toIndex, 0, removed)
  categories.value = items
  draggingIndex.value = toIndex
  dragStartY.value = touch.clientY
  dragOffsetY.value = 0
}

function onDragEnd() {
  if (draggingIndex.value === -1) return
  const orderedIds = categories.value.map(c => c.id)
  draggingIndex.value = -1
  dragOffsetY.value = 0
  categoryApi.reorderCategories(groupId.value, orderedIds).catch(() => {
    loadCategories()
  })
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = (currentPage.$page?.options || currentPage.options || {}) as Record<string, string>

  if (options.groupId) {
    groupId.value = parseInt(options.groupId)
  }
  if (options.groupName) {
    groupName.value = decodeURIComponent(options.groupName)
  }
  if (options.groupType) {
    groupType.value = options.groupType as 'income' | 'expense'
  }

  loadCategories()
})

onShow(() => {
  if (groupId.value > 0) {
    loadCategories()
  }
})
</script>

<style scoped>
.page-container {
  overflow-x: hidden;
  min-height: 100vh;
  background-color: var(--color-bg-page, #F5F7FA);
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(env(safe-area-inset-top) + 20rpx) 30rpx 20rpx;
  background: linear-gradient(135deg, var(--color-primary, #00BFFF) 0%, var(--color-primary-dark, #0099CC) 100%);
  flex-shrink: 0;
  position: relative;
}

.header-back {
  position: absolute;
  left: 20rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-back-icon {
  width: 40rpx;
  height: 40rpx;
  color: #fff;
}

.header-title {
  font-size: var(--text-nav);
  font-weight: 600;
  color: #fff;
}

.header-right {
  position: absolute;
  right: 20rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-add-icon {
  font-size: 40rpx;
  color: #fff;
  line-height: 1;
}

.content-scroll {
  padding: 24rpx;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 160rpx 0;
}

.loading-icon,
.empty-icon {
  width: 120rpx;
  height: 120rpx;
  margin-bottom: 24rpx;
  opacity: 0.4;
}

.loading-text,
.empty-text {
  font-size: var(--text-body);
  color: var(--color-text-secondary, #94A3B8);
  text-align: center;
  line-height: 1.6;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.group-row {
  display: flex;
  align-items: center;
  transition: transform 0.2s ease;
}

.swipe-wrapper {
  flex: 1;
  overflow: hidden;
}

.group-row .drag-handle {
  width: 48rpx;
  height: 120rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: -8rpx;
  z-index: 5;
}

.drag-icon {
  width: 32rpx;
  height: 32rpx;
  color: var(--color-text-tertiary, #CBD5E1);
}

.group-row:active .drag-icon,
.group-row.row-dragging .drag-icon {
  color: var(--color-primary, #0D9488);
}

.row-dragging {
  opacity: 0.85;
  transform: scale(1.02);
  z-index: 10;
}

.category-card {
  height: 120rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 0 32rpx;
  background-color: var(--color-bg-card, #FFFFFF);
  border-radius: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
}

.category-card:active {
  background-color: var(--color-border-light, #F1F5F9);
}

.card-disabled {
  opacity: 0.6;
}

.card-icon-wrapper {
  width: 88rpx;
  height: 88rpx;
  background: var(--color-primary-light, #E6F7F5);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon {
  width: 48rpx;
  height: 48rpx;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  color: var(--color-primary, #0D9488);
}

.card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
}

.card-title {
  font-size: var(--text-title);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}

.default-badge {
  background: linear-gradient(135deg, var(--color-primary, #0D9488) 0%, var(--color-primary-dark, #0B7A70) 100%);
  padding: 2rpx 12rpx;
  border-radius: 8rpx;
}

.badge-text {
  font-size: var(--text-caption);
  color: var(--color-text-inverse, #FFFFFF);
  font-weight: 500;
}

.disabled-label {
  font-size: var(--text-small);
  color: var(--color-warning, #F59E0B);
}

.swipe-actions {
  display: flex;
  height: 100%;
}

.swipe-btn {
  width: 70rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.swipe-btn-edit {
  background-color: var(--color-primary, #0D9488);
}

.swipe-btn-delete {
  background-color: var(--color-danger, #EF4444);
}

.swipe-btn-toggle {
  background-color: var(--color-warning, #F59E0B);
}

.swipe-btn-text {
  font-size: var(--text-small);
  color: var(--color-text-inverse, #FFFFFF);
  font-weight: 500;
}

.safe-bottom {
  height: calc(env(safe-area-inset-bottom) + 40rpx);
}
</style>