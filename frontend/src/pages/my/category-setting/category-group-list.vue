<template>
  <view class="page-container">
    <view class="settings-header">
      <view class="header-back" @click="goBack">
        <view class="header-back-icon category-icon-svg category-icon-chevron-left"></view>
      </view>
      <text class="header-title">分类设置</text>
      <view class="header-right" @click="openAddPopup">
        <text class="header-add-icon">+</text>
      </view>
    </view>

    <view class="content-scroll">
      <view v-if="loading" class="loading-state">
        <view class="loading-icon category-icon-svg category-icon-loading"></view>
        <text class="loading-text">加载中...</text>
      </view>

      <view v-else-if="!hasGroups" class="empty-state">
        <view class="empty-icon category-icon-svg category-icon-wenjian"></view>
        <text class="empty-text">添加你的第一个分类</text>
      </view>

      <view v-else class="group-list">
        <view
          v-for="(group, index) in groups"
          :key="group.id"
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
              :right-width="280"
            >
              <template #default>
                <view
                  class="group-card"
                  :class="{ 'card-disabled': !group.isEnabled }"
                  @click="goToCategoryList(group)"
                >
                  <view class="card-left">
                    <view v-if="!group.isUserCreated" class="card-badge">
                      <text class="card-badge-text">默认</text>
                    </view>
                    <view v-else class="card-badge-spacer"></view>
                    <view class="card-text-group">
                      <text class="card-name">{{ group.name }}</text>
                      <text
                        v-if="!group.isEnabled"
                        class="card-subtitle card-subtitle-disabled"
                      >已禁用</text>
                      <text
                        v-else-if="childrenCountMap[group.id] !== undefined"
                        class="card-subtitle"
                      >{{ childrenCountMap[group.id] }}个子分类</text>
                    </view>
                  </view>
                  <view class="card-gap"></view>
                  <text class="card-arrow">›</text>
                </view>
              </template>

              <template #right>
                <view class="swipe-actions">
                  <view
                    class="swipe-btn swipe-btn-edit"
                    @click.stop="handleEdit(group)"
                  >
                    <text class="swipe-btn-text">编辑</text>
                  </view>
                  <view
                    v-if="group.isUserCreated"
                    class="swipe-btn swipe-btn-delete"
                    @click.stop="handleDelete(group)"
                  >
                    <text class="swipe-btn-text">删除</text>
                  </view>
                  <view
                    v-else
                    class="swipe-btn swipe-btn-toggle"
                    @click.stop="handleToggle(group)"
                  >
                    <text class="swipe-btn-text">{{ group.isEnabled ? '禁用' : '启用' }}</text>
                  </view>
                </view>
              </template>
            </wd-swipe-action>
          </view>
        </view>
      </view>

      <view class="safe-bottom"></view>
    </view>

    <category-group-edit-popup ref="editPopupRef" @saved="loadGroups" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { categoryApi, type UserCategoryGroup } from '../../../api/category'
import { navigateBack } from '../../../utils/navigate'
import CategoryGroupEditPopup from './category-group-edit.vue'

const loading = ref(false)
const groups = ref<UserCategoryGroup[]>([])
const childrenCountMap = ref<Record<number, number>>({})

const draggingIndex = ref(-1)
const dragStartY = ref(0)
const dragOffsetY = ref(0)
const itemHeightPx = ref(70)
const hasJustDragged = ref(false)

const editPopupRef = ref<InstanceType<typeof CategoryGroupEditPopup> | null>(null)

const hasGroups = computed(() => groups.value.length > 0)

