<template>
  <view class="page">
    <view class="settings-header">
      <view class="header-back" @click="goBack">
        <view class="header-back-icon category-icon-svg category-icon-chevron-left"></view>
      </view>
      <text class="header-title">预算设置</text>
    </view>

    <scroll-view class="content" scroll-y>
      <!-- Loading 骨架 -->
      <view v-if="loading" class="loading-state">
        <view class="skeleton-card" v-for="i in 4" :key="i">
          <view class="skeleton-line w-60" />
          <view class="skeleton-line w-80" />
          <view class="skeleton-line w-40" />
        </view>
      </view>

      <template v-else>
        <!-- ===== 新手引导卡片（无预算时显示） ===== -->
        <view v-if="isNewUser" class="guide-card">
          <view class="guide-icon category-icon-svg category-icon-dengpao"></view>
          <text class="guide-title">设置预算，轻松掌控每月支出</text>
          <text class="guide-desc">输入月收入，系统自动帮你规划合理的年度预算</text>
          <view class="guide-input-row">
            <text class="guide-currency">¥</text>
            <input
              class="guide-input"
              type="digit"
              v-model="monthlyIncomeInput"
              placeholder="输入月收入"
            />
          </view>
          <view v-if="suggestedAnnual > 0" class="guide-suggestion">
            <view class="guide-suggestion-inner">
              <text class="guide-suggestion-title">建议年度总预算</text>
              <text class="guide-suggestion-amount">¥{{ formatAmount(suggestedAnnual) }}</text>
              <text class="guide-suggestion-hint">= 月收入 × 12 × 70%</text>
            </view>
          </view>
          <view class="guide-actions">
            <view class="btn-primary" @tap="applyQuickCreate">一键创建预算</view>
            <view class="btn-link" @tap="isNewUser = false">手动设置</view>
          </view>
        </view>

        <!-- ===== 正式设置内容（有预算后显示） ===== -->
        <template v-if="!isNewUser">
          <!-- 年度预算 -->
          <view class="section-label">
            <view class="section-icon category-icon-svg category-icon-tongji"></view>
            <text>年度预算（{{ currentYear }}年）</text>
          </view>

          <!-- 年度总预算 -->
          <view class="card">
            <view class="card-header">
              <text class="card-title">年度总预算</text>
              <view class="badge-soft">软参考</view>
            </view>
            <view class="budget-input-row">
              <text class="currency">¥</text>
              <input
                class="budget-input"
                type="digit"
                v-model="annualTotalInput"
                placeholder="输入年度总支出预算"
                @blur="saveAnnualTotal"
              />
            </view>
            <view class="budget-progress-wrap" v-if="annualTotalSpent > 0">
              <BudgetBar
                :spent="annualTotalSpent"
                :amount="annualTotal"
                :alert-threshold="alertThreshold"
                show-label
              />
              <text class="progress-meta">已用 ¥{{ formatAmount(annualTotalSpent) }} / ¥{{ formatAmount(annualTotal) }}</text>
            </view>
            <view class="meta-row">
              <view class="meta-item">
                <text class="meta-label">月均预算</text>
                <text class="meta-value">¥{{ formatAmount(annualTotalMonthly) }}</text>
              </view>
              <view class="meta-divider" />
              <view class="meta-item">
                <text class="meta-label">预警阈值</text>
                <view class="threshold-input-wrap">
                  <input
                    class="threshold-input"
                    type="number"
                    :max="100"
                    :min="50"
                    :value="String(alertThreshold)"
                    @blur="(e: any) => saveAlertThreshold(parseInt(e.detail.value) || 80)"
                  />
                  <text class="threshold-suffix">%</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 分类预算 -->
          <view class="card">
            <view class="card-header">
              <text class="card-title">分类预算</text>
              <view class="btn-add" @tap="showCategoryPicker = true">
                <text class="btn-add-icon">+</text>
                <text>添加分类</text>
              </view>
            </view>

            <view v-if="categoryBudgets.length === 0" class="empty-state">
              <view class="empty-icon category-icon-svg category-icon-zhangdan"></view>
              <text class="empty-text">还没有分类预算</text>
              <text class="empty-hint">点击"添加分类"选择支出分类开始管理</text>
            </view>

            <view v-if="categoryBudgets.length > 0" class="category-summary-bar">
              <text class="summary-text">合计 ¥{{ formatAmount(categoryTotalYearly) }} / 年</text>
              <text v-if="categoryTotalYearly > annualTotal" class="summary-warn">
                超出总预算 ¥{{ formatAmount(categoryTotalYearly - annualTotal) }}
              </text>
            </view>

            <view v-for="item in categoryBudgets" :key="item.typeId" class="category-card">
              <view class="category-main-row">
                <view class="category-info">
                  <view class="category-icon-text category-icon-svg" :class="getCategoryIcon(item.typeId)"></view>
                  <view class="category-name-block">
                    <text class="category-name">{{ item.name }}</text>
                    <text class="category-meta">年 ¥{{ formatAmount(item.yearlyAmount) }} · 月 ¥{{ formatAmount(item.yearlyAmount / 12) }}</text>
                  </view>
                </view>
                <view class="category-actions">
                  <view class="category-input-wrap">
                    <text class="currency-xs">¥</text>
                    <input
                      class="category-input"
                      type="digit"
                      :value="String(item.yearlyAmount)"
                      @blur="(e: any) => updateCategoryYearly(item.typeId, parseFloat(e.detail.value) || 0)"
                      placeholder="年度金额"
                    />
                  </view>
                  <text class="delete-btn" @tap="removeCategoryBudget(item.typeId)">🗑</text>
                </view>
              </view>
              <view class="category-progress-row" v-if="item.spent > 0">
                <BudgetBar
                  :spent="item.spent"
                  :amount="item.yearlyAmount"
                  :alert-threshold="item.alertThreshold || 80"
                  show-label
                />
              </view>
            </view>
          </view>

          <!-- 当月微调 -->
          <view v-if="monthlyCategoryItems.length > 0" class="section-label">
            <text class="section-icon">🔧</text>
            <text>当月微调（{{ currentMonth }}月）</text>
          </view>

          <view v-if="monthlyCategoryItems.length > 0" class="card">
            <view class="card-tip">
              <view class="category-icon-svg card-tip-icon category-icon-dengpao"></view>
              <text>微调仅影响当月，不影响其他月份。恢复默认将沿用年度预算拆分的月均金额。</text>
            </view>
            <view v-for="item in monthlyCategoryItems" :key="'m-' + item.typeId" class="tune-row">
              <view class="tune-left">
                <text class="tune-name">{{ item.name }}</text>
                <text class="tune-default">默认 ¥{{ formatAmount(item.defaultAmount) }}</text>
              </view>
              <view class="tune-input-wrap" :class="{ 'is-tuned': item.currentAmount !== item.defaultAmount }">
                <text class="currency-sm">¥</text>
                <input
                  class="tune-input"
                  type="digit"
                  :value="String(item.currentAmount)"
                  @blur="(e: any) => updateMonthlyCategory(item.typeId, parseFloat(e.detail.value) || 0)"
                />
              </view>
            </view>
          </view>
        </template>
      </template>

      <view class="bottom-spacer" />
    </scroll-view>

    <!-- 分类选择底部弹窗 -->
    <view v-if="showCategoryPicker" class="picker-overlay" @tap="showCategoryPicker = false">
      <view class="picker-panel" @tap.stop>
        <view class="picker-header">
          <text class="picker-title">选择支出分类</text>
          <text class="picker-close" @tap="showCategoryPicker = false">✕</text>
        </view>
        <scroll-view class="picker-list" scroll-y>
          <view
            v-for="cat in availableCategories"
            :key="cat.id"
            class="picker-item"
            @tap="addCategoryBudget(cat)"
          >
            <view class="picker-item-icon category-icon-svg" :class="getCategoryIcon(cat.id)"></view>
            <view class="picker-item-info">
              <text class="picker-item-name">{{ cat.name }}</text>
              <text class="picker-item-group">{{ cat.groupName }}</text>
            </view>
            <text class="picker-item-arrow">+</text>
          </view>
          <view v-if="availableCategories.length === 0" class="picker-empty">
            <view class="picker-empty-icon category-icon-svg category-icon-duigou"></view>
            <text>所有支出分类均已添加预算</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { budgetApi, type AnnualBudgetItem } from '../../../api/budget'
