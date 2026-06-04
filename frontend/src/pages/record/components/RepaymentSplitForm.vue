<template>
  <view class="repayment-split-form">
    <view class="split-card">
      <view class="split-header">
        <text class="split-title">本金利息拆分</text>
        <text class="split-hint">本金 + 利息 = 还款总额</text>
      </view>

      <view class="amount-block">
        <view class="amount-row">
          <view class="amount-side">
            <text class="amount-label">本金</text>
            <view class="amount-value">
              <text class="amount-currency">¥</text>
              <input
                class="amount-input"
                type="digit"
                :value="formattedPrincipal"
                placeholder="0.00"
                @input="onPrincipalInput"
              />
            </view>
          </view>
          <view class="amount-divider"></view>
          <view class="amount-side">
            <text class="amount-label">利息</text>
            <view class="amount-value">
              <text class="amount-currency">¥</text>
              <input
                class="amount-input"
                type="digit"
                :value="formattedInterest"
                placeholder="0.00"
                @input="onInterestInput"
              />
            </view>
          </view>
        </view>

        <view class="amount-summary">
          <text class="summary-label">合计</text>
          <text class="summary-value">¥{{ formattedTotal }}</text>
        </view>
      </view>

      <view class="category-picker" :class="{ open: showCategoryGrid }" @tap="toggleCategoryGrid">
        <view class="picker-left">
          <view class="picker-icon-wrap">
            <view v-if="isLoading" class="picker-loading"></view>
            <view v-else-if="selectedCategory" class="category-icon-svg picker-icon" :class="getIconClass(selectedCategory.name)"></view>
            <view v-else class="category-icon-svg picker-icon picker-icon-empty"></view>
          </view>
          <view class="picker-text">
            <text class="picker-label">利息分类</text>
            <text v-if="isLoading" class="picker-value-text muted">加载中...</text>
            <text v-else-if="selectedCategory" class="picker-value-text">{{ selectedCategory.name }}</text>
            <text v-else class="picker-value-text muted">请选择分类</text>
          </view>
        </view>
        <view class="picker-chevron" :class="{ rotated: showCategoryGrid }">
          <text>⌄</text>
        </view>
      </view>

      <view class="category-panel" :class="{ expanded: showCategoryGrid }">
        <view v-if="categoryGroups.length === 0 && !isLoading" class="empty-state">
          <text class="empty-text">暂无分类</text>
        </view>
        <view v-for="group in categoryGroups" :key="group.id" class="grid-group">
          <view class="grid-group-header">
            <text class="grid-group-name">{{ group.name }}</text>
            <view class="grid-group-line"></view>
          </view>
          <view class="grid-items">
            <view
              v-for="cat in group.children"
              :key="cat.id"
              class="grid-item"
              :class="{ active: selectedCategory?.id === cat.id }"
              @tap.stop="selectCategory(cat)"
            >
              <view class="grid-item-icon-wrap">
                <view class="category-icon-svg grid-item-icon" :class="getIconClass(cat.name)"></view>
                <view v-if="selectedCategory?.id === cat.id" class="grid-item-check">
                  <text>✓</text>
                </view>
              </view>
              <text class="grid-item-name" :class="{ active: selectedCategory?.id === cat.id }">{{ cat.name }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { categoryApi, type CategoryGroup, type CategoryItem } from '../../../api/category'
import { getCategoryIconClass } from '../../../utils/category-icon-map'

const props = defineProps<{
  totalAmount: number
  loanAccount?: {
    originalPrincipal?: number
    annualInterestRate?: number
    repaymentMethod?: string
    remainingMonths?: number
  }
}>()

const emit = defineEmits<{
  (e: 'update:principal', value: number): void
  (e: 'update:interest', value: number): void
  (e: 'update:interestTypeId', value: number): void
}>()

const principal = ref(0)
const interest = ref(0)
const selectedCategory = ref<CategoryItem | null>(null)
const categoryGroups = ref<CategoryGroup[]>([])
const isLoading = ref(true)
const showCategoryGrid = ref(false)

const formattedPrincipal = computed(() => {
  return principal.value > 0 ? principal.value.toFixed(2) : ''
})

const formattedInterest = computed(() => {
  return interest.value > 0 ? interest.value.toFixed(2) : ''
})

const formattedTotal = computed(() => {
  const t = props.totalAmount || 0
  return t.toFixed(2)
})

const calculateAutoPrincipal = (): number => {
  const { loanAccount, totalAmount } = props
  if (loanAccount && loanAccount.annualInterestRate) {
    const monthlyRate = loanAccount.annualInterestRate / 100 / 12
    let calculatedInterest = totalAmount * monthlyRate
    calculatedInterest = Math.max(0, Math.min(totalAmount, calculatedInterest))
    return Math.round((totalAmount - calculatedInterest) * 100) / 100
  }
  return Math.round(totalAmount * 100) / 100
}

const calculateAutoInterest = (): number => {
  const { loanAccount, totalAmount } = props
  if (loanAccount && loanAccount.annualInterestRate) {
    const monthlyRate = loanAccount.annualInterestRate / 100 / 12
    let calculatedInterest = totalAmount * monthlyRate
    calculatedInterest = Math.max(0, Math.min(totalAmount, calculatedInterest))
    return Math.round(calculatedInterest * 100) / 100
  }
  return 0
}

const onPrincipalInput = (e: any) => {
  const value = parseFloat(e.detail.value) || 0
  const newPrincipal = Math.max(0, Math.min(props.totalAmount, value))
  principal.value = Math.round(newPrincipal * 100) / 100
  interest.value = Math.max(0, Math.round((props.totalAmount - principal.value) * 100) / 100)
  emitValues()
}

const onInterestInput = (e: any) => {
  const value = parseFloat(e.detail.value) || 0
  const newInterest = Math.max(0, Math.min(props.totalAmount, value))
  interest.value = Math.round(newInterest * 100) / 100
  principal.value = Math.max(0, Math.round((props.totalAmount - interest.value) * 100) / 100)
  emitValues()
}

const emitValues = () => {
  emit('update:principal', principal.value)
  emit('update:interest', interest.value)
}

const loadCategories = async () => {
  isLoading.value = true
  try {
    const res = await categoryApi.getUserCategories('expense')
    if (res.success && res.data) {
      categoryGroups.value = res.data

      const allCategories: CategoryItem[] = []
      for (const group of res.data) {
        allCategories.push(...group.children)
      }

      // 默认选择「利息支出」分类（系统默认不可删除的支出分类）
      let interestCategory = allCategories.find(cat => cat.name === '利息支出')
      if (!interestCategory && allCategories.length > 0) {
        interestCategory = allCategories[0]
      }

      if (interestCategory) {
        selectedCategory.value = interestCategory
        emit('update:interestTypeId', interestCategory.id)
      }
    }
  } catch (error) {
    console.error('[RepaymentSplitForm] 加载分类失败:', error)
  } finally {
    isLoading.value = false
  }
}

const toggleCategoryGrid = () => {
  if (isLoading.value) return
  showCategoryGrid.value = !showCategoryGrid.value
}

const selectCategory = (category: CategoryItem) => {
  selectedCategory.value = category
  emit('update:interestTypeId', category.id)
  // 选中后自动折叠，给用户明确的"已选择"反馈
  showCategoryGrid.value = false
}

const getIconClass = (name: string): string => {
  return getCategoryIconClass(name)
}

onMounted(() => {
  loadCategories()
  // 初始本金/利息根据 totalAmount 自动计算
  principal.value = calculateAutoPrincipal()
  interest.value = calculateAutoInterest()
  emitValues()
})

watch(() => props.totalAmount, (newTotal) => {
  if (newTotal > 0 && principal.value === 0 && interest.value === 0) {
    principal.value = calculateAutoPrincipal()
    interest.value = calculateAutoInterest()
    emitValues()
  }
})
</script>

<style lang="scss" scoped>
.repayment-split-form {
  padding: 0 24rpx 20rpx;
}

.split-card {
  background: linear-gradient(180deg, #FFFFFF 0%, #FAFCFC 100%);
  border-radius: 24rpx;
  border: 1rpx solid rgba(13, 148, 136, 0.08);
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.split-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 24rpx 28rpx 16rpx;
}

.split-title {
  font-size: var(--text-title, 32rpx);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
  letter-spacing: -0.3rpx;
}

.split-hint {
  font-size: var(--text-caption, 20rpx);
  color: var(--color-text-tertiary, #94A3B8);
  font-weight: 400;
}

.amount-block {
  margin: 0 20rpx 12rpx;
  background: var(--color-border-light, #F1F5F9);
  border-radius: 18rpx;
  padding: 6rpx 20rpx;
}

.amount-row {
  display: flex;
  align-items: stretch;
  padding: 16rpx 0;
}

.amount-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.amount-label {
  font-size: var(--text-small, 24rpx);
  color: var(--color-text-secondary, #64748B);
  font-weight: 500;
}

.amount-value {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.amount-currency {
  font-size: var(--text-body, 28rpx);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}

.amount-input {
  flex: 1;
  font-size: var(--text-title, 32rpx);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
  background: transparent;
  border: none;
  outline: none;
  padding: 0;
  min-width: 0;
  letter-spacing: -0.5rpx;
}

.amount-divider {
  width: 1rpx;
  background: var(--color-border, #E2E8F0);
  margin: 8rpx 24rpx;
}

.amount-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 0 16rpx;
  border-top: 1rpx dashed var(--color-border, #E2E8F0);
}

.summary-label {
  font-size: var(--text-small, 24rpx);
  color: var(--color-text-secondary, #64748B);
}

.summary-value {
  font-size: var(--text-body, 28rpx);
  font-weight: 700;
  color: var(--color-primary, #0D9488);
  letter-spacing: -0.3rpx;
}

.category-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 8rpx 20rpx 20rpx;
  padding: 20rpx 24rpx;
  background: var(--color-border-light, #F1F5F9);
  border-radius: 18rpx;
  border: 2rpx solid transparent;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &.open {
    background: var(--color-primary-light, #E6F7F5);
    border-color: var(--color-primary, #0D9488);
  }

  &:active:not(.open) {
    transform: scale(0.985);
    background: #E8EEF3;
  }
}

.picker-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
  min-width: 0;
}

.picker-icon-wrap {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, 0.06);
  flex-shrink: 0;
  position: relative;
}

.picker-icon {
  width: 36rpx;
  height: 36rpx;
}

.picker-icon-empty {
  background: var(--color-border, #E2E8F0);
  border-radius: 50%;
}

.picker-loading {
  width: 24rpx;
  height: 24rpx;
  border: 3rpx solid var(--color-border, #E2E8F0);
  border-top-color: var(--color-primary, #0D9488);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.picker-text {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
  min-width: 0;
  flex: 1;
}

.picker-label {
  font-size: var(--text-caption, 20rpx);
  color: var(--color-text-tertiary, #94A3B8);
  font-weight: 500;
}

.picker-value-text {
  font-size: var(--text-body, 28rpx);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.muted {
    color: var(--color-text-tertiary, #94A3B8);
    font-weight: 400;
  }
}

.picker-chevron {
  width: 32rpx;
  height: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: var(--color-text-secondary, #94A3B8);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;

  &.rotated {
    transform: rotate(180deg);
    color: var(--color-primary, #0D9488);
  }
}

.category-panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin: 0 20rpx;

  &.expanded {
    max-height: 540rpx;
  }
}

.category-scroll {
  height: 480rpx;
  padding: 0 8rpx 16rpx;
}

.grid-group {
  margin-bottom: 20rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.grid-group-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 4rpx 4rpx 12rpx;
}

.grid-group-name {
  font-size: var(--text-note, 22rpx);
  color: var(--color-text-secondary, #64748B);
  font-weight: 600;
  letter-spacing: 0.5rpx;
  flex-shrink: 0;
}

.grid-group-line {
  flex: 1;
  height: 1rpx;
  background: linear-gradient(90deg, var(--color-border, #E2E8F0) 0%, transparent 100%);
}

.grid-items {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx 8rpx;
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 4rpx 12rpx;
  border-radius: 16rpx;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  &:active {
    transform: scale(0.92);
  }

  &.active {
    background: var(--color-primary-light, #E6F7F5);
  }
}

.grid-item-icon-wrap {
  position: relative;
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, 0.06);
  border: 2rpx solid transparent;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.grid-item.active .grid-item-icon-wrap {
  border-color: var(--color-primary, #0D9488);
  box-shadow: 0 4rpx 12rpx rgba(13, 148, 136, 0.2);
}

.grid-item-icon {
  width: 44rpx;
  height: 44rpx;
}

.grid-item-check {
  position: absolute;
  right: -4rpx;
  bottom: -4rpx;
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  background: var(--color-primary, #0D9488);
  color: #FFFFFF;
  font-size: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 6rpx rgba(13, 148, 136, 0.3);
  animation: popIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.4);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.grid-item-name {
  font-size: var(--text-caption, 20rpx);
  color: var(--color-text-primary, #1E293B);
  text-align: center;
  line-height: 1.3;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 2rpx;
  transition: color 0.2s ease;

  &.active {
    color: var(--color-primary, #0D9488);
    font-weight: 600;
  }
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
}

.empty-text {
  font-size: var(--text-small, 24rpx);
  color: var(--color-text-tertiary, #94A3B8);
}
</style>
