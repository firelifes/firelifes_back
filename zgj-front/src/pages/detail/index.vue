<!--
  pages/detail/index.vue - Detail Page
  Function: Display transaction details with layout matching the provided screenshot
  Tech: Vue3 + TypeScript
-->
<template>
  <view class="page">
    <!-- 顶部标题区 -->
    <view class="header">
      <view class="header-top">
        <text class="app-title">鲨鱼记账</text>
      </view>
      <view class="header-content">
        <!-- 月份选择器 -->
        <view class="month-selector">
          <text class="year">2026年</text>
          <view class="month-arrow-container">
            <text class="month">04月</text>
            <text class="arrow">▼</text>
          </view>
        </view>
        <!-- 收入支出金额 -->
        <view class="header-amounts">
          <view class="amount-item">
            <text class="amount-label">收入</text>
            <text class="amount-value income">42996.25</text>
          </view>
          <view class="amount-divider"></view>
          <view class="amount-item">
            <text class="amount-label">支出</text>
            <text class="amount-value expense">23749.01</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 功能入口区 -->
    <view class="function-bar">
      <view class="function-item">
        <view class="function-icon">📄</view>
        <text class="function-text">账单</text>
      </view>
      <view class="function-item">
        <view class="function-icon">📊</view>
        <text class="function-text">预算</text>
      </view>
      <view class="function-item">
        <view class="function-icon">🛡️</view>
        <text class="function-text">资产管家</text>
      </view>
      <view class="function-item">
        <view class="function-icon">🛍️</view>
        <text class="function-text">购物返现</text>
      </view>
      <view class="function-item">
        <view class="function-icon">⋯</view>
        <text class="function-text">更多</text>
      </view>
    </view>

    <!-- 账单明细区 -->
    <view class="bill-list">
      <!-- 04月25日 -->
      <view class="bill-section">
        <view class="bill-date">
          <text class="date-text">04月25日 星期六</text>
          <text class="day-total">支出: 376.55</text>
        </view>
        <view class="bill-items">
          <view class="bill-item">
            <view class="item-left">
              <view class="item-icon">🎮</view>
              <text class="item-category">娱乐</text>
            </view>
            <text class="item-amount expense">-30</text>
          </view>
          <view class="bill-item">
            <view class="item-left">
              <view class="item-icon">🚌</view>
              <text class="item-category">交通</text>
            </view>
            <text class="item-amount expense">-20</text>
          </view>
          <view class="bill-item">
            <view class="item-left">
              <view class="item-icon">🍜</view>
              <text class="item-category">餐饮</text>
            </view>
            <text class="item-amount expense">-11</text>
          </view>
          <view class="bill-item">
            <view class="item-left">
              <view class="item-icon">🎮</view>
              <text class="item-category">娱乐</text>
            </view>
            <text class="item-amount expense">-150</text>
          </view>
          <view class="bill-item">
            <view class="item-left">
              <view class="item-icon">🚌</view>
              <text class="item-category">交通</text>
            </view>
            <text class="item-amount expense">-40.89</text>
          </view>
          <view class="bill-item">
            <view class="item-left">
              <view class="item-icon">🚌</view>
              <text class="item-category">交通</text>
            </view>
            <text class="item-amount expense">-45.6</text>
          </view>
          <view class="bill-item">
            <view class="item-left">
              <view class="item-icon">🛍️</view>
              <text class="item-category">购物</text>
            </view>
            <text class="item-amount expense">-62.7</text>
          </view>
          <view class="bill-item">
            <view class="item-left">
              <view class="item-icon">🚌</view>
              <text class="item-category">交通</text>
            </view>
            <text class="item-amount expense">-8.18</text>
          </view>
          <view class="bill-item">
            <view class="item-left">
              <view class="item-icon">🚌</view>
              <text class="item-category">交通</text>
            </view>
            <text class="item-amount expense">-8.18</text>
          </view>
        </view>
      </view>

      <!-- 04月24日 -->
      <view class="bill-section">
        <view class="bill-date">
          <text class="date-text">04月24日 星期五</text>
          <text class="day-total">支出: 7648.36</text>
        </view>
        <view class="bill-items">
          <view class="bill-item">
            <view class="item-left">
              <view class="item-icon">🏠</view>
              <text class="item-category">居住</text>
            </view>
            <text class="item-amount expense">-7500</text>
          </view>
          <view class="bill-item">
            <view class="item-left">
              <view class="item-icon">🍜</view>
              <text class="item-category">餐饮</text>
            </view>
            <text class="item-amount expense">-148.36</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部导航栏 -->
    <view class="tab-bar">
      <view class="tab-item active">
        <view class="tab-icon">📋</view>
        <text class="tab-text">明细</text>
      </view>
      <view class="tab-item">
        <view class="tab-icon">📈</view>
        <text class="tab-text">图表</text>
      </view>
      <view class="tab-item add-button">
        <view class="add-icon">+</view>
      </view>
      <view class="tab-item">
        <view class="tab-icon">🌍</view>
        <text class="tab-text">发现</text>
      </view>
      <view class="tab-item">
        <view class="tab-icon">👤</view>
        <text class="tab-text">我的</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const currentMonth = ref('04')