import { categoryApi, type UserCategory } from '../../../api/category'
import BudgetBar from '../../../components/BudgetBar.vue'
import { getCategoryIconClass } from '../../../utils/category-icon-map'

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

const loading = ref(true)
const isNewUser = ref(false)
const annualTotalInput = ref('')
const monthlyTotalInput = ref('')
const monthlyIncomeInput = ref('')
const showCategoryPicker = ref(false)
const alertThreshold = ref(80)
const annualTotalSpent = ref(0)

interface CategoryBudgetItem {
  typeId: number
  name: string
  yearlyAmount: number
  spent: number
  alertThreshold?: number
}

const categoryBudgets = ref<CategoryBudgetItem[]>([])
const expenseCategories = ref<(UserCategory & { groupName?: string })[]>([])

interface MonthlyCategoryItem {
  typeId: number
  name: string
  defaultAmount: number
  currentAmount: number
  budgetId: number | null
}

const monthlyCategoryItems = ref<MonthlyCategoryItem[]>([])
let annualSummaryData: { items: AnnualBudgetItem[] } | null = null

const annualTotal = computed(() => parseFloat(annualTotalInput.value) || 0)
const annualTotalMonthly = computed(() => {
  if (annualTotal.value <= 0) return 0
  return Math.round((annualTotal.value / 12) * 100) / 100
})
const categoryTotalYearly = computed(() =>
  categoryBudgets.value.reduce((s, b) => s + (b.yearlyAmount || 0), 0)
)
const suggestedAnnual = computed(() => {
  const income = parseFloat(monthlyIncomeInput.value)
  if (isNaN(income) || income <= 0) return 0
  return Math.round(income * 12 * 0.7)
})

