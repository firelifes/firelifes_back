<!--
  pages/detail/detail-list.vue - 账单明细页面
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
      @open-statistics="handleOpenStatistics"
      @open-search="enterSearchMode"
    />

    <!-- 搜索栏（搜索模式下替换 FunctionBar） -->
    <view v-if="isSearchMode" class="search-bar">
      <view class="search-bar-inner">
        <view class="search-back" @tap="exitSearchMode">
          <text class="search-back-arrow">‹</text>
        </view>
        <view class="search-input-wrapper">
          <view class="category-icon-svg category-icon-sousuo search-input-icon"></view>
          <input
            class="search-input"
            v-model="searchKeyword"
            placeholder="搜索备注、金额或分类..."
            placeholder-style="color: #94A3B8; font-size: 28rpx;"
            confirm-type="search"
            @input="onSearchInput"
            @confirm="performSearch"
            :focus="true"
          />
          <view v-if="searchKeyword" class="search-clear" @tap="clearSearch">
            <text class="search-clear-text">✕</text>
          </view>
        </view>
      </view>
    </view>

    <FunctionBar
      v-else
      :items="functionItems"
      @item-click="handleFunctionClick"
      @more-click="handleMoreClick"
    />

    <ErrorState
      v-if="errorState.show"
      :type="(errorState.type as any)"
      show-retry
      retry-text="重新加载"
      @retry="onErrorRetry"
    />

    <LoadingState v-else-if="loading && sortedDates.length === 0" text="明细加载中..." />

    <view v-if="isSearchMode" class="search-results-wrapper">
      <!-- 搜索加载中 -->
      <LoadingState v-if="searchLoading" text="搜索中..." size="small" />
      <!-- 搜索空状态（未输入） -->
      <view v-else-if="!searchKeyword.trim()" class="empty-state">
        <view class="category-icon-svg category-icon-sousuo empty-icon"></view>
        <text class="empty-text">输入关键词开始搜索</text>
      </view>
      <!-- 搜索无结果 -->
      <view v-else-if="searchResults.length === 0" class="empty-state">
        <view class="category-icon-svg category-icon-jizhang empty-icon"></view>
        <text class="empty-text">未找到匹配的记录</text>
      </view>
      <!-- 搜索结果列表 -->
      <scroll-view v-else scroll-y class="search-results-scroll">
        <view class="search-results-list">
          <view v-for="group in searchDateGroups" :key="group.date" class="search-date-group">
            <view class="search-date-header">
              <text class="search-date-text">{{ formatDate(group.date) }}</text>
            </view>
            <view v-for="record in group.records" :key="record.id" class="search-result-row" @tap="handleSearchResultTap(record)">
              <view class="search-result-left">
                <view class="search-result-icon" :style="{ backgroundColor: getRecordColor(record) }">
                  <view class="category-icon-svg" :class="getRecordIcon(record)"></view>
                </view>
                <view class="search-result-info">
                  <view class="search-result-title-row">
                    <text class="search-result-category">{{ getRecordCategoryName(record) }}</text>
                    <text class="search-result-remark" v-if="record.remark">{{ record.remark }}</text>
                  </view>
                  <text class="search-result-meta">{{ record.accountName || '' }} · {{ record.date }}</text>
                </view>
              </view>
              <text class="search-result-amount" :class="{ income: record.type === 'income', expense: record.type === 'expense' }">
                {{ formatSearchAmount(record) }}
              </text>
            </view>
          </view>
        </view>
        <view class="search-result-count">
          <text class="search-count-text">共找到 {{ searchTotal }} 条记录</text>
        </view>
      </scroll-view>
    </view>

    <view v-else class="bill-wrapper">
      <scroll-view
        ref="billScrollRef"
        scroll-y
        class="bill-scroll"
        :scroll-top="restoreScrollTop"
        :scroll-into-view="scrollIntoViewId"
        refresher-enabled
        :refresher-triggered="isRefreshing"
        refresher-threshold="80"
        @refresherrefresh="handleScrollToUpper"
        @scrolltolower="handleReachBottom"
        :lower-threshold="60"
        @scroll="onBillScroll"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
      >
        <view :class="['bill-content', transitionDirection]" :key="currentYear + '-' + currentMonth">
          <view class="bill-content-inner">
            <view class="pull-hint" v-show="(isRefreshing || isAtTop) && !isCurrentMonth">
              <text class="pull-hint-text">{{ isRefreshing ? '加载中...' : '下拉查看下一个月' }}</text>
            </view>

            <EmptyState
              v-if="!loading && sortedDates.length === 0"
              type="no-record"
              title="本月份还没有记账哦"
              description="记一笔，从今天的一杯咖啡开始"
              action-text="立即记一笔"
              show-action
              @action="goToRecord"
            />

            <view class="bill-section-wrapper">
              <view v-for="date in sortedDates" :key="date" :id="'day-' + date" class="bill-section">
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
            </view>

            <view class="load-more" v-show="isAtBottom" @tap="handleLoadMoreTap">
              <text class="load-more-text">{{ loadMoreText }}</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <YearMonthPicker ref="yearMonthPickerRef" v-model="selectedYearMonth" />
    <CustomTabbar />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, reactive, watch, nextTick } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { recordApi, type RecordType } from '../../api/record'
