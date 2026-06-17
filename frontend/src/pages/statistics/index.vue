<!--
  pages/statistics/index.vue - 统计页面 v3.1
  对标鲨鱼记账图表页：环形图 + 折线图 + 排行榜
  类型切换 / 维度切换 / 时段切换 / 状态持久化
-->
<template>
  <view class="page">
    <!-- 固定头部区 -->
    <view class="sticky-header">
      <!-- Header 标题区 -->
      <view class="header-bar">
        <view class="header-spacer"></view>
        <view class="header-center" @tap="showTypeDropdown = true">
          <text class="header-type-text">{{ typeText }}</text>
          <text class="header-type-arrow">▼</text>
        </view>
        <view class="header-right" @tap="toggleDimension">
          <text class="dimension-text">{{ dimension === 'month' ? '月' : '年' }}</text>
        </view>
      </view>

      <!-- 时间 Tab 栏 -->
      <scroll-view class="tab-bar" scroll-x :show-scrollbar="false">
        <view
          v-for="period in availablePeriods"
          :key="period.value"
          class="tab-item"
          :class="{ 'tab-active': period.value === selectedPeriod }"
          @tap="selectPeriod(period.value)"
        >
          <text class="tab-text">{{ period.label }}</text>
        </view>
      </scroll-view>
    </view>

    <!-- 错误态 -->
    <ErrorState
      v-if="errorState.show"
      :type="(errorState.type as any)"
      show-retry
      retry-text="重新加载"
      @retry="onErrorRetry"
    />

    <!-- 加载态 -->
    <LoadingState v-else-if="loading" text="正在加载统计数据..." />

    <!-- 内容区 -->
    <view v-else class="content-area">
      <!-- 概览卡：最高消费日 + 日均（最高消费日可下钻到对应日期明细） -->
      <view v-if="activeType !== 'transfer' && linePoints.length > 0" class="overview-strip">
        <view
          class="overview-item overview-item-clickable"
          :class="{ 'overview-item-disabled': !topDay }"
          hover-class="overview-item-hover"
          :hover-stay-time="100"
          @tap="onTopDayTap"
        >
          <text class="overview-label">最高消费日</text>
          <text class="overview-value">{{ topDayLabel }}</text>
          <text v-if="topDayAmount > 0" class="overview-amount">¥{{ formatAmount(topDayAmount) }}</text>
          <text v-if="topDay" class="overview-hint">点击查看 →</text>
        </view>
        <view class="overview-divider"></view>
        <view class="overview-item">
          <text class="overview-label">日均{{ activeType === 'expense' ? '支出' : '收入' }}</text>
          <text class="overview-value">{{ dailyAverageLabel }}</text>
          <text v-if="totalAmount > 0" class="overview-amount">¥{{ formatAmount(dailyAverage) }}</text>
        </view>
      </view>
      <!-- 转账 Tab：总额卡片 -->
      <view v-if="activeType === 'transfer'" class="transfer-card">
        <text class="transfer-total-label">转账总额</text>
        <text class="transfer-total-value">¥{{ formatAmount(totalAmount) }}</text>
        <text class="transfer-count">共 {{ transferCount }} 笔</text>
      </view>

      <!-- 支出/收入：环形图 -->
      <StatisticsRingChart
        v-if="activeType !== 'transfer'"
        :categories="ringCategories"
        :total-amount="totalAmount"
        :type="activeType"
      />

      <!-- 折线图 -->
      <StatisticsLineChart
        :points="linePoints"
        :total-amount="totalAmount"
        :type="activeType"
        :dimension="dimension"
        :total-days="totalPeriodDays"
        @day-tap="onDayTap"
      />

      <!-- 排行榜 -->
      <StatisticsRanking
        :items="rankingItems"
        :type="activeType"
        @item-tap="onRankingItemTap"
      />

      <!-- 空状态 -->
      <EmptyState
        v-if="!loading && rankingItems.length === 0 && linePoints.length === 0"
        type="no-data"
        title="还没有记账数据"
        description="记一笔账单，统计就开始有内容啦"
        action-text="去记账"
        show-action
        @action="goRecord"
      />
    </view>

    <!-- 类型下拉 - 全屏遮罩弹框 -->
    <view v-if="showTypeDropdown" class="dropdown-overlay" @tap="showTypeDropdown = false">
      <view class="dropdown-spacer"></view>
      <view class="dropdown-card" @tap.stop="">
        <view
          v-for="option in typeOptions"
          :key="option.value"
          class="dropdown-item"
          :class="{ 'dropdown-active': option.value === activeType }"
          @tap="selectType(option.value)"
        >
          <view v-if="option.value === activeType" class="dropdown-dot"></view>
          <text class="dropdown-text">{{ option.label }}</text>
        </view>
      </view>
    </view>

    <!-- 每日 TOP3 弹层 -->
    <view v-if="showDayPopup" class="day-popup-mask" @tap="closeDayPopup">
      <view class="day-popup-card" @tap.stop>
        <text class="day-popup-title">{{ dayPopupTitle }}</text>
        <view v-for="(rec, idx) in selectedDayRecords" :key="idx" class="day-popup-row">
          <view class="day-popup-cat">{{ getDayRecordLabel(rec) }}</view>
          <view class="day-popup-right">
            <text class="day-popup-amount">{{ dayPopupPrefix }}{{ formatAmount(rec.amount) }}</text>
            <text v-if="rec.remark" class="day-popup-remark">{{ rec.remark }}</text>
          </view>
        </view>
        <view v-if="selectedDayRecords.length === 0" class="day-popup-empty">
          暂无记录
        </view>
        <view class="day-popup-close" @tap="closeDayPopup">
          <text>关闭</text>
        </view>
      </view>
    </view>

    <CustomTabbar />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { onLoad, onPageScroll } from '@dcloudio/uni-app'