const availableCategories = computed(() => {
  const addedIds = new Set(categoryBudgets.value.map((b) => b.typeId))
  return expenseCategories.value.filter((c) => !addedIds.has(c.id) && c.isEnabled !== false)
})

const goBack = () => uni.navigateBack()

const formatAmount = (val: number) => {
  if (val === undefined || val === null || isNaN(val)) return '0'
  return Math.abs(val).toLocaleString('zh-CN', { maximumFractionDigits: 0 })
}

function getCategoryIcon(typeId: number): string {
  const cat = expenseCategories.value.find((c) => c.id === typeId)
  if (!cat) return 'category-icon-qita'
  return getCategoryIconClass(cat.name)
}

async function loadData() {
  loading.value = true
  try {
    const [summaryRes, catRes] = await Promise.all([
      budgetApi.getAnnualSummary(currentYear),
      categoryApi.getUserCategories('expense'),
    ])
    if (catRes.success && catRes.data) {
      const allCats: (UserCategory & { groupName?: string })[] = []
      for (const group of catRes.data) {
        if (group.children) {
          for (const child of group.children) {
            allCats.push({ ...(child as any), groupName: group.name })
          }
        }
      }
      expenseCategories.value = allCats
    }
    if (summaryRes.success && summaryRes.data) {
      const hasItems = summaryRes.data.items && summaryRes.data.items.length > 0
      if (hasItems) {
        isNewUser.value = false
        populateFromSummary(summaryRes.data.items)
      } else {
        isNewUser.value = true
      }
    } else {
      isNewUser.value = true
    }
  } catch {
    isNewUser.value = true
  } finally {
    loading.value = false
  }
}