async function loadGroups() {
  loading.value = true
  try {
    const res = await categoryApi.getUserGroups()
    if (res.success) {
      groups.value = res.data
      loadChildrenCounts()
    } else {
      uni.showToast({
        title: res.message || '获取分类列表失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('加载分类列表失败:', error)
    uni.showToast({
      title: '网络错误',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

async function loadChildrenCounts() {
  const counts = await Promise.all(
    groups.value.map(async (group) => {
      try {
        const res = await categoryApi.getCategoriesByGroup(group.id)
        if (res.success) {
          return { id: group.id, count: res.data.length }
        }
      } catch {
        // 单个大类获取子分类失败不影响整体
      }
      return { id: group.id, count: 0 }
    })
  )
  const map: Record<number, number> = {}
  for (const { id, count } of counts) {
    map[id] = count
  }
  childrenCountMap.value = map
}

function goBack() {
  navigateBack('/pages/my/index')
}

function goToCategoryList(group: UserCategoryGroup) {
  if (hasJustDragged.value) {
    hasJustDragged.value = false
    return
  }
  uni.navigateTo({
    url: `/pages/my/category-setting/category-list?groupId=${group.id}&groupName=${encodeURIComponent(group.name)}&groupType=${group.type || 'expense'}`
  })
}

function openAddPopup() {
  editPopupRef.value?.openAdd()
}

function handleEdit(group: UserCategoryGroup) {
  editPopupRef.value?.openEdit(group)
}

async function handleToggle(group: UserCategoryGroup) {
  try {
    const res = await categoryApi.toggleUserGroup(group.id)
    if (res.success) {
      uni.showToast({
        title: res.data.isEnabled ? '已启用' : '已禁用',
        icon: 'success'
      })
      loadGroups()
    } else {
      uni.showToast({ title: res.message || '操作失败', icon: 'none' })
    }
  } catch (error) {
    console.error('操作失败:', error)
    uni.showToast({ title: '网络错误', icon: 'none' })
  }
}

async function handleDelete(group: UserCategoryGroup) {
  uni.showModal({
    title: '提示',
    content: '确定要删除此分类吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const apiRes = await categoryApi.deleteUserGroup(group.id)
          if (apiRes.success) {
            uni.showToast({ title: '删除成功', icon: 'success' })
            loadGroups()
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

onMounted(() => {
  loadGroups()
})

function onDragStart(e: any, index: number) {
  draggingIndex.value = index
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

  hasJustDragged.value = true

  const fromIndex = draggingIndex.value
  const toIndex = Math.max(0, Math.min(groups.value.length - 1, fromIndex + moveSteps))
  if (fromIndex === toIndex) return

  const items = [...groups.value]
  const [removed] = items.splice(fromIndex, 1)
  items.splice(toIndex, 0, removed)
  groups.value = items
  draggingIndex.value = toIndex
  dragStartY.value = touch.clientY
  dragOffsetY.value = 0
}

function onDragEnd() {
  if (draggingIndex.value === -1) return
  const orderedIds = groups.value.map(g => g.id)
  draggingIndex.value = -1
  dragOffsetY.value = 0
  categoryApi.reorderGroups(orderedIds).catch(() => {
    loadGroups()
  })
  setTimeout(() => {
    hasJustDragged.value = false
  }, 0)
}

onShow(() => {
  loadGroups()
})
</script>

<style scoped>
.page-container {
  overflow-x: hidden;
  min-height: 100vh;
  background-color: var(--color-bg-page, #F5F7FA);
}

.nav-add-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: var(--color-primary-light, #E6F7F5);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms ease;
}

.nav-add-btn:active {
  background: var(--color-primary-light, #E6F7F5);
  transform: scale(0.92);
}

.nav-add-icon {
  font-size: var(--text-title);
  color: var(--color-primary, #0D9488);
  font-weight: 300;
}

/* 统一设置页标题栏 */
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

.group-list {
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

.group-card {
  height: 120rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 32rpx;
  background-color: var(--color-bg-card, #FFFFFF);
  border-radius: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
}

.group-card:active {
  background-color: var(--color-border-light, #F1F5F9);
}

.card-disabled {
  opacity: 0.6;
}

.card-left {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
}

.card-badge {
  width: 72rpx;
  height: 36rpx;
  background: linear-gradient(135deg, var(--color-primary, #0D9488) 0%, var(--color-primary-dark, #0B7A70) 100%);
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-badge-spacer {
  width: 72rpx;
  height: 1rpx;
  flex-shrink: 0;
}

.card-badge-text {
  font-size: var(--text-caption);
  color: var(--color-text-inverse, #FFFFFF);
  font-weight: 500;
}

.card-text-group {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.card-name {
  font-size: var(--text-title);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}

.card-subtitle {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
}

.card-subtitle-disabled {
  color: var(--color-warning, #F59E0B);
}

.card-gap {
  flex: 1;
}

.card-arrow {
  font-size: var(--text-number);
  color: var(--color-text-tertiary, #CBD5E1);
  line-height: 1;
}

.swipe-actions {
  display: flex;
  height: 100%;
  border-radius: 20rpx;
}

.swipe-btn {
  width: 140rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.swipe-btn-edit {
  background-color: var(--color-primary, #0D9488);
}

.swipe-btn-delete {
  background-color: var(--color-danger, #EF4444);
  border-radius: 0 20rpx 20rpx 0;
}

.swipe-btn-toggle {
  background-color: var(--color-warning, #F59E0B);
  border-radius: 0 20rpx 20rpx 0;
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
