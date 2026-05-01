<template>
  <view class="custom-tabbar">
    <view 
      v-for="(item, index) in tabList" 
      :key="index"
      class="tab-item"
      :class="{ 'tab-center': index === 2 }"
      @click="switchTab(item.pagePath)"
    >
      <view v-if="index === 2" class="tab-center-icon">
        <view class="plus-icon">+</view>
      </view>
      <view v-else class="tab-icon">
        <image :src="selectedTab === item.pagePath ? item.selectedIconPath : item.iconPath" mode="aspectFit" />
      </view>
      <text v-if="index !== 2" class="tab-text" :class="{ 'active': selectedTab === item.pagePath }">
        {{ item.text }}
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const selectedTab = ref('/pages/detail/index')

const tabList = [
  {
    pagePath: '/pages/detail/index',
    iconPath: 'static/logo.png',
    selectedIconPath: 'static/logo.png',
    text: '明细'
  },
  {
    pagePath: '/pages/statistics/index',
    iconPath: 'static/logo.png',
    selectedIconPath: 'static/logo.png',
    text: '图表'
  },
  {
    pagePath: '/pages/record/index',
    iconPath: 'static/logo.png',
    selectedIconPath: 'static/logo.png',
    text: ''
  },
  {
    pagePath: '/pages/analysis/index',
    iconPath: 'static/logo.png',
    selectedIconPath: 'static/logo.png',
    text: '发现'
  },
  {
    pagePath: '/pages/my/index',
    iconPath: 'static/logo.png',
    selectedIconPath: 'static/logo.png',
    text: '我的'
  }
]

const switchTab = (pagePath: string) => {
  selectedTab.value = pagePath
  uni.switchTab({ url: pagePath })
}

const updateTab = () => {
  const pages = getCurrentPages()
  if (pages.length > 0) {
    const currentPage = pages[pages.length - 1]
    selectedTab.value = '/' + currentPage.route
  }
}

onMounted(() => {
  updateTab()
  ;(uni as any).onTabItemTap(updateTab)
})

onUnmounted(() => {
  ;(uni as any).offTabItemTap(updateTab)
})
</script>

<style scoped>
.custom-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background-color: #ffffff;
  border-top: 1px solid #e0e0e0;
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
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
}

.tab-icon image {
  width: 100%;
  height: 100%;
}

.tab-text {
  font-size: 12px;
  color: #7A7E83;
}

.tab-text.active {
  color: #3cc51f;
}

.tab-center {
  position: relative;
}

.tab-center-icon {
  position: absolute;
  top: -20px;
  width: 56px;
  height: 56px;
  background-color: #FFD166;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.plus-icon {
  font-size: 32px;
  font-weight: bold;
  color: #ffffff;
  line-height: 56px;
}
</style>