function populateFromSummary(items: AnnualBudgetItem[]) {
  annualSummaryData = { items }
  categoryBudgets.value = []
  monthlyCategoryItems.value = []
  let totalSpent = 0
  let hasTotal = false

  for (const item of items) {
    if (item.typeId === null) {
      annualTotalInput.value = String(item.yearlyAmount)
      totalSpent = item.totalSpent || 0
      hasTotal = true
      const cur = item.months.find((m) => m.month === currentMonth)
      monthlyTotalInput.value = String(cur ? cur.amount : Math.round(item.yearlyAmount / 12))
    } else {
      const cat = expenseCategories.value.find((c) => c.id === item.typeId)
      categoryBudgets.value.push({
        typeId: item.typeId,
        name: cat?.name || `分类${item.typeId}`,
        yearlyAmount: item.yearlyAmount,
        spent: item.totalSpent || 0,
        alertThreshold: 80,
      })
      const cur = item.months.find((m) => m.month === currentMonth)
      monthlyCategoryItems.value.push({
        typeId: item.typeId,
        name: cat?.name || `分类${item.typeId}`,
        defaultAmount: item.monthlyAmount,
        currentAmount: cur ? cur.amount : item.monthlyAmount,
        budgetId: cur ? cur.budgetId : null,
      })
    }
  }
  annualTotalSpent.value = totalSpent
  if (!hasTotal) monthlyTotalInput.value = String(annualTotalMonthly.value)
}

async function saveAnnualTotal() {
  const amt = parseFloat(annualTotalInput.value)
  if (isNaN(amt) || amt <= 0) return
  try {
    const exists = annualSummaryData?.items?.some((i) => i.typeId === null)
    if (!exists) {
      await budgetApi.createYearlyBatch({ year: currentYear, budgets: [{ yearlyAmount: amt, alertThreshold: alertThreshold.value }] })
      uni.showToast({ title: '年度总预算已创建', icon: 'success' })
      await loadData()
    } else {
      const e = await findExistingTotal()
      if (e) await budgetApi.updateBudget(e.id, { amount: Math.round((amt / 12) * 100) / 100, alertThreshold: alertThreshold.value })
      uni.showToast({ title: '已保存', icon: 'success' })
    }
    monthlyTotalInput.value = String(Math.round(amt / 12))
  } catch { uni.showToast({ title: '保存失败', icon: 'none' }) }
}

async function saveAlertThreshold(v: number) {
  alertThreshold.value = v
  const e = await findExistingTotal()
  if (e) {
    try { await budgetApi.updateBudget(e.id, { alertThreshold: v }) } catch { /* ignore */ }
  }
}

function addCategoryBudget(cat: UserCategory & { groupName?: string }) {
  showCategoryPicker.value = false
  categoryBudgets.value.push({ typeId: cat.id, name: cat.name, yearlyAmount: 0, spent: 0, alertThreshold: 80 })
  monthlyCategoryItems.value.push({ typeId: cat.id, name: cat.name, defaultAmount: 0, currentAmount: 0, budgetId: null })
}

async function updateCategoryYearly(typeId: number, yearlyAmount: number) {
  const item = categoryBudgets.value.find((b) => b.typeId === typeId)
  if (!item || isNaN(yearlyAmount) || yearlyAmount < 0) return
  item.yearlyAmount = yearlyAmount
  const ma = Math.round((yearlyAmount / 12) * 100) / 100
  const mi = monthlyCategoryItems.value.find((m) => m.typeId === typeId)
  if (mi) { mi.defaultAmount = ma; if (mi.currentAmount === 0 || mi.currentAmount === mi.defaultAmount) mi.currentAmount = ma }
  if (yearlyAmount <= 0) {
    uni.showToast({ title: '请输入有效金额', icon: 'none' })
    return
  }
  try {
    const exists = annualSummaryData?.items?.some((i) => i.typeId === typeId)
    if (!exists) {
      await budgetApi.createYearlyBatch({ year: currentYear, budgets: [{ typeId, yearlyAmount, alertThreshold: item.alertThreshold || 80 }] })
      uni.showToast({ title: '分类预算已创建（12个月）', icon: 'success' })
    } else if (mi?.budgetId) {
      await budgetApi.updateBudget(mi.budgetId, { amount: ma })
      uni.showToast({ title: '已保存', icon: 'success' })
    }
    await loadData()
  } catch { uni.showToast({ title: '保存失败', icon: 'none' }) }
}

