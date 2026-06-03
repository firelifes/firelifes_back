<template>
  <view class="repayment-split-form">
    <view class="split-section">
      <text class="section-title">本金利息拆分</text>
      
      <view class="split-mode">
        <view 
          class="mode-option" 
          :class="{ active: splitMode === 'auto' }"
          @tap="splitMode = 'auto'"
        >
          <text class="mode-radio">●</text>
          <text class="mode-label">自动拆分（推荐）</text>
        </view>
        <view 
          class="mode-option" 
          :class="{ active: splitMode === 'manual' }"
          @tap="splitMode = 'manual'"
        >
          <text class="mode-radio">●</text>
          <text class="mode-label">手动拆分</text>
        </view>
      </view>
      
      <view v-if="splitMode === 'auto'" class="auto-result">
        <view class="result-row">
          <text class="result-label">本金</text>
          <text class="result-value principal">¥{{ formatNumber(principalAmount) }}</text>
        </view>
        <view class="result-row">
          <text class="result-label">利息</text>
          <text class="result-value interest">¥{{ formatNumber(interestAmount) }}</text>
        </view>
      </view>
      
      <view v-else class="manual-inputs">
        <view class="input-row">
          <text class="input-label">本金</text>
          <view class="input-wrap">
            <text class="input-prefix">¥</text>
            <input 
              class="amount-input" 
              type="digit" 
              v-model="manualPrincipal"
              placeholder="0.00"
              @input="onManualInput"
            />
          </view>
        </view>
        <view class="input-row">
          <text class="input-label">利息</text>
          <view class="input-wrap">
            <text class="input-prefix">¥</text>
            <input 
              class="amount-input" 
              type="digit" 
              v-model="manualInterest"
              placeholder="0.00"
              @input="onManualInput"
            />
          </view>
        </view>
        <view v-if="totalError" class="error-tip">
          <text class="error-text">本金 + 利息 ≠ 还款总额</text>
        </view>
      </view>
      
      <view class="interest-category">
        <text class="category-label">利息分类</text>
        <view 
          class="picker-value" 
          @tap="openCategoryPicker"
        >
          <view class="selected-category">
            <view v-if="selectedCategory" class="selected-category-info">
              <view class="category-icon-svg" :class="getIconClass(selectedCategory.name)"></view>
              <text class="category-name">{{ selectedCategory.name }}</text>
            </view>
            <text v-else class="placeholder-text">请选择</text>
          </view>
          <text class="picker-arrow">▼</text>
        </view>
      </view>
    </view>
    <InterestCategorySelectorPopup
      ref="categoryPopupRef"
      @select="onCategorySelect"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { categoryApi, type CategoryItem } from '../../../api/category'
import { getCategoryIconClass } from '../../../utils/category-icon-map'
import InterestCategorySelectorPopup from './InterestCategorySelectorPopup.vue'

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

const splitMode = ref<'auto' | 'manual'>('auto')
const manualPrincipal = ref('')
const manualInterest = ref('')
const selectedCategory = ref<CategoryItem | null>(null)
const categoryPopupRef = ref<InstanceType<typeof InterestCategorySelectorPopup> | null>(null)
const categories = ref<CategoryItem[]>([])

const principalAmount = computed(() => {
  if (splitMode.value === 'auto') {
    return calculatePrincipal()
  }
  return parseFloat(manualPrincipal.value) || 0
})

const interestAmount = computed(() => {
  if (splitMode.value === 'auto') {
    return calculateInterest()
  }
  return parseFloat(manualInterest.value) || 0
})

const totalError = computed(() => {
  if (splitMode.value === 'manual') {
    const total = parseFloat(manualPrincipal.value) + parseFloat(manualInterest.value)
    return Math.abs(total - props.totalAmount) > 0.01
  }
  return false
})

const calculatePrincipal = (): number => {
  const { loanAccount, totalAmount } = props
  if (!loanAccount || !loanAccount.annualInterestRate) {
    return totalAmount * 0.7
  }
  
  const monthlyRate = loanAccount.annualInterestRate / 100 / 12
  const remainingMonths = loanAccount.remainingMonths || 12
  
  let principal = 0
  const interest = totalAmount * monthlyRate
  
  if (totalAmount > interest) {
    principal = totalAmount - interest
  }
  
  return Math.max(0, principal)
}

const calculateInterest = (): number => {
  const { loanAccount, totalAmount } = props
  if (!loanAccount || !loanAccount.annualInterestRate) {
    return totalAmount * 0.3
  }
  
  const monthlyRate = loanAccount.annualInterestRate / 100 / 12
  const interest = totalAmount * monthlyRate
  
  return Math.min(totalAmount, interest)
}

