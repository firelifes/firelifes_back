<template>
  <view class="page">
    <view class="account-header">
      <view class="nav-bar">
        <view class="back-btn" @click="goBack">
          <view class="back-icon category-icon-svg category-icon-chevron-left"></view>
        </view>
        <text class="nav-title">账户交易明细</text>
      </view>
      <view class="account-row">
        <view class="account-icon category-icon-svg" :class="getAccountIconClass(accountInfo.icon, accountInfo.type)"></view>
        <text class="account-name">{{ accountInfo.name }}</text>
        <text class="account-balance" :class="{ negative: accountInfo.balance < 0 }">
          {{ formatAmount(accountInfo.balance) }}
        </text>
      </view>
      <view class="monthly-summary">
        <view class="summary-item">
          <text class="summary-label">本月收入</text>
          <text class="summary-value income">{{ formatAbs(monthlySummary.income) }}</text>
        </view>
        <view class="summary-divider"></view>
        <view class="summary-item">
          <text class="summary-label">本月支出</text>
          <text class="summary-value expense">-{{ formatAbs(monthlySummary.expense) }}</text>
        </view>
        <view v-if="monthlySummary.adjustmentIncrease > 0" class="summary-divider"></view>
        <view v-if="monthlySummary.adjustmentIncrease > 0" class="summary-item">
          <text class="summary-label">本月调增</text>
          <text class="summary-value adjustment">{{ formatAbs(monthlySummary.adjustmentIncrease) }}</text>
        </view>
        <view v-if="monthlySummary.adjustmentDecrease > 0" class="summary-divider"></view>
        <view v-if="monthlySummary.adjustmentDecrease > 0" class="summary-item">
          <text class="summary-label">本月调减</text>
          <text class="summary-value adjustment">-{{ formatAbs(monthlySummary.adjustmentDecrease) }}</text>
        </view>
      </view>
    </view>

    <view v-if="loading && sortedDates.length === 0" class="loading-state">
      <text class="loading-text">加载中...</text>
    </view>

    <view class="bill-wrapper">
      <scroll-view
        scroll-y
        class="bill-scroll"
        @scrolltolower="handleReachBottom"
        :lower-threshold="60"
      >
        <view v-if="!loading && sortedDates.length === 0" class="empty-state">
          <text class="empty-text">暂无交易记录</text>
        </view>

        <view v-for="date in sortedDates" :key="date" class="bill-section">
          <BillCard
            :formattedDate="formatDate(date)"
            :dayIncome="getDayIncome(date)"
            :dayExpense="getDayExpense(date)"
            :records="getEnrichedRecords(date)"
            @record-tap="handleRecordTap"
            @record-delete="handleDeleteRecord"
          />
        </view>

        <view v-if="sortedDates.length > 0" class="load-more">
          <text class="load-more-text">{{ loadMoreText }}</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { recordApi } from '../../api/record'
import { categoryApi, type CategoryGroup } from '../../api/category'
import { getAccountIconClass } from '../../types/account'
import type { AccountType } from '../../types/account'
import { getCategoryIconClass } from '../../utils/category-icon-map'
import BillCard, { type BillCardRecord } from '../detail/components/BillCard.vue'

const accountId = ref(0)
const loading = ref(true)
const loadingMore = ref(false)
const noMore = ref(false)
const page = ref(1)
const pageSize = 50
const deletingId = ref<number | null>(null)

const accountInfo = ref({
  icon: '',
  name: '',
  balance: 0,
  type: 'cash' as AccountType,
})

const monthlySummary = ref({
  income: 0,
  expense: 0,
  adjustmentIncrease: 0,
  adjustmentDecrease: 0,
})

interface RecordItem {
  id: number
  typeId: number
  type: 'income' | 'expense' | 'transfer' | 'repayment' | 'adjustment_increase' | 'adjustment_decrease'
  amount: number
  remark?: string
  date: string
  categoryName?: string
  counterpartAccountName?: string
  direction?: 'in' | 'out'
}

