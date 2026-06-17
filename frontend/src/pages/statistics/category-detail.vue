<!--
  pages/statistics/category-detail.vue - 分类明细页
  从排行榜点击进入，展示该分类在指定月份的全部记录
  布局与 StatisticsRanking 的 ranking-row 一致，进度条下方增加日期
-->
<template>
  <view class="page">
    <!-- 固定区：头部 + 汇总卡片 -->
    <view class="sticky-header">
      <view class="header-bar">
        <view class="header-back" @tap="goBack">
          <view class="header-back-icon category-icon-svg category-icon-chevron-left"></view>
        </view>
        <view class="header-center">
          <text class="header-title">{{ categoryName }}</text>
        </view>
        <view class="header-spacer"></view>
      </view>
      <view class="summary-card">
        <text class="summary-label">{{ displayMonth }}{{ categoryName }}{{ typeLabel }}金额</text>
        <text class="summary-value">{{ prefix }}¥{{ formatAmount(totalAmount) }}</text>
        <text class="summary-count">共 {{ records.length }} 笔</text>
      </view>
    </view>

    <!-- 滚动区域容器 — 统一左右外边距 -->
    <view class="scroll-container">
      <!-- 记录列表 — 与 ranking-row 布局一致 -->
      <scroll-view v-if="records.length > 0" class="record-scroll" scroll-y>
        <view class="record-list">
          <view v-for="(rec, idx) in formattedRecords" :key="idx" class="ranking-row">
            <!-- 图标 -->
            <view class="ranking-icon-col">
              <view class="ranking-icon">
                <view v-if="iconClass" :class="['category-icon-svg', 'ranking-svg-icon', iconClass]"></view>
                <text v-else class="ranking-icon-emoji">{{ categoryName.charAt(0) }}</text>
              </view>
            </view>
            <!-- 右侧内容区 -->
            <view class="ranking-content">
              <view class="ranking-info">
                <text class="ranking-name">{{ rec.remark || categoryName }}</text>
                <text class="ranking-pct">{{ rec.percent }}%</text>
                <view class="ranking-amount-wrap">
                  <text class="ranking-amount">{{ prefix }}¥{{ formatAmount(rec.amount) }}</text>
                </view>
              </view>
              <view class="ranking-bar-bg">
                <view class="ranking-bar-fill" :style="{ width: rec.barWidth + '%' }"></view>
              </view>
              <text class="record-date">{{ formatFullDate(rec.date) }}</text>
            </view>
          </view>
        </view>
      </scroll-view>

      <!-- 空状态 -->
      <EmptyState
        v-else-if="!loading"
        type="no-record"
        title="该分类还没有记录"
        description="切换时段看看，或者去记一笔"
      />

      <!-- 加载态 -->
      <LoadingState v-if="loading" text="正在加载分类明细..." />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { recordApi } from '../../api/record'
import { formatCurrency } from '../../utils/format'
import { getCategoryIconClass } from '../../utils/category-icon-map'
import { navigateBack } from '../../utils/navigate'

const categoryName = ref('')
const typeId = ref(0)
const type = ref<'expense' | 'income' | 'transfer'>('expense')
const yearMonth = ref('')
const loading = ref(true)
const records = ref<any[]>([])

const totalAmount = computed(() => records.value.reduce((s, r) => s + Math.abs(r.amount), 0))

const iconClass = computed(() => {
  try { return getCategoryIconClass(categoryName.value) } catch { return '' }
})

const maxAmount = computed(() => Math.max(...records.value.map(r => Math.abs(r.amount)), 1))

const formattedRecords = computed(() =>
  records.value.map(r => {
    const amt = Math.abs(r.amount)
    return {
      ...r,
      percent: Math.round((amt / maxAmount.value) * 100),
      barWidth: Math.round((amt / maxAmount.value) * 100),
    }
  })
)

const typeLabel = computed(() => {
  if (type.value === 'expense') return '支出'
  if (type.value === 'income') return '收入'
  return '转账'
})

const prefix = computed(() => {
  if (type.value === 'expense') return '-'
  if (type.value === 'income') return '+'
  return ''
})

const displayMonth = computed(() => {
  const parts = yearMonth.value.split('-')
  if (parts.length === 2) return `${parts[0]}年${parseInt(parts[1])}月`
  return yearMonth.value
})