import { getAccountList } from '../../api/account'
import { categoryApi, type CategoryGroup } from '../../api/category'
import CustomTabbar from '../../components/CustomTabbar.vue'
import YearMonthPicker from '../../components/YearMonthPicker.vue'
import DetailHeader from './components/DetailHeader.vue'
import FunctionBar, { type FunctionItem } from './components/FunctionBar.vue'
import { useFunctionItemsStore } from '../../stores/functionItems'
import BillCard, { type BillCardRecord } from './components/BillCard.vue'
import { getCategoryIconClass } from '../../utils/category-icon-map'
import { formatCurrency } from '../../utils/format'

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

const expenseCategories = ref<CategoryGroup[]>([])
const incomeCategories = ref<CategoryGroup[]>([])
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
const errorState = ref<{ type: string; show: boolean }>({ type: 'unknown', show: false })
const isRefreshing = ref(false)
const isAtTop = ref(true)
const isAtBottom = ref(false)
const hasMoreData = ref(true)
let loadPrevMonthLock = false
let lastScrollTop = 0

// ── 搜索模式 ──
const isSearchMode = ref(false)
const searchKeyword = ref('')
const searchResults = ref<SearchResultItem[]>([])
const searchLoading = ref(false)
const searchTotal = ref(0)
let searchTimer: ReturnType<typeof setTimeout> | null = null

interface SearchResultItem {
  id: number
  typeId: number | null
  type: string
  amount: number
  remark?: string
  date: string
  accountName?: string
  categoryName?: string
}

const enterSearchMode = () => {
  isSearchMode.value = true
  searchKeyword.value = ''
  searchResults.value = []
  searchTotal.value = 0
}

const exitSearchMode = () => {
  isSearchMode.value = false
  searchKeyword.value = ''
  searchResults.value = []
  searchTotal.value = 0
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
}

const clearSearch = () => {
  searchKeyword.value = ''
  searchResults.value = []
  searchTotal.value = 0
}

const onSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer)
  const keyword = searchKeyword.value.trim()
  if (!keyword) {
    searchResults.value = []
    searchTotal.value = 0
    return
  }
  searchTimer = setTimeout(() => {
    performSearch()
  }, 300)
}

const performSearch = async () => {
  const keyword = searchKeyword.value.trim()
  if (!keyword) return
  searchLoading.value = true
  try {
    const res = await recordApi.searchRecords(keyword, 1, 50)
    if (res.success && res.data) {
      searchResults.value = res.data.list || []
      searchTotal.value = res.data.total || 0
    } else {
      searchResults.value = []
      searchTotal.value = 0
    }
  } catch {
    searchResults.value = []
    searchTotal.value = 0
  } finally {
    searchLoading.value = false
  }
}