interface DatePageData {
  list: RecordItem[]
  total: number
  page: number
  pageSize: number
}

const categories = ref<CategoryGroup[]>([])
const pageData = reactive<Map<string, DatePageData>>(new Map())

const loadMoreText = computed(() => {
  if (noMore.value) return '已经到底了'
  if (loadingMore.value) return '加载中...'
  return '上拉加载更多'
})

const sortedDates = computed(() => {
  return Array.from(pageData.keys()).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
})

const getDateRecords = (date: string): RecordItem[] => {
  return pageData.get(date)?.list || []
}

const CATEGORY_BG_COLOR = 'var(--color-primary-light)'

const getCategoryInfo = (record: RecordItem): { name: string; icon: string; color: string } => {
  // 先尝试通过 typeId 查找
  if (record.typeId && categories.value.length > 0) {
    for (const group of categories.value) {
      for (const cat of group.children) {
        if (cat.id === record.typeId) {
          const icon = getCategoryIconClass(cat.name)
          return { name: cat.name, icon, color: CATEGORY_BG_COLOR }
        }
      }
    }
  }
  // 再尝试通过 categoryName 查找
  if (record.categoryName) {
    return {
      name: record.categoryName,
      icon: getCategoryIconClass(record.categoryName),
      color: CATEGORY_BG_COLOR,
    }
  }
  return { name: '其他', icon: 'icon-qita', color: CATEGORY_BG_COLOR }
}

