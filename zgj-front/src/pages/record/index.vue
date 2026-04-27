<template>
  <view class="record-page">
    <!-- 标题区 - 固定在顶部 -->
    <view class="header">
      <view class="header-bottom">
        <view class="header-left">
          <text
            class="type-btn"
            :class="{ active: transactionType === 'expense' }"
            @click="switchType('expense')"
          >支出</text>
          <text class="type-divider">|</text>
          <text
            class="type-btn"
            :class="{ active: transactionType === 'income' }"
            @click="switchType('income')"
          >收入</text>
        </view>
        <text class="cancel-btn" @click="handleCancel">取消</text>
      </view>
    </view>

    <!-- 可滚动内容区域 -->
    <view class="content">
      <!-- 分类选择区 -->
      <CategorySelector
        :transactionType="transactionType"
        :selectedCategory="selectedCategory"
        @select="selectCategory"
      />

      <!-- 记账输入区 - 只有选择分类后才显示 -->
      <TransactionForm
        v-if="selectedCategory"
        :date="selectedDate"
        :transactionType="transactionType"
        @update:date="selectedDate = $event"
        @update:amount="displayAmount = $event"
        @update:remark="remark = $event"
        @complete="handleComplete"
        @toggleDatePicker="showDatePicker = true"
      />
    </view>

    <!-- 日期选择器 -->
    <DatePicker
      :visible="showDatePicker"
      :date="selectedDate"
      @update:date="selectedDate = $event"
      @close="showDatePicker = false"
    />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CategorySelector from './components/CategorySelector.vue'
import TransactionForm from './components/TransactionForm.vue'
import DatePicker from './components/DatePicker.vue'

const transactionType = ref('expense')
const selectedCategory = ref('')
const displayAmount = ref('')
const remark = ref('')
const selectedDate = ref(new Date().toISOString().split('T')[0])
const showDatePicker = ref(false)

const switchType = (type: 'income' | 'expense') => {
  transactionType.value = type
  selectedCategory.value = ''
}

const selectCategory = (category: { name: string; icon: string }) => {
  selectedCategory.value = category.name
}

const handleCancel = () => {
  uni.navigateBack()
}

const handleComplete = () => {
  if (!displayAmount.value) {
    uni.showToast({ title: '请输入金额', icon: 'none' })
    return
  }
  if (!selectedCategory.value) {
    uni.showToast({ title: '请选择分类', icon: 'none' })
    return
  }
  
  // 这里可以添加提交数据的逻辑
  console.log('提交记账数据:', {
    type: transactionType.value,
    category: selectedCategory.value,
    amount: displayAmount.value,
    remark: remark.value,
    date: selectedDate.value
  })
  
  uni.showToast({ title: '记账成功', icon: 'success' })
  setTimeout(() => {
    uni.navigateBack()
  }, 1000)
}
</script>

<style>
.record-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-top: 120rpx;
}

.header {
  background-color: #FFD166;
  padding: 20rpx 30rpx;
  color: #333;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.header-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
}

.content {
  overflow-y: auto;
  padding-bottom: 20rpx;
}

.type-btn {
  font-size: 32rpx;
  font-weight: bold;
  color: rgba(51, 51, 51, 0.7);
  padding: 10rpx 20rpx;
  transition: all 0.3s;
}

.type-btn.active {
  color: #333;
  position: relative;
}

.type-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20rpx;
  right: 20rpx;
  height: 4rpx;
  background-color: #333;
  border-radius: 2rpx;
}

.type-divider {
  font-size: 32rpx;
  color: rgba(51, 51, 51, 0.5);
}

.cancel-btn {
  font-size: 28rpx;
  color: #333;
  padding: 10rpx 20rpx;
  border-radius: 8rpx;
  background-color: rgba(255, 255, 255, 0.2);
}
</style>