const formatNumber = (num: number): string => {
  return num.toFixed(2)
}

const onManualInput = () => {
  emit('update:principal', parseFloat(manualPrincipal.value) || 0)
  emit('update:interest', parseFloat(manualInterest.value) || 0)
}

const loadCategories = async () => {
  try {
    const res = await categoryApi.getUserCategories('expense')
    if (res.success && res.data) {
      const allCategories: CategoryItem[] = []
      for (const group of res.data) {
        allCategories.push(...group.children)
      }
      categories.value = allCategories
      
      // 默认选择「利息支出」分类
      const interestCategory = allCategories.find(cat => cat.name === '利息支出')
      if (interestCategory) {
        selectedCategory.value = interestCategory
        emit('update:interestTypeId', interestCategory.id)
      }
    }
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

const openCategoryPicker = () => {
  categoryPopupRef.value?.open(selectedCategory.value?.id)
}

const onCategorySelect = (category: CategoryItem) => {
  selectedCategory.value = category
  emit('update:interestTypeId', category.id)
}

const getIconClass = (name: string): string => {
  return getCategoryIconClass(name)
}

watch(splitMode, (newMode) => {
  if (newMode === 'auto') {
    emit('update:principal', principalAmount.value)
    emit('update:interest', interestAmount.value)
  }
})

watch(() => props.totalAmount, () => {
  if (splitMode.value === 'auto') {
    emit('update:principal', principalAmount.value)
    emit('update:interest', interestAmount.value)
  }
})

watch(principalAmount, (val) => emit('update:principal', val))
watch(interestAmount, (val) => emit('update:interest', val))

onMounted(() => {
  loadCategories()
})
</script>

<style lang="scss" scoped>
.repayment-split-form {
  padding: 24rpx;
}

.split-section {
  background: #F8FAFC;
  border-radius: 16rpx;
  padding: 24rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 20rpx;
  display: block;
}

.split-mode {
  display: flex;
  gap: 24rpx;
  margin-bottom: 24rpx;
}

.mode-option {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 20rpx;
  background: #FFFFFF;
  border-radius: 12rpx;
  border: 2rpx solid #E2E8F0;
  transition: all 0.2s ease;
  
  &.active {
    border-color: #0D9488;
    background: rgba(13, 148, 136, 0.05);
  }
}

.mode-radio {
  font-size: 24rpx;
  color: #94A3B8;
  
  .active & {
    color: #0D9488;
  }
}

.mode-label {
  font-size: 26rpx;
  color: #475569;
  
  .active & {
    color: #0D9488;
    font-weight: 500;
  }
}

.auto-result {
  background: #FFFFFF;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 24rpx;
}

.result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  & + & {
    margin-top: 16rpx;
    padding-top: 16rpx;
    border-top: 1rpx solid #F1F5F9;
  }
}

.result-label {
  font-size: 26rpx;
  color: #64748B;
}

.result-value {
  font-size: 32rpx;
  font-weight: 600;
  
  &.principal {
    color: #1E293B;
  }
  
  &.interest {
    color: #EF4444;
  }
}

.manual-inputs {
  background: #FFFFFF;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 24rpx;
}

.input-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  & + & {
    margin-top: 16rpx;
    padding-top: 16rpx;
    border-top: 1rpx solid #F1F5F9;
  }
}

.input-label {
  font-size: 26rpx;
  color: #64748B;
}

.input-wrap {
  display: flex;
  align-items: center;
  background: #F8FAFC;
  border-radius: 8rpx;
  padding: 12rpx 16rpx;
}

.input-prefix {
  font-size: 28rpx;
  color: #94A3B8;
  margin-right: 8rpx;
}

.amount-input {
  width: 160rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #1E293B;
  text-align: right;
}

.error-tip {
  margin-top: 12rpx;
  padding: 12rpx;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 8rpx;
}

.error-text {
  font-size: 22rpx;
  color: #EF4444;
}

.interest-category {
  background: #FFFFFF;
  border-radius: 12rpx;
  padding: 20rpx;
}

.category-label {
  font-size: 26rpx;
  color: #64748B;
  margin-bottom: 12rpx;
  display: block;
}

.picker-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx;
  background: #F8FAFC;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #1E293B;
}

.selected-category {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.selected-category-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.category-icon-svg {
  width: 32rpx;
  height: 32rpx;
}

.category-name {
  font-size: 28rpx;
  color: #1E293B;
}

.placeholder-text {
  font-size: 28rpx;
  color: #94A3B8;
}

.picker-arrow {
  font-size: 20rpx;
  color: #94A3B8;
}
</style>