const searchDateGroups = computed(() => {
  const groups = new Map<string, SearchResultItem[]>()
  for (const r of searchResults.value) {
    if (!groups.has(r.date)) groups.set(r.date, [])
    groups.get(r.date)!.push(r)
  }
  return Array.from(groups.entries())
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
    .map(([date, records]) => ({ date, records }))
})

const getRecordColor = (record: SearchResultItem) => {
  return record.type === 'income'
    ? 'var(--color-primary-light)'
    : 'rgba(148, 163, 184, 0.12)'
}

const getRecordIcon = (record: SearchResultItem) => {
  return getCategoryIconClass(record.categoryName || '')
}

const getRecordCategoryName = (record: SearchResultItem) => {
  if (!record.categoryName) {
    if (record.type === 'transfer') return '转账'
    if (record.type === 'repayment') return '还款'
    return '其他'
  }
  return record.categoryName
}

const formatSearchAmount = (record: SearchResultItem) => {
  const prefix = record.type === 'income' ? '+' : '-'
  return prefix + formatCurrency(Math.abs(record.amount))
}

const handleSearchResultTap = (record: SearchResultItem) => {
  uni.navigateTo({
    url: `/pages/record/record-edit-money?id=${record.id}`,
  })
}

// ── 滚动位置缓存 ──
const SCROLL_CACHE_KEY = 'dl_scroll_cache'
const restoreScrollTop = ref(0)
const saveScrollPosition = () => {
  if (lastScrollTop > 0) {
    uni.setStorageSync(SCROLL_CACHE_KEY, {
      top: lastScrollTop,
      month: `${currentYear.value}-${currentMonth.value}`,
    })
  }
}

const loadMoreText = computed(() => {
  return hasMoreData.value ? '上拉查看上一个月' : '没有更早的记录了'
})

const isCurrentMonth = computed(() => {
  const now = new Date()
  return parseInt(currentYear.value) === now.getFullYear() &&
    parseInt(currentMonth.value) === now.getMonth() + 1
})

const functionItemsStore = useFunctionItemsStore()
const functionItems = computed(() => functionItemsStore.topItems)

const goToRecord = () => {
  uni.navigateTo({ url: '/pages/record/index' })
}

const handleFunctionClick = (item: FunctionItem) => {
  if (item.key === 'cashflow') {
    uni.navigateTo({ url: '/pages/detail/cashflow' })
    return
  }
  if (item.key === 'bill') {
    uni.navigateTo({ url: '/pages/detail/bill' })
    return
  }
  if (item.key === 'fire') {
    uni.navigateTo({ url: '/pages/detail/fire-progress' })
    return
  }
  if (item.key === 'asset') {
    uni.navigateTo({ url: '/pages/analysis/analysis' })
    return
  }
  console.log('Function clicked:', item.key)
}

const handleMoreClick = () => {
  uni.navigateTo({ url: '/pages/detail/function-list' })
}

const handleOpenStatistics = (tab: 'income' | 'expense') => {
  const yearMonth = `${currentYear.value}-${currentMonth.value}`
  uni.navigateTo({ url: `/pages/statistics/index?yearMonth=${yearMonth}&tab=${tab}` })
}

const handleRecordTap = (record: BillCardRecord) => {
  uni.navigateTo({
    url: `/pages/record/record-edit-money?id=${record.id}`,
  })
}

const handleCategoryTap = (record: BillCardRecord) => {
  uni.navigateTo({
    url: `/pages/record/record-edit-category?recordId=${record.id}&recordType=${record.type}&selectedTypeId=${record.typeId || 0}`,
  })
}

const INCOME_BG = 'var(--color-primary-light)'
const EXPENSE_BG = 'rgba(148, 163, 184, 0.12)'

