<template>
  <view class="custom-tabbar">
    <view 
      v-for="(item, index) in tabList" 
      :key="index"
      class="tab-item"
      @click="switchTab(item.pagePath)"
    >
      <view class="tab-icon">
        <view class="category-icon-svg" :class="[item.iconClass, { 'active': selectedTab === item.pagePath }]">
        </view>
      </view>
      <text class="tab-text" :class="{ 'active': selectedTab === item.pagePath }">
        {{ item.text }}
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getSystemIconClass } from '../utils/category-icon-map'

const selectedTab = ref('pages/detail/index')

const tabList = [
  {
    pagePath: 'pages/detail/index',
    iconClass: getSystemIconClass('账单'),
    text: '明细'
  },
  {
    pagePath: 'pages/statistics/index',
    iconClass: getSystemIconClass('统计'),
    text: '统计'
  },
  {
    pagePath: 'pages/record/index',
    iconClass: getSystemIconClass('记账'),
    text: '记账'
  },
  {
    pagePath: 'pages/analysis/analysis',
    iconClass: getSystemIconClass('资产'),
    text: '资产'
  },
  {
    pagePath: 'pages/my/index',
    iconClass: getSystemIconClass('我的'),
    text: '我的'
  }
]

const switchTab = (pagePath: string) => {
  selectedTab.value = pagePath
  uni.reLaunch({ 
    url: '/' + pagePath,
    success: () => {
      console.log('Tab切换成功:', pagePath)
    },
    fail: (err) => {
      console.error('Tab切换失败:', err)
    }
  })
}

const updateTab = () => {
  const pages = getCurrentPages()
  if (pages.length > 0) {
    const currentPage = pages[pages.length - 1]
    selectedTab.value = currentPage.route || ''
  }
}

onMounted(() => {
  updateTab()
})

onUnmounted(() => {
})
</script>

<style scoped>
.custom-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: var(--color-bg-card, #FFFFFF);
  border-top: 1px solid var(--color-border, #E2E8F0);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 999;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.tab-icon {
  width: 28px;
  height: 28px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-icon .category-icon-svg {
  width: 24px;
  height: 24px;
  color: var(--color-text-secondary, #94A3B8);
  opacity: 0.7;
}

.tab-icon .category-icon-svg.active {
  opacity: 1;
  color: var(--color-primary, #0D9488);
}

.tab-text {
  font-size: 12px;
  color: var(--color-text-secondary, #94A3B8);
}

.tab-text.active {
  color: var(--color-primary, #0D9488);
}
</style>