const formatAmount = (v: number) => formatCurrency(Math.abs(v))

const formatFullDate = (date: string) => {
  const parts = date.split('-')
  if (parts.length === 3) return `${parts[0]}年${parseInt(parts[1])}月${parseInt(parts[2])}日`
  return date
}

const goBack = () => {
  navigateBack()
}

const loadData = async () => {
  if (!yearMonth.value || !typeId.value) return
  loading.value = true
  try {
    const res = await recordApi.getRecordsByMonth(yearMonth.value, 1, 500)
    if (res.success && res.data) {
      records.value = res.data.list
        .filter((r: any) => {
          if (r.typeId !== typeId.value) return false
          if (type.value === 'transfer') return r.type === 'transfer' || r.type === 'repayment'
          return r.type === type.value
        })
        .sort((a: any, b: any) => b.date.localeCompare(a.date))
    }
  } finally {
    loading.value = false
  }
}

onLoad((options: any) => {
  if (options?.categoryName) categoryName.value = decodeURIComponent(options.categoryName)
  if (options?.typeId) typeId.value = parseInt(options.typeId, 10)
  if (options?.type) type.value = options.type
  if (options?.yearMonth) yearMonth.value = options.yearMonth
  loadData()
})
</script>

<style scoped>
.page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #F5F7FA;
}

/* 固定区：头部 + 汇总卡片 */
.sticky-header {
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

/* 头部 — 与统计页统一 */
.header-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: calc(env(safe-area-inset-top) + 20rpx) 16rpx 20rpx;
  background: linear-gradient(135deg, var(--color-primary, #0D9488), var(--color-primary-dark, #0B7A70));
}

.header-back {
  width: 64rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-back-icon {
  width: 48rpx;
  height: 48rpx;
  color: #FFFFFF;
}

.header-center {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}

.header-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #FFFFFF;
}

.header-spacer {
  width: 64rpx;
  height: 48rpx;
}

.summary-card {
  margin: 24rpx 24rpx 0;
  padding: 32rpx;
  background: #FFFFFF;
  border-radius: 24rpx 24rpx 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.summary-label {
  font-size: 24rpx;
  color: #94A3B8;
}

.summary-value {
  font-size: 48rpx;
  font-weight: 700;
  color: #1E293B;
}

.summary-count {
  font-size: 24rpx;
  color: #94A3B8;
}

/* 滚动区域外层容器 — 统一左右外边距 */
.scroll-container {
  flex: 1;
  padding: 16rpx 24rpx 24rpx;
  overflow: hidden;
}

.record-scroll {
  height: 100%;
}

.record-list {
  background: #FFFFFF;
  border-radius: 0 0 24rpx 24rpx;
  padding: 0 32rpx 32rpx;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* — 与 StatisticsRanking 一致的 ranking-row 布局 — */
.ranking-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
  height: 120rpx;
  border-bottom: 1px solid #F0F0F0;
  padding: 0 8rpx;
  transition: background 0.15s;
}

.ranking-row:last-child {
  border-bottom: none;
}

.ranking-row:active {
  background: #FAFAFA;
}

.ranking-icon-col {
  flex-shrink: 0;
  width: 72rpx;
}

.ranking-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 16rpx;
  background: var(--color-primary-bg, #E6F7F5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ranking-svg-icon {
  width: 48rpx;
  height: 48rpx;
}

.ranking-icon-emoji {
  font-size: 36rpx;
}

.ranking-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.ranking-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12rpx;
}

.ranking-name {
  font-size: 28rpx;
  color: var(--color-text-primary, #1E293B);
  max-width: 50%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ranking-pct {
  font-size: 26rpx;
  color: #94A3B8;
  width: 70rpx;
}

.ranking-amount-wrap {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.ranking-amount {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}

.ranking-bar-bg {
  width: 100%;
  height: 16rpx;
  background: #F1F5F9;
  border-radius: 8rpx;
  overflow: hidden;
}

.ranking-bar-fill {
  height: 100%;
  border-radius: 8rpx;
  background: var(--color-primary, #0D9488);
  transition: width 0.4s ease;
}

/* 日期 — 进度条下方 */
.record-date {
  font-size: 22rpx;
  color: var(--color-text-secondary, #94A3B8);
  line-height: 1;
}
</style>