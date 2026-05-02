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
        <!-- 年月选择器 -->
        <view class="date-selector" @tap="showDatePicker">
          <text class="year-text" :key="currentYear">{{ currentYear }}年</text>
          <text class="month-text" :key="currentMonth">{{ currentMonth }}月</text>
        </view>
        <!-- 收入支出金额 -->
        <view class="header-amounts">
          <view class="amount-item">
            <text class="amount-label">收入</text>
            <text class="amount-value income" :key="monthIncome">{{ monthIncome.toFixed(2) }}</text>
          </view>
          <view class="amount-divider"></view>
          <view class="amount-item">
            <text class="amount-label">支出</text>
            <text class="amount-value expense" :key="monthExpense">{{ monthExpense.toFixed(2) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 年月选择弹窗 -->
    <view v-if="showPicker" class="picker-overlay" @tap="hideDatePicker">
      <view class="picker-content" @tap.stop>
        <picker-view
          class="picker-view"
          :value="pickerValue"
          :indicator-style="{ height: '80rpx' }"
          :item-height="80"
          @change="onDateChange"
        >
          <picker-view-column class="picker-column">
            <view v-for="year in yearList" :key="year" class="picker-item">{{ year }}年</view>
          </picker-view-column>
          <picker-view-column class="picker-column">
            <view v-for="m in 12" :key="m" class="picker-item">{{ m.toString().padStart(2, '0') }}月</view>
          </picker-view-column>
        </picker-view>
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

    <!-- 加载状态 -->
    <view v-if="loading && sortedDates.length === 0" class="loading-state">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 账单明细区 -->
    <scroll-view
      class="bill-list"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="isRefreshing"
      @refresherrefresh="handlePullDownRefresh"
      @scrolltolower="handleReachBottom"
    >
      <view :class="['bill-content', transitionDirection]" :key="currentYear + '-' + currentMonth">
        <!-- 空状态 -->
        <view v-if="!loading && sortedDates.length === 0" class="empty-state">
          <text class="empty-text">暂无记账记录</text>
          <text class="empty-hint">点击下方按钮开始记账</text>
        </view>

        <!-- 按日期分组的账单列表 -->
        <view v-for="date in sortedDates" :key="date" class="bill-section">
          <view class="bill-date">
            <text class="date-text">{{ formatDate(date) }}</text>
            <view class="day-totals">
              <text class="day-income">收入: {{ getDayIncome(date) }}</text>
              <text class="day-expense">支出: {{ getDayExpense(date) }}</text>
            </view>
          </view>
          <view class="bill-items">
            <view v-for="record in getDateRecords(date)" :key="record.id" class="bill-item">
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

        <!-- 加载更多 -->
        <view v-if="sortedDates.length > 0" class="load-more">
          <text class="load-more-text">{{ loadMoreText }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
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

interface DatePageData {
  list: RecordItem[]
  total: number
  page: number
  pageSize: number
}

const categories = ref<CategoryGroup[]>([])
const userIconsMap = ref<Map<number, string>>(new Map())
const hasNextMonthData = ref<boolean>(true) // 是否有下一个月的数据
const transitionDirection = ref<'next' | 'prev'>('next') // 切换方向

const currentYear = ref('2026')
const currentMonth = ref('04')
const showPicker = ref(false)
const yearList = ref<number[]>([])
const pickerValue = ref([0, 0])

const monthIncome = ref(0)
const monthExpense = ref(0)

const pageData = reactive<Map<string, DatePageData>>(new Map())
const loading = ref(false)
const isRefreshing = ref(false)
const isLoadingMore = ref(false)
const hasMoreData = ref(true)

const loadMoreText = computed(() => {
  if (isLoadingMore.value) return '加载中...'
  if (!hasMoreData.value) return '没有更多数据了'
  return '上拉加载更多'
})

const initYearList = () => {
  const current = new Date().getFullYear()
  const years: number[] = []
  for (let i = current - 10; i <= current + 10; i++) {
    years.push(i)
  }
  yearList.value = years
}

const showDatePicker = () => {
  initYearList()
  const yearIndex = yearList.value.indexOf(parseInt(currentYear.value))
  const monthIndex = parseInt(currentMonth.value) - 1
  pickerValue.value = [yearIndex >= 0 ? yearIndex : 0, monthIndex >= 0 ? monthIndex : 0]
  showPicker.value = true
}

const hideDatePicker = () => {
  showPicker.value = false
}

const onDateChange = (e: any) => {
  const [yearIndex, monthIndex] = e.detail.value
  currentYear.value = yearList.value[yearIndex].toString()
  currentMonth.value = (monthIndex + 1).toString().padStart(2, '0')
  showPicker.value = false
  loadMonthData()
}

const getCategoryInfo = (typeId: number): { name: string; icon: string } => {
  for (const group of categories.value) {
    for (const cat of group.children) {
      if (cat.id === typeId) {
        const iconUrl = userIconsMap.value.get(cat.iconId) || cat.iconUrl || '📦'
        return { name: cat.name, icon: iconUrl }
      }
    }
  }
  return { name: '其他', icon: '📦' }
}

const sortedDates = computed(() => {
  return Array.from(pageData.keys()).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  )
})

const getDateRecords = (date: string): RecordItem[] => {
  return pageData.get(date)?.list || []
}

const getDayIncome = (dateStr: string) => {
  const dayRecords = getDateRecords(dateStr)
  const income = dayRecords
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + Math.abs(r.amount), 0)
  return income.toFixed(2)
}

const getDayExpense = (dateStr: string) => {
  const dayRecords = getDateRecords(dateStr)
  const expense = dayRecords
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + Math.abs(r.amount), 0)
  return expense.toFixed(2)
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const weekDay = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()]
  return `${month}月${day}日 ${weekDay}`
}

