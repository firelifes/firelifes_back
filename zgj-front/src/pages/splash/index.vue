<template>
  <view class="splash-container">
    <image class="splash-image" :src="adImageUrl" mode="aspectFill" @click="handleAdClick" />
    <view class="skip-btn" @click="skip">
      <text>{{ countdown }}s 跳过</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()
const countdown = ref(3)
const adImageUrl = ref('https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=1600&fit=crop')

const navigate = () => {
  if (userStore.isLoggedIn()) {
    uni.switchTab({
      url: '/pages/detail/index'
    })
  } else {
    uni.redirectTo({
      url: '/pages/login/index'
    })
  }
}

const skip = () => {
  navigate()
}

const handleAdClick = () => {
}

onMounted(() => {
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      navigate()
    }
  }, 1000)
})
</script>

<style scoped>
.splash-container {
  width: 100vw;
  height: 100vh;
  position: relative;
}

.splash-image {
  width: 100%;
  height: 100%;
}

.skip-btn {
  position: absolute;
  top: 60rpx;
  right: 40rpx;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 16rpx 32rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
}
</style>