import { recordApi } from '../../api/record'
import { categoryApi } from '../../api/category'
import CustomTabbar from '../../components/CustomTabbar.vue'
import EmptyState from '../../components/EmptyState.vue'
import LoadingState from '../../components/LoadingState.vue'
import StatisticsRingChart from './components/StatisticsRingChart.vue'
import StatisticsLineChart from './components/StatisticsLineChart.vue'
import StatisticsRanking from './components/StatisticsRanking.vue'
import { getCategoryIconClass } from '../../utils/category-icon-map'
import { formatCurrency } from '../../utils/format'

// ── 状态持久化 Keys ──
const STORAGE_TYPE = 'stats-type'
const STORAGE_DIMENSION = 'stats-dimension'
const STORAGE_PERIOD = 'stats-period'

// ── 滚动位置缓存 ──
const SCROLL_CACHE_KEY = 'stats_scroll_pos'
let pageScrollTop = 0
const trackScroll = () => {
  if (pageScrollTop > 0) {
    uni.setStorageSync(SCROLL_CACHE_KEY, pageScrollTop)
  }
}

onPageScroll((e) => {
  pageScrollTop = e.scrollTop
  trackScroll()
})

// ── 响应式状态 ──
const activeType = ref<'expense' | 'income' | 'transfer'>('expense')
const dimension = ref<'month' | 'year'>('month')
const selectedPeriod = ref('')
const showTypeDropdown = ref(false)
const loading = ref(false)
const errorState = ref<{ type: string; show: boolean }>({ type: 'unknown', show: false })

const totalAmount = ref(0)
const transferCount = ref(0)
const ringCategories = ref<{ name: string; amount: number; percent: number; color: string; typeId: number }[]>([])
const linePoints = ref<{ label: string; value: number; isMax: boolean }[]>([])
const rankingItems = ref<{ name: string; icon: string; amount: number; percent: number; color: string; type: string; typeId: number }[]>([])
const availablePeriods = ref<{ value: string; label: string }[]>([])

const RING_COLORS = ['#0D9488', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#64748B']

// 日维度记录详情（按 day 分组存储当月全部记录，用于点击折线图弹出 TOP3）
const dayRecordsMap = ref<Map<number, any[]>>(new Map())
const categoryNameMap = ref<Map<number, string>>(new Map())
const selectedDay = ref(0)
const selectedDayRecords = computed(() => {
  if (selectedDay.value <= 0) return []
  const records = dayRecordsMap.value.get(selectedDay.value) || []
  return [...records].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)).slice(0, 3)
})
const getCategoryName = (typeId: number) => categoryNameMap.value.get(typeId) || '未知'

