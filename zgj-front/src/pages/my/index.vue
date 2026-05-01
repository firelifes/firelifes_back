<template>
  <view class="my-container">
    <view class="user-card" v-if="userStore.isLoggedIn()">
      <view class="user-info">
        <image class="avatar" :src="userStore.user?.avatarUrl || '/static/logo.png'" mode="aspectFill" />
        <view class="info">
          <text class="nickname">{{ userStore.user?.nickname || userStore.user?.username }}</text>
          <text class="phone">{{ userStore.user?.phone }}</text>
        </view>
      </view>
    </view>

    <view class="menu-list">
      <view class="menu-item">
        <text class="menu-text">我的账单</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item">
        <text class="menu-text">数据统计</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item">
        <text class="menu-text">设置</text>
        <text class="arrow">›</text>
      </view>
    </view>

    <view class="logout-btn" v-if="userStore.isLoggedIn()" @click="handleLogout">
      退出登录
    </view>
  </view>
</template>

<script setup lang="ts">
import { useUserStore } from '../../stores/user'
import { logout } from '../../api/auth'

const userStore = useUserStore()

const handleLogout = async () => {
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
            url: '/pages/login/index'
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
  background: #f5f5f5;
}

.user-card {
  background: linear-gradient(135deg, #3cc51f 0%, #2aa318 100%);
  padding: 80rpx 40rpx 60rpx;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  border: 4rpx solid white;
  margin-right: 32rpx;
}

.info {
  display: flex;
  flex-direction: column;
}

.nickname {
  color: white;
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 12rpx;
}

.phone {
  color: rgba(255, 255, 255, 0.8);
  font-size: 26rpx;
}

.menu-list {
  background: white;
  margin: 24rpx;
  border-radius: 16rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx 24rpx;
  border-bottom: 1px solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-text {
  font-size: 30rpx;
  color: #333;
}

.arrow {
  font-size: 40rpx;
  color: #ccc;
}

.logout-btn {
  margin: 60rpx 24rpx;
  background: white;
  color: #ff4d4f;
  text-align: center;
  padding: 32rpx;
  border-radius: 16rpx;
  font-size: 32rpx;
}
</style>
