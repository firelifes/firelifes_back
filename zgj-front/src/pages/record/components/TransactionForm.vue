<template>
  <view class="transaction-form">
    <!-- 金额显示 -->
    <view class="amount-display">
      <text class="currency">¥</text>
      <text class="amount">{{ displayAmount || '0.00' }}</text>
    </view>

    <!-- 备注输入 -->
    <view class="remark-input" @click="showRemarkInput = true">
      <text class="remark-label">备注：</text>
      <text class="remark-placeholder" v-if="!remark">点击填写备注</text>
      <text class="remark-text" v-else>{{ remark }}</text>
    </view>

    <!-- 金额键盘 -->
    <view class="keyboard">
      <view class="keyboard-row">
        <view class="key-item" @click="inputAmount('7')"><text>7</text></view>
        <view class="key-item" @click="inputAmount('8')"><text>8</text></view>
        <view class="key-item" @click="inputAmount('9')"><text>9</text></view>
        <view class="key-item function" @click="toggleDatePicker">
          <text class="date-icon">📅</text>
          <text class="date-text">{{ formattedDate }}</text>
        </view>
      </view>
      <view class="keyboard-row">
        <view class="key-item" @click="inputAmount('4')"><text>4</text></view>
        <view class="key-item" @click="inputAmount('5')"><text>5</text></view>
        <view class="key-item" @click="inputAmount('6')"><text>6</text></view>
        <view class="key-item function" @click="inputAmount('+')"><text>+</text></view>
      </view>
      <view class="keyboard-row">
        <view class="key-item" @click="inputAmount('1')"><text>1</text></view>
        <view class="key-item" @click="inputAmount('2')"><text>2</text></view>
        <view class="key-item" @click="inputAmount('3')"><text>3</text></view>
        <view class="key-item function" @click="inputAmount('-')"><text>-</text></view>
      </view>
      <view class="keyboard-row">
        <view class="key-item" @click="inputAmount('.')"><text>.</text></view>
        <view class="key-item" @click="inputAmount('0')"><text>0</text></view>
        <view class="key-item function" @click="deleteDigit"><text>⌫</text></view>
        <view class="key-item confirm" @click="handleComplete">
          <text>完成</text>
        </view>
      </view>
    </view>

    <!-- 备注输入弹窗 -->
    <view v-if="showRemarkInput" class="popup-overlay" @click="showRemarkInput = false">
      <view class="popup-content" @click.stop>
        <view class="popup-header">
          <text class="popup-title">填写备注</text>
          <text class="popup-close" @click="showRemarkInput = false">×</text>
        </view>
        <textarea
          v-model="remark"
          class="remark-textarea"
          placeholder="请输入备注"
          rows="4"
        ></textarea>
        <view class="popup-footer">
          <view class="popup-button" @click="showRemarkInput = false">确定</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  date: string
  transactionType: 'income' | 'expense'
}>()

const emit = defineEmits<{
  (e: 'update:date', date: string): void
  (e: 'update:amount', amount: string): void
  (e: 'update:remark', remark: string): void
  (e: 'complete'): void
  (e: 'toggleDatePicker'): void
}>()

const displayAmount = ref('')
const remark = ref('')
const showRemarkInput = ref(false)

const formattedDate = computed(() => {
  const date = new Date(props.date)
  return `${date.getMonth() + 1}月${date.getDate()}日`
})

watch(() => props.transactionType, () => {
  // 切换交易类型时重置金额
  displayAmount.value = ''
  emit('update:amount', '')
})

const inputAmount = (digit: string) => {
  if (digit === '.') {
    if (displayAmount.value.includes('.')) return
    if (displayAmount.value === '') {
      displayAmount.value = '0.'
    } else {
      displayAmount.value += '.'
    }
  } else if (digit === '+' || digit === '-') {
    // 处理正负号逻辑
    if (displayAmount.value.startsWith('-')) {
      displayAmount.value = displayAmount.value.substring(1)
    } else {
      displayAmount.value = '-' + displayAmount.value
    }
  } else if (digit === '0' && displayAmount.value === '0') {
    return
  } else {
    // 限制小数位数为2位
    if (displayAmount.value.includes('.')) {
      const parts = displayAmount.value.split('.')
      if (parts[1].length >= 2) return
    }
    displayAmount.value += digit
  }
  emit('update:amount', displayAmount.value)
}

const deleteDigit = () => {
  displayAmount.value = displayAmount.value.substring(0, displayAmount.value.length - 1)
  emit('update:amount', displayAmount.value)
}

const handleComplete = () => {
  // 确保支出金额为负数，收入金额为正数
  let finalAmount = displayAmount.value
  if (props.transactionType === 'expense' && !finalAmount.startsWith('-')) {
    finalAmount = '-' + finalAmount
  } else if (props.transactionType === 'income' && finalAmount.startsWith('-')) {
    finalAmount = finalAmount.substring(1)
  }
  emit('update:amount', finalAmount)
  emit('complete')
}

const toggleDatePicker = () => {
  emit('toggleDatePicker')
}
</script>

<style scoped>
.transaction-form {
  padding: 20rpx;
  background-color: #fff;
}

.amount-display {
  padding: 40rpx 0;
  text-align: center;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 10rpx;
}

.currency {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.amount {
  font-size: 64rpx;
  font-weight: bold;
  color: #333;
}

.remark-input {
  padding: 20rpx;
  background-color: #f5f5f5;
  border-radius: 12rpx;
  margin-bottom: 30rpx;
  display: flex;
  align-items: center;
}

.remark-label {
  font-size: 28rpx;
  color: #666;
  margin-right: 10rpx;
}

.remark-placeholder {
  font-size: 28rpx;
  color: #999;
}

.remark-text {
  font-size: 28rpx;
  color: #333;
  flex: 1;
}

.keyboard {
  background-color: #f5f5f5;
  border-radius: 16rpx;
  padding: 20rpx;
}

.keyboard-row {
  display: flex;
  margin-bottom: 20rpx;
}

.keyboard-row:last-child {
  margin-bottom: 0;
}

.key-item {
  flex: 1;
  height: 80rpx;
  background-color: #fff;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 10rpx;
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
}

.key-item:first-child {
  margin-left: 0;
}

.key-item:last-child {
  margin-right: 0;
}

.key-item.function {
  background-color: #f0f0f0;
  font-size: 28rpx;
}

.key-item.confirm {
  background-color: #FFD166;
  color: #fff;
  font-size: 32rpx;
}

.date-icon {
  font-size: 24rpx;
  margin-right: 5rpx;
}

.date-text {
  font-size: 20rpx;
  color: #666;
}

.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.popup-content {
  background-color: #fff;
  border-radius: 16rpx;
  width: 80%;
  max-width: 500rpx;
  padding: 30rpx;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.popup-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.popup-close {
  font-size: 40rpx;
  color: #999;
}

.remark-textarea {
  width: 100%;
  border: 1rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 15rpx;
  font-size: 28rpx;
  min-height: 200rpx;
  margin-bottom: 20rpx;
}

.popup-footer {
  display: flex;
  justify-content: flex-end;
}

.popup-button {
  padding: 15rpx 40rpx;
  background-color: #FFD166;
  color: #fff;
  border-radius: 8rpx;
  font-size: 28rpx;
}
</style>