async function updateMonthlyCategory(typeId: number, amt: number) {
  const item = monthlyCategoryItems.value.find((m) => m.typeId === typeId)
  if (!item || isNaN(amt) || amt <= 0) return
  item.currentAmount = amt
  try {
    if (item.budgetId) {
      await budgetApi.updateBudget(item.budgetId, { amount: amt })
    } else {
      const cat = expenseCategories.value.find((c) => c.id === typeId)
      const res = await budgetApi.createBudget({ name: cat?.name || '分类预算', typeId, year: currentYear, month: currentMonth, amount: amt })
      if (res.success && res.data) item.budgetId = res.data.id
    }
    uni.showToast({ title: '当月预算已调整', icon: 'success' })
  } catch { uni.showToast({ title: '调整失败', icon: 'none' }) }
}

async function removeCategoryBudget(typeId: number) {
  const item = categoryBudgets.value.find((b) => b.typeId === typeId)
  if (!item) return
  uni.showModal({
    title: '删除预算',
    content: `确定删除「${item.name}」的预算设置吗？已有花费数据将保留。`,
    confirmColor: '#FA3534',
    success: async (res) => {
      if (!res.confirm) return
      categoryBudgets.value = categoryBudgets.value.filter((b) => b.typeId !== typeId)
      const mi = monthlyCategoryItems.value.find((m) => m.typeId === typeId)
      monthlyCategoryItems.value = monthlyCategoryItems.value.filter((m) => m.typeId !== typeId)
      if (mi?.budgetId) {
        try { await budgetApi.deleteBudget(mi.budgetId) } catch { /* ignore */ }
      }
      await loadData()
      uni.showToast({ title: '已删除', icon: 'success' })
    },
  })
}

async function findExistingTotal() {
  try {
    const res = await budgetApi.getBudgets(currentYear, currentMonth)
    if (res.success && res.data) return res.data.budgets.find((b) => b.typeId === null) || null
  } catch { /* ignore */ }
  return null
}

async function applyQuickCreate() {
  if (suggestedAnnual.value <= 0) {
    uni.showToast({ title: '请先输入月收入', icon: 'none' })
    return
  }
  try {
    await budgetApi.createYearlyBatch({
      year: currentYear,
      budgets: [{ yearlyAmount: suggestedAnnual.value, alertThreshold: 80 }],
    })
    uni.showToast({ title: '预算已创建！', icon: 'success' })
    isNewUser.value = false
    await loadData()
  } catch {
    uni.showToast({ title: '创建失败，请重试', icon: 'none' })
  }
}

