<template>
  <view class="my-container">
    <!-- 用户信息卡片 -->
    <view class="user-card" :class="{ 'clickable': !userStore.isLoggedIn() }" @click="handleUserCardClick">
      <view class="user-info">
        <image 
          class="avatar" 
          :src="userStore.isLoggedIn() ? (userStore.user?.avatarUrl || '/static/logo.png') : '/static/logo.png'" 
          mode="aspectFill" 
        />
        <view class="info">
          <text class="nickname">
            {{ userStore.isLoggedIn() ? (userStore.user?.nickname || userStore.user?.username || '未设置昵称') : '点击登录' }}
          </text>
          <text class="phone" v-if="userStore.isLoggedIn()">
            {{ userStore.user?.phone || '' }}
          </text>
        </view>
      </view>
    </view>

    <!-- 菜单列表 -->
    <view class="menu-list">
      <view class="menu-item" @click="navigateToCategoryList">
        <view class="menu-left">
          <view class="category-icon-svg menu-icon category-icon-fenleishezhi"></view>
          <text class="menu-text">分类设置</text>
        </view>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @click="navigateToAccountList">
        <view class="menu-left">
          <view class="category-icon-svg menu-icon category-icon-zhanghushezhi"></view>
          <text class="menu-text">账户设置</text>
        </view>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @click="navigateToBudget">
        <view class="menu-left">
          <view class="category-icon-svg menu-icon category-icon-yusuan"></view>
          <text class="menu-text">预算设置</text>
        </view>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @click="navigateToTheme">
        <view class="menu-left">
          <view class="category-icon-svg menu-icon category-icon-zhutishezhi"></view>
          <text class="menu-text">主题设置</text>
        </view>
        <text class="arrow">›</text>
      </view>
    </view>

    <!-- 退出登录按钮 -->
    <view class="logout-btn" v-if="userStore.isLoggedIn()" @click="handleLogout">
      退出登录
    </view>
    <CustomTabbar />
  </view>
</template>

<script setup lang="ts">
import { useUserStore } from '../../stores/user'
import { logout } from '../../api/auth'
import CustomTabbar from '../../components/CustomTabbar.vue'

const userStore = useUserStore()

// 用户卡片点击事件
const handleUserCardClick = () => {
  if (!userStore.isLoggedIn()) {
    uni.redirectTo({
      url: '/pages/login/login'
    })
  }
}

// 跳转到分类设置
const navigateToCategoryList = () => {
  uni.navigateTo({
    url: '/pages/my/category-setting/category-group-list'
  })
}

// 跳转到账户设置
const navigateToAccountList = () => {
  uni.navigateTo({
    url: '/pages/my/account-setting/account-list'
  })
}

// 跳转到预算设置
const navigateToBudget = () => {
  uni.navigateTo({
    url: '/pages/detail/budget/budget-setting'
  })
}

// 跳转到主题设置
const navigateToTheme = () => {
  uni.navigateTo({
    url: '/pages/my/theme-setting/theme'
  })
}

// 退出登录
const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await logout()
        } catch (err) {
          console.error(err)
        } finally {
          userStore.clearAuth()
          uni.redirectTo({
            url: '/pages/login/login'
          })
        }
      }
    }
  })
}
</script>

<style scoped>
.my-container {
  min-height: 100vh;
  background: var(--color-bg-page, #F0F2F5);
  padding-bottom: 80px;
}

.user-card {
  background: linear-gradient(135deg, var(--color-primary, #00BFFF) 0%, var(--color-primary-dark, #0099CC) 100%);
  padding: calc(80rpx + env(safe-area-inset-top)) 32rpx 80rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 191, 255, 0.25);
}

.user-card.clickable {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.9);
  margin-right: 24rpx;
  background: white;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.info {
  display: flex;
  flex-direction: column;
}

.nickname {
  color: var(--color-text-inverse, white);
  font-size: var(--text-title);
  font-weight: 700;
  margin-bottom: 8rpx;
}

.phone {
  color: rgba(255, 255, 255, 0.85);
  font-size: var(--text-small);
}

.menu-list {
  background: var(--color-bg-card, white);
  margin: 24rpx;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 28rpx;
  height: 96rpx;
  border-bottom: 1rpx solid var(--color-border-light, #F0F2F5);
  transition: all 150ms ease;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background: var(--color-primary-light, rgba(0, 191, 255, 0.05));
  transform: scale(0.99);
}

.menu-left {
  display: flex;
  align-items: center;
}

.menu-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  background-color: var(--color-primary-light, rgba(0, 191, 255, 0.1));
  background-size: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: var(--text-title);
  margin-right: 20rpx;
  color: var(--color-primary, #00BFFF);
}

.menu-text {
  font-size: var(--text-body);
  color: var(--color-text-primary, #333333);
  font-weight: 500;
}

.arrow {
  font-size: var(--text-title);
  color: var(--color-text-tertiary, #CCCCCC);
}

.logout-btn {
  margin: 40rpx 24rpx;
  background: var(--color-bg-card, white);
  color: var(--color-danger, #FA3534);
  text-align: center;
  padding: 32rpx;
  border-radius: 20rpx;
  font-size: var(--text-title);
  font-weight: 500;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
  transition: all 150ms ease;
}

.logout-btn:active {
  transform: scale(0.99);
  background: var(--color-danger-light, #FEF2F2);
}
</style>