const currentYear = ref('2026')

const handleMonthChange = () => {
  // 月份选择逻辑
}

const handleAddTransaction = () => {
  uni.switchTab({ url: '/pages/record/index' })
}

const navigateTo = (page: string) => {
  uni.switchTab({ url: `/pages/${page}/index` })
}
</script>

<style>
.page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #FFD166 0%, #FFBB00 100%);
  padding: 40rpx 30rpx 30rpx;
  color: #333;
}

.header-top {
  margin-bottom: 20rpx;
}

.app-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
}

.header-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.month-selector {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5rpx;
}

.month-arrow-container {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.year {
  font-size: 28rpx;
  color: #333;
}

.month {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
}

.arrow {
  font-size: 24rpx;
  color: #333;
}

.header-amounts {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 20rpx;
  border-radius: 16rpx;
  min-width: 0;
}

.amount-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.amount-label {
  font-size: 24rpx;
  color: #333;
  margin-bottom: 10rpx;
}

.amount-value {
  font-size: 36rpx;
  font-weight: bold;
}

.amount-value.income {
  color: #19BE6B;
}

.amount-value.expense {
  color: #FA3534;
}

.amount-divider {
  width: 1px;
  height: 50rpx;
  background-color: rgba(0, 0, 0, 0.1);
  margin: 0 20rpx;
}

.function-bar {
  display: flex;
  background-color: #fff;
  padding: 30rpx 20rpx;
  margin: 20rpx;
  border-radius: 16rpx;
  justify-content: space-around;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.function-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.function-icon {
  font-size: 48rpx;
  margin-bottom: 10rpx;
}

.function-text {
  font-size: 22rpx;
  color: #666;
}

.bill-list {
  margin: 0 20rpx 120rpx;
}

.bill-section {
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.bill-date {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1px solid #f0f0f0;
}

.date-text {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.day-total {
  font-size: 24rpx;
  color: #666;
}

.bill-items {
  padding: 10rpx 0;
}

.bill-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1px solid #f5f5f5;
}

.bill-item:last-child {
  border-bottom: none;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.item-icon {
  font-size: 40rpx;
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 12rpx;
}

.item-category {
  font-size: 28rpx;
  color: #333;
}

.item-amount {
  font-size: 32rpx;
  font-weight: 500;
}

.item-amount.expense {
  color: #FA3534;
}

.item-amount.income {
  color: #19BE6B;
}

.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: #fff;
  padding: 20rpx 0;
  border-top: 1px solid #e0e0e0;
  z-index: 100;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10rpx;
}

.tab-item.active .tab-text {
  color: #FFBB00;
  font-weight: bold;
}

.tab-icon {
  font-size: 36rpx;
  margin-bottom: 5rpx;
}

.tab-text {
  font-size: 20rpx;
  color: #666;
}

.add-button {
  position: relative;
  top: -30rpx;
}

.add-icon {
  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #FFD166 0%, #FFBB00 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  color: #fff;
  font-weight: bold;
  box-shadow: 0 4rpx 12rpx rgba(255, 187, 0, 0.3);
}
</style>