// 每日弹层标题 — 根据当前 Tab 动态显示
const dayPopupTitle = computed(() => {
  const typeLabel = activeType.value === 'expense' ? '支出' : activeType.value === 'income' ? '收入' : '转账'
  return `${selectedPeriod.value}月${selectedDay.value}日 ${typeLabel} TOP3`
})

// 每日弹层金额前缀
const dayPopupPrefix = computed(() => {
  if (activeType.value === 'expense') return '-'
  if (activeType.value === 'income') return '+'
  return ''
})

// 每日弹层记录标签 — 转账类用备注，其余用分类名
const getDayRecordLabel = (rec: any) => {
  if (activeType.value === 'transfer') {
    return rec.remark || (rec.type === 'repayment' ? '还款' : '转账')
  }
  return getCategoryName(rec.typeId)
}

const formatAmount = (v: number) => formatCurrency(Math.abs(v))

// 平均值计算用的真实天数：当月未过完=截止今天，过完了=当月总天数
const totalPeriodDays = computed(() => {
  if (dimension.value === 'year') {
    const year = parseInt(selectedPeriod.value)
    const now = new Date()
    return (year === now.getFullYear()) ? (now.getMonth() + 1) : 12
  }
  // month
  const parts = selectedPeriod.value.split('-')
  const y = parseInt(parts[0])
  const m = parseInt(parts[1])
  const now = new Date()
  const isCurrentMonth = y === now.getFullYear() && m === now.getMonth() + 1
  if (isCurrentMonth) return now.getDate()
  return new Date(y, m, 0).getDate()
})

// ── C2 概览卡：最高消费日 + 日均 ──
const topDay = computed(() => {
  if (linePoints.value.length === 0) return null
  return linePoints.value.reduce((max, p) => p.value > max.value ? p : max, linePoints.value[0])
})
const topDayLabel = computed(() => {
  if (!topDay.value) return '-'
  if (dimension.value === 'year') {
    return `${topDay.value.label}月`
  }
  return `${topDay.value.label}日`
})
const topDayAmount = computed(() => topDay.value?.value || 0)

const dailyAverage = computed(() => {
  const days = totalPeriodDays.value || 1
  return Math.round(totalAmount.value / days)
})
const dailyAverageLabel = computed(() => {
  const days = totalPeriodDays.value || 1
  return `过去 ${days} ${dimension.value === 'year' ? '月' : '天'}`
})

// ── 类型选项 ──
const typeOptions: { value: 'expense' | 'income' | 'transfer'; label: string }[] = [
  { value: 'expense', label: '支出' },
  { value: 'income', label: '收入' },
  { value: 'transfer', label: '转账' },
]

const typeText = computed(() => {
  const opt = typeOptions.find(o => o.value === activeType.value)
  return opt ? opt.label : '支出'
})

// ── 持久化读写 ──
const saveState = () => {
  uni.setStorageSync(STORAGE_TYPE, activeType.value)
  uni.setStorageSync(STORAGE_DIMENSION, dimension.value)
  uni.setStorageSync(STORAGE_PERIOD, selectedPeriod.value)
}

const restoreState = () => {
  const savedType = uni.getStorageSync(STORAGE_TYPE)
  const savedDim = uni.getStorageSync(STORAGE_DIMENSION)
  if (savedType) activeType.value = savedType
  if (savedDim) dimension.value = savedDim
}

// ── 维度切换 ──
const toggleDimension = () => {
  dimension.value = dimension.value === 'month' ? 'year' : 'month'
  saveState()
  selectedPeriod.value = ''
  loadPeriods()
}

// ── 折线图点击 ──
const showDayPopup = ref(false)
const onDayTap = (day: number) => {
  selectedDay.value = day
  showDayPopup.value = true
}
const closeDayPopup = () => {
  showDayPopup.value = false
}

// ── 空状态按钮：跳记账页 ──
const goRecord = () => {
  uni.switchTab({ url: '/pages/record/index' })
}

// ── 排行榜点击 → 分类明细页 ──
const onRankingItemTap = (item: { name: string; typeId: number; type: string }) => {
  uni.navigateTo({
    url: `/pages/statistics/category-detail?categoryName=${encodeURIComponent(item.name)}&typeId=${item.typeId}&type=${item.type}&yearMonth=${selectedPeriod.value}`,
  })
}