onMounted(async () => {
  try { await budgetApi.copyMonth(currentYear, currentMonth) } catch { /* ignore */ }
  await loadData()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg-page, #F5F7FA);
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(env(safe-area-inset-top) + 20rpx) 30rpx 20rpx;
  background: linear-gradient(135deg, var(--color-primary, #00BFFF) 0%, var(--color-primary-dark, #0099CC) 100%);
  flex-shrink: 0;
  position: relative;
}

.header-back {
  position: absolute;
  left: 20rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-back-icon {
  width: 40rpx;
  height: 40rpx;
  color: #fff;
}

.header-title {
  font-size: var(--text-nav);
  font-weight: 600;
  color: #fff;
}

.content {
  padding: 16rpx 24rpx;
}

.bottom-spacer {
  height: 60rpx;
}

/* ===== Loading 骨架 ===== */
.loading-state {
  padding: 20rpx 0;
}
.skeleton-card {
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}
.skeleton-line {
  height: 32rpx;
  background: linear-gradient(90deg, var(--color-border, #E2E8F0) 25%, var(--color-border-light, #F1F5F9) 50%, var(--color-border, #E2E8F0) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8rpx;
  margin-bottom: 16rpx;
}
.skeleton-line:last-child { margin-bottom: 0; }
.w-60 { width: 60%; }
.w-80 { width: 80%; }
.w-40 { width: 40%; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ===== 新手引导卡片 ===== */
.guide-card {
  background: linear-gradient(135deg, var(--color-primary, #0D9488) 0%, var(--color-primary-dark, #0B7A70) 100%);
  border-radius: 20rpx;
  padding: 44rpx 32rpx;
  margin-bottom: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.guide-icon {
  width: 56rpx;
  height: 56rpx;
  margin-bottom: 16rpx;
}
.guide-title {
  font-size: var(--text-nav);
  font-weight: 700;
  color: var(--color-text-inverse, #FFFFFF);
  text-align: center;
  margin-bottom: 12rpx;
}
.guide-desc {
  font-size: var(--text-small);
  color: rgba(255, 255, 255, 0.85);
  text-align: center;
  margin-bottom: 28rpx;
  line-height: 1.6;
}
.guide-input-row {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
  width: 100%;
  margin-bottom: 20rpx;
}
.guide-currency {
  font-size: var(--text-number);
  font-weight: 700;
  color: var(--color-text-inverse, #FFFFFF);
  margin-right: 12rpx;
}
.guide-input {
  flex: 1;
  font-size: var(--text-number);
  font-weight: 700;
  color: var(--color-text-inverse, #FFFFFF);
  height: 56rpx;
}
.guide-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
  font-size: var(--text-title);
  font-weight: 400;
}
.guide-suggestion {
  width: 100%;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}
.guide-suggestion-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.guide-suggestion-title {
  font-size: var(--text-small);
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8rpx;
}
.guide-suggestion-amount {
  font-size: var(--text-number-lg);
  font-weight: 800;
  color: var(--color-warning, #F59E0B);
  margin-bottom: 6rpx;
}
.guide-suggestion-hint {
  font-size: var(--text-note);
  color: rgba(255, 255, 255, 0.65);
}
.guide-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}
.btn-primary {
  width: 100%;
  background: var(--color-text-inverse, #FFFFFF);
  color: var(--color-primary, #0D9488);
  font-size: var(--text-body);
  font-weight: 700;
  text-align: center;
  padding: 20rpx 0;
  border-radius: 12rpx;
}
.btn-primary:active {
  transform: scale(0.98);
}
.btn-link {
  font-size: var(--text-small);
  color: rgba(255, 255, 255, 0.8);
  padding: 8rpx 0;
}

/* ===== 区块标题 ===== */
.section-label {
  display: flex;
  align-items: center;
  font-size: var(--text-body);
  font-weight: 700;
  color: var(--color-text-primary, #1E293B);
  padding: 36rpx 0 16rpx 8rpx;
}
.section-icon {
  width: 28rpx;
  height: 28rpx;
  margin-right: 10rpx;
}

/* ===== 卡片 ===== */
.card {
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}
.card-title {
  font-size: var(--text-body);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}
.card-tip {
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
  background: var(--color-border-light, #F1F5F9);
  border-radius: 10rpx;
  padding: 16rpx 20rpx;
  margin-bottom: 20rpx;
  font-size: var(--text-note);
  color: var(--color-text-secondary, #94A3B8);
  line-height: 1.6;
}

.card-tip-icon {
  width: 28rpx;
  height: 28rpx;
  flex-shrink: 0;
  margin-top: 2rpx;
}
.badge-soft {
  font-size: var(--text-caption);
  color: var(--color-text-secondary, #94A3B8);
  background: var(--color-border, #E2E8F0);
  padding: 4rpx 14rpx;
  border-radius: 20rpx;
}

/* ===== 预算输入行 ===== */
.budget-input-row {
  display: flex;
  align-items: center;
  border-bottom: 2rpx solid var(--color-border, #E2E8F0);
  padding-bottom: 8rpx;
  transition: border-color 0.2s;
}
.budget-input-row:focus-within {
  border-color: var(--color-primary, #0D9488);
}
.currency {
  font-size: var(--text-title);
  font-weight: 700;
  color: var(--color-text-primary, #1E293B);
  margin-right: 8rpx;
}
.currency-sm {
  font-size: var(--text-small);
  font-weight: 600;
  color: var(--color-text-secondary, #94A3B8);
  margin-right: 4rpx;
}
.currency-xs {
  font-size: var(--text-note);
  font-weight: 600;
  color: var(--color-text-secondary, #94A3B8);
  margin-right: 2rpx;
}
.budget-input {
  flex: 1;
  font-size: var(--text-title);
  height: 56rpx;
}

/* ===== 进度条区域 ===== */
.budget-progress-wrap {
  margin-top: 16rpx;
  padding-top: 12rpx;
}
.progress-meta {
  display: block;
  font-size: var(--text-caption);
  color: var(--color-text-secondary, #94A3B8);
  margin-top: 6rpx;
}

/* ===== 元信息行 ===== */
.meta-row {
  display: flex;
  align-items: center;
  margin-top: 16rpx;
}
.meta-item {
  display: flex;
  align-items: center;
}
.meta-label {
  font-size: var(--text-note);
  color: var(--color-text-secondary, #94A3B8);
  margin-right: 8rpx;
}
.meta-value {
  font-size: var(--text-small);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}
.meta-divider {
  width: 1rpx;
  height: 24rpx;
  background: var(--color-border, #E2E8F0);
  margin: 0 24rpx;
}
.threshold-input-wrap {
  display: flex;
  align-items: center;
  background: var(--color-primary-light, #E6F7F5);
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
}
.threshold-input {
  width: 56rpx;
  height: 40rpx;
  font-size: var(--text-note);
  color: var(--color-primary, #0D9488);
  font-weight: 600;
  text-align: center;
}
.threshold-suffix {
  font-size: var(--text-caption);
  color: var(--color-primary, #0D9488);
}

/* ===== 添加按钮 ===== */
.btn-add {
  display: flex;
  align-items: center;
  gap: 4rpx;
  font-size: var(--text-small);
  color: var(--color-primary, #0D9488);
  padding: 8rpx 20rpx;
  border: 1rpx solid var(--color-primary, #0D9488);
  border-radius: 20rpx;
}
.btn-add-icon {
  font-size: var(--text-body);
  font-weight: 700;
}
.btn-add:active {
  background: var(--color-primary-light, #E6F7F5);
}

/* ===== 空状态 ===== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 0;
}
.empty-icon {
  width: 48rpx;
  height: 48rpx;
  margin-bottom: 12rpx;
}
.empty-text {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
  margin-bottom: 6rpx;
}
.empty-hint {
  font-size: var(--text-note);
  color: var(--color-text-secondary, #94A3B8);
}

/* ===== 分类汇总条 ===== */
.category-summary-bar {
  background: var(--color-primary-light, #E6F7F5);
  border-radius: 10rpx;
  padding: 14rpx 18rpx;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.summary-text {
  font-size: var(--text-small);
  color: var(--color-primary-dark, #0B7A70);
  font-weight: 600;
}
.summary-warn {
  font-size: var(--text-note);
  color: var(--color-danger, #EF4444);
}

/* ===== 分类卡片 ===== */
.category-card {
  border: 1rpx solid var(--color-border, #E2E8F0);
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 14rpx;
  transition: border-color 0.2s;
}
.category-card:last-child { margin-bottom: 0; }
.category-main-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.category-info {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}
.category-icon-text {
  font-size: var(--text-title);
  color: var(--color-primary, #0D9488);
  margin-right: 14rpx;
  flex-shrink: 0;
}
.category-name-block {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.category-name {
  font-size: var(--text-body);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}
.category-meta {
  font-size: var(--text-caption);
  color: var(--color-text-secondary, #94A3B8);
  margin-top: 2rpx;
}
.category-actions {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-shrink: 0;
}
.category-input-wrap {
  display: flex;
  align-items: center;
  background: var(--color-border-light, #F1F5F9);
  border-radius: 8rpx;
  padding: 6rpx 12rpx;
}
.category-input-wrap:focus-within {
  box-shadow: 0 0 0 2rpx var(--color-primary-light, #E6F7F5);
}
.category-input {
  width: 120rpx;
  font-size: var(--text-small);
  height: 44rpx;
}
.delete-btn {
  font-size: var(--text-body);
  padding: 8rpx;
  opacity: 0.5;
}
.delete-btn:active {
  opacity: 1;
}
.category-progress-row {
  margin-top: 14rpx;
  padding-top: 14rpx;
  border-top: 1rpx solid var(--color-border, #E2E8F0);
}

/* ===== 月度微调行 ===== */
.tune-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18rpx 0;
  border-bottom: 1rpx solid var(--color-border, #E2E8F0);
}
.tune-row:last-child { border-bottom: none; }
.tune-left {
  display: flex;
  flex-direction: column;
}
.tune-name {
  font-size: var(--text-body);
  color: var(--color-text-primary, #1E293B);
  font-weight: 500;
}
.tune-default {
  font-size: var(--text-caption);
  color: var(--color-text-secondary, #94A3B8);
  margin-top: 4rpx;
}
.tune-input-wrap {
  display: flex;
  align-items: center;
  background: var(--color-border-light, #F1F5F9);
  border-radius: 8rpx;
  padding: 6rpx 12rpx;
  transition: all 0.2s;
}
.tune-input-wrap.is-tuned {
  background: var(--color-warning-light, #FFF7ED);
  box-shadow: 0 0 0 2rpx var(--color-warning, #F59E0B);
}
.tune-input-wrap:focus-within {
  box-shadow: 0 0 0 2rpx var(--color-primary-light, #E6F7F5);
}
.tune-input {
  width: 120rpx;
  font-size: var(--text-body);
  font-weight: 600;
  height: 44rpx;
}

/* ===== 分类选择弹窗 ===== */
.picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}
.picker-panel {
  width: 100%;
  max-height: 60vh;
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 24rpx 24rpx 0 0;
  display: flex;
  flex-direction: column;
}
.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid var(--color-border, #E2E8F0);
  flex-shrink: 0;
}
.picker-title {
  font-size: var(--text-body);
  font-weight: 700;
  color: var(--color-text-primary, #1E293B);
}
.picker-close {
  font-size: var(--text-title);
  color: var(--color-text-secondary, #94A3B8);
  padding: 8rpx;
}
.picker-list {
  flex: 1;
  overflow-y: auto;
  padding: 8rpx 0 0;
}
.picker-item {
  display: flex;
  align-items: center;
  padding: 20rpx 32rpx;
  border-bottom: 1rpx solid var(--color-border, #E2E8F0);
}
.picker-item:active {
  background: var(--color-primary-light, #E6F7F5);
}
.picker-item-icon {
  font-size: var(--text-number);
  color: var(--color-primary, #0D9488);
  margin-right: 18rpx;
  width: 48rpx;
  text-align: center;
}
.picker-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.picker-item-name {
  font-size: var(--text-body);
  color: var(--color-text-primary, #1E293B);
  font-weight: 500;
}
.picker-item-group {
  font-size: var(--text-caption);
  color: var(--color-text-secondary, #94A3B8);
  margin-top: 2rpx;
}
.picker-item-arrow {
  font-size: var(--text-title);
  color: var(--color-primary, #0D9488);
  font-weight: 700;
  padding: 4rpx 8rpx;
}
.picker-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
  color: var(--color-text-secondary, #94A3B8);
  font-size: var(--text-small);
}
.picker-empty-icon {
  width: 48rpx;
  height: 48rpx;
  margin-bottom: 12rpx;
}
</style>
