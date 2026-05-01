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
          <text class="year">{{ currentYear }}年</text>
          <view class="month-arrow-container" @tap="handleMonthChange('next')">
            <text class="month">{{ currentMonth }}月</text>
            <text class="arrow">▼</text>
          </view>
        </view>
        <!-- 收入支出金额 -->
        <view class="header-amounts">
          <view class="amount-item">
            <text class="amount-label">收入</text>
            <text class="amount-value income">{{ monthIncome.toFixed(2) }}</text>
          </view>
          <view class="amount-divider"></view>
          <view class="amount-item">
            <text class="amount-label">支出</text>
            <text class="amount-value expense">{{ monthExpense.toFixed(2) }}</text>
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
      <!-- 空状态 -->
      <view v-if="sortedDates.length === 0" class="empty-state">
        <text class="empty-text">暂无记账记录</text>
        <text class="empty-hint">点击下方按钮开始记账</text>
      </view>

      <!-- 按日期分组的账单列表 -->
      <view v-for="date in sortedDates" :key="date" class="bill-section">
        <view class="bill-date">
          <text class="date-text">{{ formatDate(date) }}</text>
          <text class="day-total">支出: {{ getDayTotal(date) }}</text>
        </view>
        <view class="bill-items">
          <view v-for="record in groupedRecords[date]" :key="record.id" class="bill-item">
            <view class="item-left">
              <view class="item-icon">{{ getCategoryInfo(record.typeId).icon }}</view>
              <text class="item-category">{{ getCategoryInfo(record.typeId).name }}</text>
            </view>
            <text :class="['item-amount', record.type]">
              {{ record.type === 'expense' ? '-' : '+' }}{{ formatAmount(record.amount) }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部添加按钮 -->
    <view class="add-button-container">
      <view class="add-button" @tap="handleAddTransaction">
        <text class="add-button-text">+ 记账</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { recordApi } from '../../api/record'
import { categoryApi, type CategoryGroup } from '../../api/category'

interface RecordItem {
  id: number
  typeId: number
  type: 'income' | 'expense'
  amount: number
  remark?: string
  date: string
  createdAt?: string
}

const records = ref<RecordItem[]>([])
const categories = ref<CategoryGroup[]>([])
const loading = ref(false)

const currentYear = ref('2026')
const currentMonth = ref('04')

const getCategoryInfo = (typeId: number): { name: string; icon: string } => {
  for (const group of categories.value) {
    for (const cat of group.children) {
      if (cat.id === typeId) {
        return { name: cat.name, icon: cat.iconUrl }
      }
    }
  }
  return { name: '其他', icon: '📦' }
}

const filteredRecords = computed(() => {
  return records.value.filter(record => {
    const recordDate = new Date(record.date)
    const month = (recordDate.getMonth() + 1).toString().padStart(2, '0')
    return month === currentMonth.value
  })
})

const groupedRecords = computed(() => {
  const groups: { [key: string]: RecordItem[] } = {}
  filteredRecords.value.forEach(record => {
    const dateStr = record.date
    if (!groups[dateStr]) {
      groups[dateStr] = []
    }
    groups[dateStr].push(record)
  })
  return groups
})

const sortedDates = computed(() => {
  return Object.keys(groupedRecords.value).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  )
})

const monthIncome = computed(() => {
  return filteredRecords.value
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0)
})

const monthExpense = computed(() => {
  return filteredRecords.value
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + Math.abs(r.amount), 0)
})

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const weekDay = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()]
  return `${month}月${day}日 ${weekDay}`
}

const getDayTotal = (dateStr: string) => {
  const dayRecords = groupedRecords.value[dateStr] || []
  const expense = dayRecords
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + Math.abs(r.amount), 0)
  return expense.toFixed(2)
}

const formatAmount = (amount: number) => {
  return Math.abs(amount).toFixed(2)
}

const handleMonthChange = (direction: 'prev' | 'next') => {
  let month = parseInt(currentMonth.value)
  if (direction === 'prev') {
    month = month === 1 ? 12 : month - 1
  } else {
    month = month === 12 ? 1 : month + 1
  }
  currentMonth.value = month.toString().padStart(2, '0')
  if (month === 1) {
    currentYear.value = (parseInt(currentYear.value) - 1).toString()
  } else if (month === 12 && currentMonth.value === '01') {
    currentYear.value = (parseInt(currentYear.value) + 1).toString()
  }
}

const handleAddTransaction = () => {
  uni.switchTab({ url: '/pages/record/index' })
}

const loadData = async () => {
  loading.value = true
  try {
    const [recordsRes, categoriesRes] = await Promise.all([
      recordApi.getAllRecords(),
      categoryApi.getAllCategories()
    ])
    
    if (recordsRes.success && recordsRes.data) {
      records.value = recordsRes.data
    }
    if (categoriesRes.success && categoriesRes.data) {
      categories.value = [...categoriesRes.data.expense, ...categoriesRes.data.income]
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const now = new Date()
  currentYear.value = now.getFullYear().toString()
  currentMonth.value = (now.getMonth() + 1).toString().padStart(2, '0')
  loadData()
})
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
</style>