// ── 概览卡「最高消费日」点击 → 跳到对应日期的明细页 ──
const onTopDayTap = () => {
  if (!topDay.value) return
  const target = topDay.value
  // 折线点是 day-index（0~30）还是 month-index 取决于 dimension
  if (dimension.value === 'month') {
    // day-index，转成 yyyy-MM-dd
    const ym = selectedPeriod.value // "2026-06"
    const day = String(target.label).padStart(2, '0')
    const date = `${ym}-${day}`
    uni.navigateTo({
      url: `/pages/detail/detail-list?month=${ym}&day=${day}&type=${activeType.value}`,
    })
  } else {
    // year dimension，target.label 是 "2026-06" 格式
    uni.navigateTo({
      url: `/pages/detail/detail-list?month=${target.label}&type=${activeType.value}`,
    })
  }
}

// ── 类型选择 ──
const selectType = (type: 'expense' | 'income' | 'transfer') => {
  activeType.value = type
  showTypeDropdown.value = false
  saveState()
  loadPeriods()
}

// ── 时段选择 ──
const selectPeriod = (period: string) => {
  if (period === selectedPeriod.value) return
  selectedPeriod.value = period
  saveState()
  loadData()
}

// ── 数据加载 ──
const loadPeriods = async () => {
  try {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    if (dimension.value === 'year') {
      // 年维度：扫描有记录的所有年份
      const periods: { value: string; label: string }[] = []
      for (let y = currentYear; y >= currentYear - 5; y--) {
        try {
          const res = await recordApi.getMonthSummary(`${y}-01`)
          if (res.success) {
            const hasData = res.data && (res.data.income > 0 || res.data.expense > 0 || (res.data.transfer || 0) > 0)
            if (hasData) {
              const label = y === currentYear ? '今年' : y === currentYear - 1 ? '去年' : `${y}年`
              periods.unshift({ value: `${y}`, label })
            }
          }
        } catch { /* skip */ }
      }
      availablePeriods.value = periods
      // 默认选中最新有数据的年份
      if (!selectedPeriod.value && periods.length > 0) {
        selectedPeriod.value = periods[periods.length - 1].value
      }
    } else {
      // 月维度：扫描当前年有记录的所有月份
      const periods: { value: string; label: string }[] = []
      const year = selectedPeriod.value ? parseInt(selectedPeriod.value.split('-')[0]) : currentYear
      for (let m = 1; m <= 12; m++) {
        try {
          const yyyymm = `${year}-${String(m).padStart(2, '0')}`
          const res = await recordApi.getMonthSummary(yyyymm)
          if (res.success) {
            const hasData = res.data && (res.data.income > 0 || res.data.expense > 0 || (res.data.transfer || 0) > 0)
            if (hasData) {
              const label = m === currentMonth && year === currentYear ? '本月'
                : m === currentMonth - 1 && year === currentYear ? '上月'
                : `${String(m).padStart(2, '0')}月`
              periods.push({ value: yyyymm, label })
            }
          }
        } catch { /* skip */ }
      }
      availablePeriods.value = periods
      if (!selectedPeriod.value && periods.length > 0) {
        const current = periods.find(p => p.label === '本月')
        selectedPeriod.value = current ? current.value : periods[periods.length - 1].value
      }
    }

    if (!selectedPeriod.value && availablePeriods.value.length > 0) {
      selectedPeriod.value = availablePeriods.value[availablePeriods.value.length - 1].value
    }
    saveState()
    loadData()
  } catch {
    // ignore
  }
}

const loadData = async () => {
  if (!selectedPeriod.value || availablePeriods.value.length === 0) return
  loading.value = true
  errorState.value.show = false
  try {
    if (dimension.value === 'month') {
      await loadMonthData()
    } else {
      await loadYearData()
    }
  } catch (error: any) {
    console.error('加载统计数据失败:', error)
    errorState.value = {
      type: error?.code === 'NETWORK' || error?.code === 'TIMEOUT' ? error.code.toLowerCase() : 'unknown',
      show: true
    }
  } finally {
    loading.value = false
  }
}

const onErrorRetry = () => {
  loadData()
}

