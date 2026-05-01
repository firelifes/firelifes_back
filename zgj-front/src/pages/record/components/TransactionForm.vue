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

// 当前显示的日期
const currentDate = ref(new Date())
// 是否选择了非今天的日期
const hasSelectedDate = ref(false)

// 格式化日期显示
const formattedDate = computed(() => {
  if (!hasSelectedDate.value) {
    return '今天'
  }
  const year = currentDate.value.getFullYear()
  const month = String(currentDate.value.getMonth() + 1).padStart(2, '0')
  const day = String(currentDate.value.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
})

// 监听props.date变化，更新当前日期
watch(() => props.date, (newDate) => {
  if (newDate) {
    const date = new Date(newDate)
    currentDate.value = date
    // 判断是否为今天
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    hasSelectedDate.value = !isToday
  }
}, { immediate: true })

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
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 32rpx 32rpx 0 0;
  padding: 24rpx 20rpx;
  box-shadow: 0 -8rpx 30rpx rgba(0, 0, 0, 0.08);
  z-index: 99;
  padding-bottom: 100rpx;
  backdrop-filter: blur(20rpx);
  border-top: 1rpx solid rgba(255, 255, 255, 0.5);
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.amount-display {
  padding: 32rpx 0;
  text-align: center;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8rpx;
}

.currency {
  font-size: 36rpx;
  font-weight: 600;
  color: #5C6B7A;
}

.amount {
  font-size: 72rpx;
  font-weight: 700;
  color: #2D3436;
  letter-spacing: -1rpx;
  transition: all 0.2s ease;
}

.remark-input {
  padding: 20rpx 24rpx;
  background: rgba(245, 246, 250, 0.8);
  border-radius: 20rpx;
  margin-bottom: 28rpx;
  display: flex;
  align-items: center;
  backdrop-filter: blur(5rpx);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  transition: all 0.3s ease;
}

.remark-input:active {
  transform: scale(0.98);
  background: rgba(245, 246, 250, 1);
}

.remark-label {
  font-size: 28rpx;
  color: #7B8794;
  margin-right: 12rpx;
  font-weight: 500;
}

.remark-placeholder {
  font-size: 28rpx;
  color: #B2BEC3;
  font-weight: 400;
}

.remark-text {
  font-size: 28rpx;
  color: #2D3436;
  flex: 1;
  font-weight: 500;
}

.keyboard {
  background: linear-gradient(180deg, #F8F9FA 0%, #F1F2F6 100%);
  border-radius: 24rpx;
  padding: 20rpx;
  backdrop-filter: blur(10rpx);
}

.keyboard-row {
  display: flex;
  margin-bottom: 16rpx;
}

.keyboard-row:last-child {
  margin-bottom: 0;
}

.key-item {
  flex: 1;
  height: 96rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 8rpx;
  font-size: 40rpx;
  font-weight: 600;
  color: #2D3436;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.8);
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(5rpx);
}

.key-item:active {
  transform: scale(0.95);
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.06);
}

.key-item:first-child {
  margin-left: 0;
}

.key-item:last-child {
  margin-right: 0;
}

.key-item.function {
  background: linear-gradient(135deg, #E8F4F8 0%, #D4E9F0 100%);
  font-size: 28rpx;
  color: #5C6B7A;
}

.key-item.function:active {
  background: linear-gradient(135deg, #D4E9F0 0%, #C0D8E0 100%);
}

.key-item.confirm {
  background: linear-gradient(135deg, #FFD166 0%, #FFC145 100%);
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  box-shadow: 0 6rpx 20rpx rgba(255, 209, 102, 0.4);
}

.key-item.confirm:active {
  transform: scale(0.95);
  box-shadow: 0 4rpx 12rpx rgba(255, 209, 102, 0.3);
}

.date-icon {
  font-size: 24rpx;
  margin-right: 5rpx;
}

.date-text {
  font-size: 22rpx;
  color: #5C6B7A;
  font-weight: 500;
}

.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5rpx);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.popup-content {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24rpx;
  width: 80%;
  max-width: 560rpx;
  padding: 32rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(20rpx);
  border: 1rpx solid rgba(255, 255, 255, 0.5);
  animation: popIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes popIn {
  from {
    transform: scale(0.9) translateY(20rpx);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.popup-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #2D3436;
}

.popup-close {
  font-size: 44rpx;
  color: #9CA3AF;
  line-height: 1;
  transition: all 0.2s ease;
}

.popup-close:active {
  color: #6B7280;
  transform: scale(0.9);
}

.remark-textarea {
  width: 100%;
  border: 2rpx solid rgba(229, 231, 235, 0.8);
  border-radius: 16rpx;
  padding: 18rpx;
  font-size: 28rpx;
  min-height: 220rpx;
  margin-bottom: 24rpx;
  background: rgba(255, 255, 255, 0.8);
  color: #2D3436;
  transition: all 0.3s ease;
}

.remark-textarea:focus {
  border-color: #FFD166;
  background: rgba(255, 255, 255, 1);
}

.popup-footer {
  display: flex;
  justify-content: flex-end;
}

.popup-button {
  padding: 16rpx 48rpx;
  background: linear-gradient(135deg, #FFD166 0%, #FFC145 100%);
  color: #fff;
  border-radius: 20rpx;
  font-size: 28rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(255, 209, 102, 0.3);
  transition: all 0.2s ease;
}

.popup-button:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 8rpx rgba(255, 209, 102, 0.2);
}
</style>