const formatAmount = (amount: number) => {
  return Math.abs(amount).toFixed(2)
}

const loadCategories = async () => {
  try {
    const [expenseRes, incomeRes, iconsRes] = await Promise.all([
      categoryApi.getUserCategories('expense'),
      categoryApi.getUserCategories('income'),
      categoryApi.getUserIcons()
    ])

    if (expenseRes.success && expenseRes.data && incomeRes.success && incomeRes.data) {
      categories.value = [...expenseRes.data, ...incomeRes.data]
    }

    if (iconsRes.success && iconsRes.data) {
      const iconMap = new Map<number, string>()
      iconsRes.data.forEach((icon: any) => {
        iconMap.set(icon.id, icon.url)
      })
      userIconsMap.value = iconMap
    }
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

const loadMonthSummary = async () => {
  try {
    const res = await recordApi.getMonthSummary(`${currentYear.value}-${currentMonth.value}`)
    if (res.success && res.data) {
      monthIncome.value = res.data.income
      monthExpense.value = res.data.expense
    }
  } catch (error) {
    console.error('加载月度汇总失败:', error)
    monthIncome.value = 0
    monthExpense.value = 0
  }
}

const loadFirstPageDates = async () => {
  const pageSize = 50
  const yearMonth = `${currentYear.value}-${currentMonth.value}`
  try {
    const res = await recordApi.getRecordsByMonth(yearMonth, 1, pageSize)
    if (res.success && res.data) {
      const { list, total } = res.data
      const dateGroups = new Map<string, RecordItem[]>()
      list.forEach(record => {
        const dateStr = record.date
        if (!dateGroups.has(dateStr)) {
          dateGroups.set(dateStr, [])
        }
        dateGroups.get(dateStr)!.push(record)
      })

      pageData.clear()
      dateGroups.forEach((records, date) => {
        pageData.set(date, {
          list: records,
          total: total,
          page: 1,
          pageSize: pageSize
        })
      })
      hasMoreData.value = list.length < total
    }
  } catch (error) {
    console.error('加载日期列表失败:', error)
    pageData.clear()
    hasMoreData.value = false
  }
}

const loadMonthData = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadCategories(),
      loadMonthSummary(),
      loadFirstPageDates()
    ])
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

const handlePullDownRefresh = async () => {
  isRefreshing.value = true
  console.log('[detail] 下拉刷新，尝试切换到下一个月')
  
  // 尝试切换到下一个月
  let year = parseInt(currentYear.value)
  let month = parseInt(currentMonth.value)
  
  month++
  if (month > 12) {
    month = 1
    year++
  }
  
  const nextYearMonth = `${year.toString()}-${month.toString().padStart(2, '0')}`
  
  // 先检查下一个月是否有数据
  try {
    const checkRes = await recordApi.getRecordsByMonth(nextYearMonth, 1, 1)
    
    if (checkRes.success && checkRes.data && checkRes.data.list.length > 0) {
      // 有数据，切换到下一个月
      transitionDirection.value = 'next'
      await new Promise(resolve => setTimeout(resolve, 50))
      currentYear.value = year.toString()
      currentMonth.value = month.toString().padStart(2, '0')
      console.log('[detail] 切换到下一个月', currentYear.value, currentMonth.value)
      await loadMonthData()
    } else {
      // 没有数据，提示用户
      console.log('[detail] 下一个月没有数据，刷新当前月份')
      uni.showToast({
        title: '已经是最新月份了',
        icon: 'none'
      })
      await loadMonthData()
    }
  } catch (error) {
    console.error('[detail] 检查下一个月数据失败', error)
    await loadMonthData()
  } finally {
    isRefreshing.value = false
    uni.stopPullDownRefresh()
  }
}