const getEnrichedRecords = (date: string): BillCardRecord[] => {
  return getDateRecords(date).map((record) => {
    const info = getCategoryInfo(record)
    let displayName = info.name
    if (record.type === 'transfer') {
      displayName = record.direction === 'out'
        ? `转出至${record.counterpartAccountName || '未知账户'}`
        : `从${record.counterpartAccountName || '未知账户'}转入`
    } else if (record.type === 'repayment') {
      displayName = record.direction === 'out'
        ? `还款至${record.counterpartAccountName || '未知账户'}`
        : `收到还款`
    } else if (record.type === 'adjustment_increase') {
      displayName = record.remark || '余额调增'
    } else if (record.type === 'adjustment_decrease') {
      displayName = record.remark || '余额调减'
    } else if (record.remark) {
      displayName = record.remark
    }
    return {
      id: record.id,
      typeId: record.typeId,
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
  const today = new Date()
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff = (todayDate.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)

  if (diff === 0) return '今天'
  if (diff === 1) return '昨天'
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const weekDay = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()]
  return `${month}月${day}日 ${weekDay}`
}

const formatAmount = (val: number) => {
  const prefix = val < 0 ? '-¥' : '¥'
  return prefix + Math.abs(val).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const formatAbs = (val: number) => {
  return '¥' + Math.abs(val).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const loadCategories = async () => {
  try {
    const [expenseRes, incomeRes] = await Promise.all([
      categoryApi.getUserCategories('expense'),
      categoryApi.getUserCategories('income'),
    ])

    if (expenseRes.success && expenseRes.data && incomeRes.success && incomeRes.data) {
      categories.value = [...expenseRes.data, ...incomeRes.data]
    }
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

const loadData = async () => {
  if (!accountId.value) return
  loading.value = true
  try {
    const res = await recordApi.getRecordsByAccount(accountId.value, 1, pageSize)
    if (res.success && res.data) {
      accountInfo.value = {
        icon: res.data.account.icon,
        name: res.data.account.name,
        balance: res.data.account.balance,
        type: res.data.account.type,
      }
      monthlySummary.value = res.data.monthlySummary
      
      pageData.clear()
      const list = res.data.records.list
      const dateGroups = new Map<string, RecordItem[]>()
      list.forEach((record: RecordItem) => {
        const dateStr = record.date
        if (!dateGroups.has(dateStr)) {
          dateGroups.set(dateStr, [])
        }
        dateGroups.get(dateStr)!.push(record)
      })
      dateGroups.forEach((records, date) => {
        pageData.set(date, {
          list: records,
          total: list.length,
          page: 1,
          pageSize: pageSize
        })
      })
      
      page.value = 1
      noMore.value = list.length >= res.data.records.total
    }
  } catch (e) {
    console.error('加载账户交易记录失败:', e)
  } finally {
    loading.value = false
  }
}

const handleReachBottom = async () => {
  if (loadingMore.value || noMore.value) return
  loadingMore.value = true
  try {
    const nextPage = page.value + 1
    const res = await recordApi.getRecordsByAccount(accountId.value, nextPage, pageSize)
    if (res.success && res.data) {
      const list = res.data.records.list
      list.forEach((record: RecordItem) => {
        const dateStr = record.date
        if (!pageData.has(dateStr)) {
          pageData.set(dateStr, {
            list: [],
            total: res.data.records.total,
            page: nextPage,
            pageSize: pageSize
          })
        }
        pageData.get(dateStr)!.list.push(record)
      })
      
      page.value = nextPage
      noMore.value = Array.from(pageData.values()).reduce((sum, d) => sum + d.list.length, 0) >= res.data.records.total
    }
  } catch (e) {
    console.error('加载更多失败:', e)
  } finally {
    loadingMore.value = false
  }
}

const handleRecordTap = (record: BillCardRecord) => {
  uni.navigateTo({
    url: `/pages/record/edit-record?id=${record.id}`,
  })
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
          // 重新加载数据以获取最新的账户余额和月度汇总
          await loadData()
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

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.redirectTo({ url: '/pages/analysis/analysis' })
  }
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const id = currentPage?.options?.accountId || currentPage?.$page?.options?.accountId
  if (id) {
    accountId.value = parseInt(id)
    Promise.all([loadCategories(), loadData()])
  }
})

onShow(() => {
  // 每次显示页面时重新加载数据，确保数据是最新的
  if (accountId.value) {
    loadData()
  }
})
</script>

<style scoped>
.page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-page, #F5F7FA);
  overflow: hidden;
  z-index: 1;
}

.account-header {
  background: linear-gradient(135deg, var(--color-primary, #00BFFF) 0%, var(--color-primary-dark, #0099CC) 100%);
  padding: 16rpx 32rpx 24rpx;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding-bottom: 20rpx;
  position: relative;
}

.back-btn {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 4rpx;
  font-size: var(--text-body);
  color: #FFFFFF;
  padding: 8rpx 0;
}

.back-icon {
  width: 36rpx;
  height: 36rpx;
}

.nav-title {
  font-size: var(--text-nav);
  color: #FFFFFF;
  font-weight: 600;
}

.account-row {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding-bottom: 16rpx;
  gap: 12rpx;
}

.account-icon {
  width: 40rpx;
  height: 40rpx;
  color: #FFFFFF;
  flex-shrink: 0;
}

.account-name {
  font-size: var(--text-body);
  color: #FFFFFF;
  font-weight: 500;
}

.account-balance {
  font-size: var(--text-number);
  color: #FFFFFF;
  font-weight: 700;
  flex-shrink: 0;
}

.account-balance.negative {
  color: #FFB3B3;
}

.monthly-summary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40rpx;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.summary-label {
  font-size: var(--text-note);
  color: #ffffffb3;
}

.summary-value {
  font-size: var(--text-small);
  font-weight: 600;
}

.summary-value.expense {
  color: #FFB3B3;
}

.summary-value.income {
  color: #B3FFD9;
}

.summary-value.adjustment {
  color: rgba(255, 255, 255, 0.5);
}

.summary-divider {
  width: 1rpx;
  height: 40rpx;
  background: #ffffff33;
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
  margin: 20rpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bill-scroll {
  flex: 1;
  height: 100%;
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
  padding: 100rpx 0;
}

.empty-text {
  font-size: var(--text-title);
  color: var(--color-text-secondary, #94A3B8);
}
</style>