const loadMonthData = async () => {
  const yearMonth = selectedPeriod.value
  const [summaryRes, recordsRes] = await Promise.all([
    recordApi.getMonthSummary(yearMonth),
    recordApi.getRecordsByMonth(yearMonth, 1, 500),
  ])

  if (summaryRes.success && summaryRes.data) {
    totalAmount.value = activeType.value === 'expense' ? summaryRes.data.expense
      : activeType.value === 'income' ? summaryRes.data.income
      : summaryRes.data.expense // transfers handled differently
  }

  if (recordsRes.success && recordsRes.data) {
    const filtered = recordsRes.data.list.filter((r: any) => {
      if (activeType.value === 'transfer') return r.type === 'transfer' || r.type === 'repayment'
      return r.type === activeType.value
    })

    // Transfer count
    transferCount.value = activeType.value === 'transfer' ? filtered.length : 0
    if (activeType.value === 'transfer') {
      totalAmount.value = filtered.reduce((s: number, r: any) => s + Math.abs(r.amount), 0)
    }

    // Ring chart categories (expense/income only)
    if (activeType.value !== 'transfer') {
      const categories = await categoryApi.getUserCategories(activeType.value)
      const nameMap = new Map<number, string>()
      if (categories.success && categories.data) {
        categories.data.forEach((g: any) => {
          g.children?.forEach((c: any) => nameMap.set(c.id, c.name))
        })
      }
      categoryNameMap.value = nameMap

      const catMap = new Map<number, number>()
      filtered.forEach((r: any) => {
        catMap.set(r.typeId, (catMap.get(r.typeId) || 0) + Math.abs(r.amount))
      })

      const total = totalAmount.value || 1
      ringCategories.value = Array.from(catMap.entries())
        .map(([typeId, amount]) => {
          const name = nameMap.get(typeId) || '未知'
          return {
            name,
            typeId,
            amount,
            percent: Math.round((amount / total) * 100),
            color: '', // 排序后再按排名分配颜色
          }
        })
        .sort((a, b) => b.amount - a.amount)
        .map((c, i) => ({ ...c, color: RING_COLORS[i % RING_COLORS.length] }))

      // Ranking (same as ring but with icon)
      rankingItems.value = ringCategories.value.map(c => {
        const iconClass = getCategoryIconClass(c.name)
        return {
          ...c,
          icon: c.name.charAt(0),
          iconClass: iconClass || undefined,
          type: activeType.value,
        }
      })
    } else {
      // Transfer ranking by account
      rankingItems.value = [] // simplified for now
      ringCategories.value = []
    }

    // 按日分组存储原始记录（用于点击折线图弹出每日 TOP3）
    const newDayRecordsMap = new Map<number, any[]>()
    filtered.forEach((r: any) => {
      const day = parseInt(r.date.split('-')[2] || '1')
      if (!newDayRecordsMap.has(day)) newDayRecordsMap.set(day, [])
      newDayRecordsMap.get(day)!.push(r)
    })
    dayRecordsMap.value = newDayRecordsMap

    // Line chart: group by day
    const dayMap = new Map<number, number>()
    filtered.forEach((r: any) => {
      const day = parseInt(r.date.split('-')[2] || '1')
      dayMap.set(day, (dayMap.get(day) || 0) + Math.abs(r.amount))
    })

    const maxDayVal = Math.max(...Array.from(dayMap.values()), 1)
    const [yearStr, monthStr] = yearMonth.split('-')
    const daysInMonth = new Date(parseInt(yearStr), parseInt(monthStr), 0).getDate()
    const points: { label: string; value: number; isMax: boolean }[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const val = dayMap.get(d) || 0
      points.push({
        label: `${d}日`,
        value: val,
        isMax: val > 0 && val === maxDayVal,
      })
    }
    linePoints.value = points
  }
}