const handleReachBottom = async () => {
  if (isLoadingMore.value) return
  
  // 如果没有更多数据了，切换到上一个月
  if (!hasMoreData.value) {
    console.log('[detail] 没有更多数据了，切换到上一个月')
    let year = parseInt(currentYear.value)
    let month = parseInt(currentMonth.value)
    
    month--
    if (month < 1) {
      month = 12
      year--
    }
    
    const prevYearMonth = `${year.toString()}-${month.toString().padStart(2, '0')}`
    
    // 先检查上一个月是否有数据
    try {
      const checkRes = await recordApi.getRecordsByMonth(prevYearMonth, 1, 1)
      
      if (checkRes.success && checkRes.data && checkRes.data.list.length > 0) {
        // 有数据，切换到上一个月
        transitionDirection.value = 'prev'
        await new Promise(resolve => setTimeout(resolve, 50))
        currentYear.value = year.toString()
        currentMonth.value = month.toString().padStart(2, '0')
        console.log('[detail] 切换到上一个月', currentYear.value, currentMonth.value)
        await loadMonthData()
      } else {
        // 没有数据，提示用户
        console.log('[detail] 上一个月没有数据')
        uni.showToast({
          title: '已经到底了，没有更多数据了',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('[detail] 检查上一个月数据失败', error)
    }
    return
  }

  isLoadingMore.value = true
  const yearMonth = `${currentYear.value}-${currentMonth.value}`
  const pageSize = 50
  const currentPage = pageData.size > 0 ? Array.from(pageData.values())[0].page : 0

  try {
    const nextPage = currentPage + 1
    const res = await recordApi.getRecordsByMonth(yearMonth, nextPage, pageSize)
    if (res.success && res.data) {
      const { list, total } = res.data
      const dateGroups = new Map<string, RecordItem[]>()
      list.forEach(record => {
        const dateStr = record.date
        if (!dateGroups.has(dateStr)) {
          dateGroups.set(dateStr, [])
        }
        dateGroups.get(dateStr)!.push(record)
      })

      dateGroups.forEach((records, date) => {
        if (pageData.has(date)) {
          const existing = pageData.get(date)!
          existing.list = [...existing.list, ...records]
        } else {
          pageData.set(date, {
            list: records,
            total: total,
            page: nextPage,
            pageSize: pageSize
          })
        }
      })
      hasMoreData.value = pageData.size < total
    }
  } catch (error) {
    console.error('加载更多失败:', error)
  } finally {
    isLoadingMore.value = false
  }
}

onMounted(() => {
  const now = new Date()
  currentYear.value = now.getFullYear().toString()
  currentMonth.value = (now.getMonth() + 1).toString().padStart(2, '0')
  loadMonthData()
})

onShow(() => {
  loadMonthData()
})

onPullDownRefresh(() => {
  handlePullDownRefresh()
})

onReachBottom(() => {
  handleReachBottom()
})
</script>

<style>
.page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  overflow: hidden;
  height: 100vh;
  z-index: 1;
}

.header {
  background: linear-gradient(135deg, #FFD166 0%, #FFBB00 100%);
  padding: 40rpx 30rpx 30rpx;
  color: #333;
  flex-shrink: 0;
  width: 100%;
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
}

.date-selector {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5rpx;
}

.year-text {
  font-size: 28rpx;
  color: #333;
  display: inline-block;
  transition: all 0.3s ease-out;
}

.month-text {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  display: inline-block;
  transition: all 0.3s ease-out;
}

.header-amounts {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 20rpx;
  padding: 15rpx 25rpx;
}

.amount-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.amount-label {
  font-size: 22rpx;
  color: #666;
  margin-bottom: 5rpx;
}

.amount-value {
  font-size: 32rpx;
  font-weight: bold;
  display: inline-block;
  transition: all 0.3s ease-out;
}

.amount-value.income {
  color: #19BE6B;
}

.amount-value.expense {
  color: #FA3534;
}

.amount-divider {
  width: 1px;
  height: 60rpx;
  background: rgba(255, 255, 255, 0.5);
  margin: 0 25rpx;
}

.picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.picker-content {
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 30rpx;
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
}

.picker-view {
  width: 100%;
  height: 400rpx;
}

.picker-column {
  flex: 1;
  height: 400rpx;
  text-align: center;
}

.picker-item {
  font-size: 32rpx;
  line-height: 80rpx;
}

.function-bar {
  display: flex;
  justify-content: space-around;
  padding: 30rpx 20rpx;
  background: #fff;
  flex-shrink: 0;
  border-bottom: 1px solid #eee;
  width: 100%;
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

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100rpx 0;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

.bill-list {
  flex: 1;
  height: 0;
  overflow-y: auto;
  margin: 0 20rpx;
}

.bill-content {
  width: 100%;
  animation: slideIn 0.3s ease-out;
}

.bill-content.next {
  animation-name: slideInFromBottom;
}

.bill-content.prev {
  animation-name: slideInFromTop;
}

@keyframes slideInFromBottom {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInFromTop {
  0% {
    opacity: 0;
    transform: translateY(-30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
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

.day-totals {
  display: flex;
  gap: 20rpx;
}

.day-income {
  font-size: 24rpx;
  color: #19BE6B;
}

.day-expense {
  font-size: 24rpx;
  color: #FA3534;
}

.bill-items {
  padding: 10rpx 0;
}

.bill-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  transition: background-color 0.2s;
}

.bill-item:active {
  background-color: #f9f9f9;
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

.load-more {
  padding: 30rpx;
  text-align: center;
}

.load-more-text {
  font-size: 26rpx;
  color: #666;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.empty-text {
  font-size: 32rpx;
  color: #999;
  margin-bottom: 20rpx;
}

.empty-hint {
  font-size: 26rpx;
  color: #ccc;
}
</style>