const getCategoryInfo = (typeId: number | null, recordType: string): { name: string; icon: string; color: string } => {
  if (typeId === null || typeId === undefined) {
    return { name: '其他', icon: 'category-icon-qita', color: EXPENSE_BG }
  }
  for (const group of categories.value) {
    for (const cat of group.children) {
      if (cat.id === typeId) {
        const icon = getCategoryIconClass(cat.name)
        const color = recordType === 'income' ? INCOME_BG : EXPENSE_BG
        return { name: cat.name, icon, color }
      }
    }
  }
  return { name: '其他', icon: 'category-icon-qita', color: EXPENSE_BG }
}

const sortedDates = computed(() => {
  return Array.from(pageData.keys()).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
})

const getDateRecords = (date: string): RecordItem[] => {
  return pageData.get(date)?.list || []
}

const getEnrichedRecords = (date: string): BillCardRecord[] => {
  return getDateRecords(date).map((record) => {
    const info = getCategoryInfo(record.typeId, record.type)
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
  return formatCurrency(income)
}

const getDayExpense = (dateStr: string) => {
  const dayRecords = getDateRecords(dateStr)
  const expense = dayRecords.filter((r) => r.type === 'expense').reduce((sum, r) => sum + Math.abs(r.amount), 0)
  return formatCurrency(expense)
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
      expenseCategories.value = expenseRes.data
      incomeCategories.value = incomeRes.data
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

const loadMonthSummary = () => {
  let income = 0
  let expense = 0
  pageData.forEach((data) => {
    data.list.forEach((record) => {
      if (record.type === 'income') income += Math.abs(record.amount)
      else if (record.type === 'expense') expense += Math.abs(record.amount)
    })
  })
  monthIncome.value = income
  monthExpense.value = expense
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
  errorState.value.show = false
  try {
    await Promise.all([loadCategoriesOnce(), loadFirstPageDates()])
    loadMonthSummary()
    lastLoadedKey = `${currentYear.value}-${currentMonth.value}`
    // 如果是从统计页跳过来的，滚动到目标日期
    if (pendingScrollDay.value) {
      const targetId = `day-${currentYear.value}-${currentMonth.value.padStart(2, '0')}-${pendingScrollDay.value}`
      // 等下一个 tick 确保 v-for 渲染完
      nextTick(() => {
        scrollIntoViewId.value = targetId
        pendingScrollDay.value = null
        // 500ms 后清空 scrollIntoViewId，避免影响其他滚动操作
        setTimeout(() => { scrollIntoViewId.value = '' }, 500)
      })
    }
  } catch (error: any) {
    console.error('加载数据失败:', error)
    errorState.value = {
      type: error?.code === 'NETWORK' || error?.code === 'TIMEOUT' ? error.code.toLowerCase() : 'unknown',
      show: true
    }
  } finally {
    loading.value = false
    // 切换月份后重置边界状态
    isAtTop.value = true
    isAtBottom.value = false
    lastScrollTop = 0
  }
}

const onErrorRetry = () => {
  loadMonthData()
}

// 监听滚动 - 检测边界位置
const onBillScroll = (e: any) => {
  const scrollTop = e.detail.scrollTop || 0
  const scrollHeight = e.detail.scrollHeight || 0
  const clientHeight = e.detail.clientHeight || 0
  
  // 检测是否滚动到顶部（scrollTop 接近 0）
  isAtTop.value = scrollTop < 10
  
  // 检测是否滚动到底部（含内容不足一屏的情况）
  if (scrollHeight - scrollTop - clientHeight < 10) {
    isAtBottom.value = true
  } else if (scrollTop < lastScrollTop - 5) {
    // 向上滚动时重置 isAtBottom
    isAtBottom.value = false
  }
  lastScrollTop = scrollTop
  // 实时缓存滚动位置
  saveScrollPosition()
}

const handleScrollToUpper = async () => {
  isRefreshing.value = true
  try {
    await switchToNextMonth()
  } finally {
    isRefreshing.value = false
    // 刷新后重置滚动位置，回到顶部状态
    isAtTop.value = true
    lastScrollTop = 0
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
      hasMoreData.value = false
      uni.showToast({
        title: '已经到底了，没有更多数据了',
        icon: 'none'
      })
    }
  } catch (error) {
    hasMoreData.value = false
    console.error('[detail] 查找上月数据失败', error)
    uni.showToast({
      title: '已经到底了，没有更多数据了',
      icon: 'none'
    })
  }
}

const handleReachBottom = async () => {
  isAtBottom.value = true
  if (loadPrevMonthLock) return
  
  loadPrevMonthLock = true
  await switchToPrevMonth()
  
  setTimeout(() => {
    loadPrevMonthLock = false
  }, 1000)
}

const handleLoadMoreTap = async () => {
  isAtBottom.value = true
  if (loadPrevMonthLock) return
  
  loadPrevMonthLock = true
  await switchToPrevMonth()
  
  setTimeout(() => {
    loadPrevMonthLock = false
  }, 1000)
}

let touchStartY = 0

const handleTouchStart = (e: TouchEvent) => {
  touchStartY = e.touches[0].clientY
}

const handleTouchEnd = (e: TouchEvent) => {
  if (loadPrevMonthLock) return
  const touchEndY = e.changedTouches[0].clientY
  const deltaY = touchStartY - touchEndY
  
  // 向上滑动（deltaY > 0 = 手指向上移动）且幅度足够，仅在接近底部时触发
  if (deltaY > 30 && isAtBottom.value) {
    loadPrevMonthLock = true
    switchToPrevMonth()
    setTimeout(() => {
      loadPrevMonthLock = false
    }, 1000)
  }
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
          getAccountList().catch(() => {}) // 静默刷新账户列表缓存
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
  // 从后端同步功能入口排序（静默降级到 localStorage）
  functionItemsStore.loadFromRemote()

  // 恢复缓存的滚动位置 (仅当月份匹配时)
  const cached = uni.getStorageSync(SCROLL_CACHE_KEY)
  if (cached && cached.month === `${currentYear.value}-${currentMonth.value}`) {
    restoreScrollTop.value = cached.top
    // 延迟清除缓存，等渲染完成后重置 restoreScrollTop
    setTimeout(() => {
      restoreScrollTop.value = 0
      uni.removeStorageSync(SCROLL_CACHE_KEY)
    }, 300)
  }

  // 1) 先检查当前月份是否有数据
  try {
    const currentYM = `${currentYear.value}-${currentMonth.value}`
    const checkRes = await recordApi.getRecordsByMonth(currentYM, 1, 1)
    const hasCurrentMonthData = checkRes.success && checkRes.data && checkRes.data.total > 0

    if (hasCurrentMonthData) {
      // 当前月有数据，直接加载
      await loadMonthData()
    } else {
      // 当前月无数据，查找最近有数据的月份
      const nearestRes = await recordApi.getNearestMonth(currentYM, 'prev')
      if (nearestRes.success && nearestRes.data) {
        const [y, m] = nearestRes.data.split('-')
        currentYear.value = y
        currentMonth.value = m.padStart(2, '0')
        selectedYearMonth.value = nearestRes.data
        // selectedYearMonth watcher 会触发 loadMonthData
      } else {
        await loadMonthData()
      }
    }
  } catch {
    await loadMonthData()
  }
})

// 离开页面时保存滚动位置
onBeforeUnmount(() => {
  saveScrollPosition()
})

/** 追踪上次加载的月份，避免 onShow 时重复加载 */
let lastLoadedKey = ''

onShow(() => {
  // 始终刷新数据，确保从记账页返回后能看到最新记录
  // 去掉 lastLoadedKey 缓存判断，因为用户可能刚记了新账
  loadMonthData()
})

/** 接收记账页跳转时传递的 month 参数，使明细页直接展示记账日期所在月份 */
/** 从统计页跳转过来时携带的目标日期（day 格式：dd） */
const pendingScrollDay = ref<string | null>(null)
/** 滚动区域引用，用于 scroll-into-view 定位 */
const billScrollRef = ref<any>(null)
/** 目标日期对应的 id（用于 scroll-into-view） */
const scrollIntoViewId = ref<string>('')

onLoad((options: any) => {
  lastLoadedKey = '' // 强制刷新，确保记账后数据最新
  if (options?.month) {
    currentYear.value = options.month.split('-')[0]
    currentMonth.value = options.month.split('-')[1]
    // 不设 selectedYearMonth，避免触发 watch 导致 loadMonthData 比 onShow 提早执行
  } else {
    // 兜底：从 storage 读取（解决 uni.reLaunch 参数在某些环境丢失的问题）
    try {
      const savedMonth = uni.getStorageSync('navigate_month')
      if (savedMonth) {
        const parts = savedMonth.split('-')
        if (parts.length === 2) {
          currentYear.value = parts[0]
          currentMonth.value = parts[1]
        }
        uni.removeStorageSync('navigate_month')
      }
    } catch {}
  }
  // 从统计页概览卡跳转过来时，记录目标日期，数据加载完成后自动 scroll 到该日期
  if (options?.day) {
    pendingScrollDay.value = String(options.day).padStart(2, '0')
  } else if (options?.date) {
    const parts = String(options.date).split('-')
    if (parts.length === 3) {
      pendingScrollDay.value = parts[2]
    }
  }
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

.bill-content-inner {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.bill-section-wrapper {
  flex: 1;
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

.pull-hint {
  padding: 24rpx 30rpx;
  text-align: center;
}

.pull-hint-text {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
}

.load-more {
  padding: 30rpx;
  text-align: center;
}

.load-more-text {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
}

/* ── 搜索栏 ── */
.search-bar {
  background: #FFFFFF;
  padding: 12rpx 24rpx;
  flex-shrink: 0;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.search-bar-inner {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.search-back {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.search-back-arrow {
  font-size: 48rpx;
  color: #333;
  line-height: 1;
  font-weight: 300;
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background: #F5F7FA;
  border-radius: 16rpx;
  height: 64rpx;
  padding: 0 16rpx;
  gap: 8rpx;
}

.search-input-icon {
  width: 32rpx;
  height: 32rpx;
  flex-shrink: 0;
  opacity: 0.5;
}

.search-input {
  flex: 1;
  height: 64rpx;
  font-size: 28rpx;
  color: #1E293B;
  background: transparent;
}

.search-clear {
  width: 36rpx;
  height: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.2);
}

.search-clear-text {
  font-size: 22rpx;
  color: #94A3B8;
  line-height: 1;
}

/* ── 搜索结果 ── */
.search-results-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-results-scroll {
  flex: 1;
}

.search-results-list {
  padding: 0 24rpx;
}

.search-date-group {
  margin-top: 24rpx;
}

.search-date-header {
  padding: 0 4rpx;
  margin-bottom: 8rpx;
}

.search-date-text {
  font-size: 28rpx;
  color: #64748B;
  font-weight: 500;
}

.search-result-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1px solid #F0F0F0;
  min-height: 120rpx;
}

.search-result-row:last-child {
  border-bottom: none;
}

.search-result-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
  min-width: 0;
}

.search-result-icon {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.search-result-icon .category-icon-svg {
  width: 32rpx;
  height: 32rpx;
}

.search-result-info {
  flex: 1;
  min-width: 0;
}

.search-result-title-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 4rpx;
}

.search-result-category {
  font-size: 28rpx;
  color: #1E293B;
  font-weight: 500;
  flex-shrink: 0;
}

.search-result-remark {
  font-size: 24rpx;
  color: #94A3B8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-result-meta {
  font-size: 22rpx;
  color: #94A3B8;
}

.search-result-amount {
  font-size: 28rpx;
  font-weight: 500;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.search-result-amount.expense {
  color: #EF4444;
}

.search-result-amount.income {
  color: #10B981;
}

.search-result-count {
  padding: 24rpx 0;
  text-align: center;
}

.search-count-text {
  font-size: 24rpx;
  color: #94A3B8;
}
</style>