const loadYearData = async () => {
  const year = parseInt(selectedPeriod.value)
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  let yearTotal = 0
  const monthPoints: { label: string; value: number; isMax: boolean }[] = []
  const catYearMap = new Map<number, number>()

  const monthsToLoad = (year === currentYear) ? currentMonth : 12

  for (let m = 1; m <= monthsToLoad; m++) {
    const yyyymm = `${year}-${String(m).padStart(2, '0')}`
    const label = `${String(m).padStart(2, '0')}月`
    try {
      const [summaryRes, recordsRes] = await Promise.all([
        recordApi.getMonthSummary(yyyymm),
        recordApi.getRecordsByMonth(yyyymm, 1, 500),
      ])

      let monthVal = 0
      if (recordsRes.success && recordsRes.data) {
        if (activeType.value === 'transfer') {
          // 转账：从记录中累加 transfer + repayment
          const transferRecords = recordsRes.data.list.filter(
            (r: any) => r.type === 'transfer' || r.type === 'repayment'
          )
          monthVal = transferRecords.reduce((s: number, r: any) => s + Math.abs(r.amount), 0)
          yearTotal += monthVal
        } else {
          // 支出/收入：用 summary 数据
          if (summaryRes.success && summaryRes.data) {
            monthVal = activeType.value === 'expense' ? summaryRes.data.expense
              : summaryRes.data.income
            yearTotal += monthVal
          }
          // 分类统计（仅非转账类型）
          const filtered = recordsRes.data.list.filter((r: any) => r.type === activeType.value)
          filtered.forEach((r: any) => {
            catYearMap.set(r.typeId, (catYearMap.get(r.typeId) || 0) + Math.abs(r.amount))
          })
        }
      }

      monthPoints.push({ label, value: monthVal, isMax: false })
    } catch {
      monthPoints.push({ label, value: 0, isMax: false })
    }
  }

  totalAmount.value = yearTotal
  const maxMonthVal = Math.max(...monthPoints.map(p => p.value), 1)
  linePoints.value = monthPoints.map(p => ({
    ...p,
    isMax: p.value > 0 && p.value === maxMonthVal,
  }))

  // Ring chart for year
  if (activeType.value !== 'transfer') {
    const categories = await categoryApi.getUserCategories(activeType.value)
    const nameMap = new Map<number, string>()
    if (categories.success && categories.data) {
      categories.data.forEach((g: any) => {
        g.children?.forEach((c: any) => nameMap.set(c.id, c.name))
      })
    }

    ringCategories.value = Array.from(catYearMap.entries())
      .map(([typeId, amount]) => {
        const name = nameMap.get(typeId) || '未知'
        return {
          name,
          typeId,
          amount,
          percent: Math.round((amount / (yearTotal || 1)) * 100),
          color: '', // 排序后再按排名分配颜色
        }
      })
      .sort((a, b) => b.amount - a.amount)
      .map((c, i) => ({ ...c, color: RING_COLORS[i % RING_COLORS.length] }))

    rankingItems.value = ringCategories.value.map(c => {
      const iconClass = getCategoryIconClass(c.name)
      return {
        ...c,
        icon: c.name.charAt(0),
        iconClass: iconClass || undefined,
        type: activeType.value,
      }
    })
  }

  transferCount.value = 0
}

// ── 监听 ──
watch(activeType, () => {
  loadData()
})

watch(dimension, () => {
  // loadPeriods handles loadData internally
})

// ── 生命周期 ──
onLoad((options: any) => {
  if (options?.tab) {
    activeType.value = options.tab
  }
})

onMounted(async () => {
  restoreState()
  await loadPeriods()
  // 数据加载完成后恢复滚动位置
  await nextTick()
  const saved = uni.getStorageSync(SCROLL_CACHE_KEY)
  if (saved) {
    uni.pageScrollTo({ scrollTop: saved, duration: 0 })
    uni.removeStorageSync(SCROLL_CACHE_KEY)
  }
})

// 离开页面时保存滚动位置
onBeforeUnmount(() => {
  trackScroll()
})
</script>

