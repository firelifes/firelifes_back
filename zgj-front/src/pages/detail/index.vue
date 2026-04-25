<!--
  pages/detail/index.vue - Detail Page
  Function: Display transaction details
  Tech: Vue3 + TypeScript
-->
<template>
  <view class="container">
    <text class="title">{{ t('detail.title') }}</text>
    <text class="subtitle">{{ t('detail.subtitle') }}</text>
  </view>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.title {
  font-size: 36rpx;
  color: #333;
  margin-bottom: 20rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #666;
}
</style>