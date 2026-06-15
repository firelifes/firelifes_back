<!--
  pages/detail/index.vue - 账单明细页面
  功能：展示记账记录，按月份筛选，下拉刷新、上拉加载
  技术：Vue3 + TypeScript + uni-app + Wot Design
-->
<template>
  <view class="page">
    <DetailHeader
      :currentYear="currentYear"
      :currentMonth="currentMonth"
      :monthIncome="monthIncome"
      :monthExpense="monthExpense"
      @open-date-picker="showDatePicker"
    />

    <FunctionBar
      :items="functionItems"
      @item-click="handleFunctionClick"
      @more-click="handleMoreClick"
    />

    <view v-if="loading && sortedDates.length === 0" class="loading-state">
      <text class="loading-text">加载中...</text>
    </view>

    <view class="bill-wrapper">
      <scroll-view
        scroll-y
        class="bill-scroll"
        refresher-enabled
        :refresher-triggered="isRefreshing"
        refresher-threshold="60"
        @refresherrefresh="handleScrollToUpper"
        @scrolltolower="handleReachBottom"
        :lower-threshold="60"
      >
        <view :class="['bill-content', transitionDirection]" :key="currentYear + '-' + currentMonth">
          <view v-if="!loading && sortedDates.length === 0" class="empty-state">
            <text class="empty-text">暂无记账记录</text>
            <text class="empty-hint">点击下方按钮开始记账</text>
          </view>

          <view v-for="date in sortedDates" :key="date" class="bill-section">
            <BillCard
              :formattedDate="formatDate(date)"
              :dayIncome="getDayIncome(date)"
              :dayExpense="getDayExpense(date)"
              :records="getEnrichedRecords(date)"
              @record-tap="handleRecordTap"
              @category-tap="handleCategoryTap"
              @record-delete="handleDeleteRecord"
            />
          </view>

          <view class="load-more">
            <text class="load-more-text">{{ loadMoreText }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <YearMonthPicker ref="yearMonthPickerRef" v-model="selectedYearMonth" />
    <CategorySelectPopup
      ref="categorySelectPopupRef"
      :categories="categorySelectCategories"
      :selectedTypeId="categorySelectTypeId"
      @select="handleCategorySelect"
    />
    <CustomTabbar />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { recordApi, type RecordType } from '../../api/record'

import { categoryApi, type CategoryGroup } from '../../api/category'
import CustomTabbar from '../../components/CustomTabbar.vue'
import YearMonthPicker from '../../components/YearMonthPicker.vue'
import DetailHeader from './components/DetailHeader.vue'
import FunctionBar, { type FunctionItem } from './components/FunctionBar.vue'
import { useFunctionItemsStore } from '../../stores/functionItems'
import BillCard, { type BillCardRecord } from './components/BillCard.vue'
import CategorySelectPopup from './components/CategorySelectPopup.vue'
import { getCategoryIconClass } from '../../utils/category-icon-map'

const deletingId = ref<number | null>(null)

interface RecordItem {
  id: number
  typeId: number | null
  type: RecordType
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
const transitionDirection = ref<'next' | 'prev'>('next')

// 使用当前日期初始化，避免硬编码导致的问题
const today = new Date()
const currentYear = ref(today.getFullYear().toString())
const currentMonth = ref((today.getMonth() + 1).toString().padStart(2, '0'))
const selectedYearMonth = ref(`${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`)
const yearMonthPickerRef = ref<InstanceType<typeof YearMonthPicker> | null>(null)

const showDatePicker = () => {
  yearMonthPickerRef.value?.open()
}

watch(selectedYearMonth, (newVal) => {
  if (!newVal) return
  const parts = newVal.split('-')
  currentYear.value = parts[0]
  currentMonth.value = parts[1]
  loadMonthData()
})

const monthIncome = ref(0)
const monthExpense = ref(0)

const pageData = reactive<Map<string, DatePageData>>(new Map())
const loading = ref(false)
const isRefreshing = ref(false)
const hasMoreData = ref(true)
let loadPrevMonthLock = false

const loadMoreText = computed(() => {
  return '上拉查看上一个月'
})

const functionItemsStore = useFunctionItemsStore()
const functionItems = computed(() => functionItemsStore.topItems)

const handleFunctionClick = (item: FunctionItem) => {
  if (item.key === 'bill') {
    uni.navigateTo({ url: '/pages/detail/bill' })
    return
  }
  if (item.key === 'cashflow') {
    uni.navigateTo({ url: '/pages/detail/cashflow' })
    return
  }
  if (item.key === 'fire') {
    uni.navigateTo({ url: '/pages/detail/fire-progress' })
    return
  }
  console.log('Function clicked:', item.key)
}

const handleMoreClick = () => {
  uni.navigateTo({ url: '/pages/detail/function-list' })
}

const handleRecordTap = (record: BillCardRecord) => {
  uni.navigateTo({
    url: `/pages/record/edit-record?id=${record.id}`,
  })
}

const categorySelectPopupRef = ref<InstanceType<typeof CategorySelectPopup> | null>(null)
const targetRecordId = ref(0)
const targetRecordType = ref<'income' | 'expense'>('expense')
const categorySelectTypeId = ref(0)

const categorySelectCategories = computed(() => {
  return categories.value.filter(g => {
    if (g.children.length === 0) return false
    return g.children[0].type === targetRecordType.value
  })
})

const handleCategoryTap = (record: BillCardRecord) => {
  targetRecordId.value = record.id
  targetRecordType.value = record.type === 'income' ? 'income' : 'expense'
  categorySelectTypeId.value = record.typeId
  categorySelectPopupRef.value?.open()
}

const handleCategorySelect = async (typeId: number) => {
  if (!targetRecordId.value) return
  try {
    const res = await recordApi.updateRecord(targetRecordId.value, { typeId })
    if (res.success) {
      loadFirstPageDates()
      uni.showToast({ title: '分类已修改', icon: 'success', duration: 1500 })
    } else {
      uni.showToast({ title: res.message || '修改失败，请重试', icon: 'none' })
    }
  } catch {
    uni.showToast({ title: '网络错误', icon: 'none' })
  }
  targetRecordId.value = 0
}

const CATEGORY_BG_COLOR = 'var(--color-primary-light)'

const getCategoryInfo = (typeId: number | null): { name: string; icon: string; color: string } => {
  if (typeId === null || typeId === undefined) {
    return { name: '其他', icon: 'icon-qita', color: CATEGORY_BG_COLOR }
  }
  for (const group of categories.value) {
    for (const cat of group.children) {
      if (cat.id === typeId) {
        const icon = getCategoryIconClass(cat.name)
        return { name: cat.name, icon, color: CATEGORY_BG_COLOR }
      }
    }
  }
  return { name: '其他', icon: 'icon-qita', color: CATEGORY_BG_COLOR }
}

const sortedDates = computed(() => {
  return Array.from(pageData.keys()).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
})

const getDateRecords = (date: string): RecordItem[] => {
  return pageData.get(date)?.list || []
}

const getEnrichedRecords = (date: string): BillCardRecord[] => {
  return getDateRecords(date).map((record) => {
    const info = getCategoryInfo(record.typeId)
    // Transfer/repayment records: show type-based display name
    let displayName = record.remark
    if (!displayName) {
      if (record.type === 'transfer') displayName = '转账'
      else if (record.type === 'repayment') displayName = '还款'
      else displayName = info.name
    }
    return {
      id: record.id,
      typeId: record.typeId ?? 0,
      type: record.type,
      amount: record.amount,
      displayName,
      categoryIcon: info.icon,
      categoryColor: info.color,
    }
  })
}

const getDayIncome = (dateStr: string) => {
  const dayRecords = getDateRecords(dateStr)
  const income = dayRecords.filter((r) => r.type === 'income').reduce((sum, r) => sum + Math.abs(r.amount), 0)
  return income.toFixed(2)
}

const getDayExpense = (dateStr: string) => {
  const dayRecords = getDateRecords(dateStr)
  const expense = dayRecords.filter((r) => r.type === 'expense').reduce((sum, r) => sum + Math.abs(r.amount), 0)
  return expense.toFixed(2)
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const weekDay = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()]
  return `${month}月${day}日 ${weekDay}`
}

const categoriesLoaded = ref(false)

const loadCategoriesOnce = async () => {
  if (categoriesLoaded.value) return
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
    categoriesLoaded.value = true
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
  const pageSize = 500
  const yearMonth = `${currentYear.value}-${currentMonth.value}`
  try {
    const res = await recordApi.getRecordsByMonth(yearMonth, 1, pageSize)
    if (res.success && res.data) {
      const { list } = res.data
      const dateGroups = new Map<string, RecordItem[]>()
      list.forEach((record) => {
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
          total: list.length,
          page: 1,
          pageSize: pageSize
        })
      })
      // 不再需要分页加载，每次只加载一个月的数据
      hasMoreData.value = false
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
    await Promise.all([loadCategoriesOnce(), loadMonthSummary(), loadFirstPageDates()])
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

const handleScrollToUpper = async () => {
  isRefreshing.value = true
  try {
    await switchToNextMonth()
  } finally {
    isRefreshing.value = false
  }
}

const switchToNextMonth = async () => {
  let year = parseInt(currentYear.value)
  let month = parseInt(currentMonth.value)
  const currentYearNum = today.getFullYear()
  const currentMonthNum = today.getMonth() + 1

  month++
  if (month > 12) {
    month = 1
    year++
  }

  if (year > currentYearNum || (year === currentYearNum && month > currentMonthNum)) {
    uni.showToast({
      title: '已经是最新月份了',
      icon: 'none'
    })
    return
  }

  const nextYearMonth = `${year.toString()}-${month.toString().padStart(2, '0')}`
  const isCurrentMonth = (year === currentYearNum && month === currentMonthNum)

  try {
    const checkRes = await recordApi.getRecordsByMonth(nextYearMonth, 1, 1)

    if (checkRes.success && checkRes.data && checkRes.data.list.length > 0) {
      transitionDirection.value = 'next'
      await new Promise((resolve) => setTimeout(resolve, 50))
      currentYear.value = year.toString()
      currentMonth.value = month.toString().padStart(2, '0')
      await loadMonthData()
    } else if (isCurrentMonth) {
      transitionDirection.value = 'next'
      await new Promise((resolve) => setTimeout(resolve, 50))
      currentYear.value = year.toString()
      currentMonth.value = month.toString().padStart(2, '0')
      await loadMonthData()
    } else {
      uni.showToast({
        title: '已经是最新月份了',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('[detail] 检查下一个月数据失败', error)
  }
}

const switchToPrevMonth = async () => {
  const currentYM = `${currentYear.value}-${currentMonth.value}`
  try {
    const nearestRes = await recordApi.getNearestMonth(currentYM, 'prev')
    if (nearestRes.success && nearestRes.data) {
      transitionDirection.value = 'prev'
      await new Promise((resolve) => setTimeout(resolve, 50))
      const [y, m] = nearestRes.data.split('-')
      currentYear.value = y
      currentMonth.value = m.padStart(2, '0')
      await loadMonthData()
    } else {
      uni.showToast({
        title: '已经到底了，没有更多数据了',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('[detail] 查找上月数据失败', error)
    uni.showToast({
      title: '已经到底了，没有更多数据了',
      icon: 'none'
    })
  }
}

const handleReachBottom = async () => {
  if (loadPrevMonthLock) return
  
  loadPrevMonthLock = true
  await switchToPrevMonth()
  
  setTimeout(() => {
    loadPrevMonthLock = false
  }, 1000)
}

const handleDeleteRecord = (record: BillCardRecord) => {
  if (deletingId.value) return

  uni.showModal({
    title: '删除记录',
    content: '确定要删除这条记录吗？删除后不可恢复。',
    confirmText: '删除',
    confirmColor: '#FA3534',
    cancelText: '取消',
    success: async (res) => {
      if (!res.confirm) return
      deletingId.value = record.id
      try {
        const apiRes = await recordApi.deleteRecord(record.id)
        if (apiRes.success) {
          for (const [date, data] of pageData) {
            const idx = data.list.findIndex((r) => r.id === record.id)
            if (idx !== -1) {
              data.list.splice(idx, 1)
              if (data.list.length === 0) {
                pageData.delete(date)
              }
              break
            }
          }
          await loadMonthSummary()
          uni.showToast({ title: '已删除', icon: 'success', duration: 1500 })
        } else {
          uni.showToast({ title: apiRes.message || '删除失败，请重试', icon: 'none' })
        }
      } catch (err) {
        console.error('删除记录失败:', err)
        uni.showToast({ title: '删除失败，请重试', icon: 'none' })
      } finally {
        deletingId.value = null
      }
    }
  })
}

onMounted(async () => {
  const currentYM = `${currentYear.value}-${currentMonth.value}`
  try {
    const nearestRes = await recordApi.getNearestMonth(currentYM, 'prev')
    if (nearestRes.success && nearestRes.data && nearestRes.data !== currentYM) {
      const [y, m] = nearestRes.data.split('-')
      currentYear.value = y
      currentMonth.value = m.padStart(2, '0')
      selectedYearMonth.value = nearestRes.data
    } else {
      await loadMonthData()
    }
  } catch {
    await loadMonthData()
  }
})

onShow(() => {
  loadMonthData()
})
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg-page, #F5F7FA);
  overflow-x: hidden;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100rpx 0;
}

.loading-text {
  font-size: var(--text-body);
  color: var(--color-text-secondary, #94A3B8);
}

.bill-wrapper {
  flex: 1;
  margin: 0 20rpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: 60px;
}

.bill-scroll {
  flex: 1;
  height: 100%;
}

.bill-content {
  width: 100%;
  padding: 20rpx 0;
  animation: monthSlideIn 0.4s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.bill-content.next {
  animation-name: slideUpFromBottom;
}

.bill-content.prev {
  animation-name: slideDownFromTop;
}

@keyframes slideUpFromBottom {
  0% {
    opacity: 0;
    transform: translateY(80rpx) scale(0.96);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes slideDownFromTop {
  0% {
    opacity: 0;
    transform: translateY(-80rpx) scale(0.96);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.bill-section {
  margin-bottom: 24rpx;
}

.load-more {
  padding: 30rpx;
  text-align: center;
}

.load-more-text {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: 100rpx 0;
}

.empty-text {
  font-size: var(--text-title);
  color: var(--color-text-secondary, #94A3B8);
  margin-bottom: 20rpx;
}

.empty-hint {
  font-size: var(--text-small);
  color: var(--color-text-tertiary, #CBD5E1);
}
</style>