<style scoped>
.page {
  height: 100vh;
  background: var(--color-bg-page, #F5F7FA);
  display: flex;
  flex-direction: column;
}

/* ── Sticky Header ── */
.sticky-header {
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

/* ── Header ── */
.header-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: calc(env(safe-area-inset-top) + 20rpx) 16rpx 20rpx;
  background: linear-gradient(135deg, var(--color-primary, #0D9488), var(--color-primary-dark, #0B7A70));
}

.header-spacer {
  width: 64rpx;
  height: 48rpx;
}

.header-center {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.header-type-text {
  font-size: 34rpx;
  font-weight: 600;
  color: #FFFFFF;
}

.header-type-arrow {
  font-size: 20rpx;
  color: #FFFFFF;
}

.header-right {
  width: 64rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.dimension-text {
  font-size: 22rpx;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20rpx;
  padding: 4rpx 18rpx;
}

/* ── Tab Bar ── */
.tab-bar {
  white-space: nowrap;
  background: var(--color-bg-card, #FFFFFF);
  height: 88rpx;
  padding: 12rpx 24rpx;
  overflow-x: auto;
  border-bottom: 1rpx solid #F1F5F9;
}

/* H5 & 小程序 scroll-view 内部容器：允许水平滚动 */
:deep(.uni-scroll-view-content) {
  display: flex;
  flex-direction: row;
}

.tab-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 24rpx;
  height: 64rpx;
  border-radius: 32rpx;
  background: #F1F5F9;
  margin-right: 16rpx;
  vertical-align: middle;
}

.tab-active {
  background: var(--color-primary, #0D9488);
}

.tab-text {
  font-size: 26rpx;
  font-weight: 400;
  color: #64748B;
}

.tab-active .tab-text {
  color: #FFFFFF;
  font-weight: 500;
}

/* ── Content ── */
.content-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  padding: 24rpx 32rpx 120rpx;
}

.content-area > * {
  margin-bottom: 24rpx;
}

/* ── Transfer Card ── */
.transfer-card {
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 24rpx;
  padding: 48rpx 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(13, 148, 136, 0.04);
}

/* ── C2 概览卡 ── */
.overview-strip {
  display: flex;
  flex-direction: row;
  align-items: center;
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 24rpx;
  padding: 28rpx 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(13, 148, 136, 0.04);
  margin-bottom: 24rpx;
}

.overview-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 0 8rpx;
  transition: transform 0.15s ease;
}

.overview-item-clickable {
  cursor: pointer;
}

.overview-item-hover {
  transform: scale(0.97);
}

.overview-item-disabled {
  opacity: 0.5;
}

.overview-hint {
  font-size: 18rpx;
  color: var(--color-primary, #0D9488);
  margin-top: 2rpx;
  opacity: 0.7;
}

.overview-label {
  font-size: 22rpx;
  color: var(--color-text-secondary, #94A3B8);
  letter-spacing: 1rpx;
}

.overview-value {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--color-text-primary, #1E293B);
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
}

.overview-amount {
  font-size: 22rpx;
  color: var(--color-primary, #0D9488);
  font-weight: 600;
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
}

.overview-divider {
  width: 1rpx;
  height: 64rpx;
  background: var(--color-border-light, #F1F5F9);
  flex-shrink: 0;
}

.transfer-total-label {
  font-size: 26rpx;
  color: #94A3B8;
}

.transfer-total-value {
  font-size: 48rpx;
  font-weight: 700;
  color: var(--color-text-primary, #1E293B);
}

.transfer-count {
  font-size: 24rpx;
  color: #94A3B8;
}

/* ── Dropdown Overlay ── */
.dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 999;
}

.dropdown-spacer {
  height: 112rpx;
}

.dropdown-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  margin: 0 32rpx;
  padding: 8rpx 0;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
}

.dropdown-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 24rpx 40rpx;
  height: 88rpx;
  gap: 20rpx;
}

.dropdown-active {
  background: #F0FDFA;
  border-radius: 16rpx;
}

.dropdown-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 6rpx;
  background: var(--color-primary, #0D9488);
}

.dropdown-text {
  font-size: 30rpx;
  color: var(--color-text-primary, #1E293B);
}

.dropdown-active .dropdown-text {
  font-weight: 600;
  color: var(--color-primary, #0D9488);
}

/* ── 每日 TOP3 弹层 ── */
.day-popup-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.day-popup-card {
  width: 100%;
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 28rpx 28rpx 0 0;
  padding: 40rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
  animation: popupSlideUp 0.25s ease-out;
}

@keyframes popupSlideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.day-popup-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
  display: block;
  margin-bottom: 28rpx;
}

.day-popup-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #F1F5F9;
}

.day-popup-cat {
  font-size: 28rpx;
  color: var(--color-text-primary, #1E293B);
}

.day-popup-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4rpx;
}

.day-popup-amount {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}

.day-popup-remark {
  font-size: 22rpx;
  color: #94A3B8;
  max-width: 260rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.day-popup-empty {
  text-align: center;
  padding: 40rpx 0;
  font-size: 26rpx;
  color: #CBD5E1;
}

.day-popup-close {
  margin-top: 32rpx;
  padding: 20rpx 0;
  text-align: center;
  background: #F1F5F9;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: var(--color-text-primary, #1E293B);
}
</style>
