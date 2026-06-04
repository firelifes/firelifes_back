<template>
  <view class="repayment-split-form">
    <view class="split-section">
      <text class="section-title">本金利息拆分</text>
      
      <view class="adjustable-amounts">
        <view class="input-row">
          <text class="input-label">本金</text>
          <view class="input-wrap">
            <text class="input-prefix">¥</text>
            <input 
              class="amount-input" 
              type="digit" 
              :value="formattedPrincipal"
              placeholder="0.00"
              @input="onPrincipalInput"
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
              :value="formattedInterest"
              placeholder="0.00"
              @input="onInterestInput"
            />
          </view>
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
      @open="emit('interestCategoryPopupOpen')"
      @close="emit('interestCategoryPopupClose')"
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
  (e: 'interestCategoryPopupOpen'): void
  (e: 'interestCategoryPopupClose'): void
}>()

const principal = ref(0)
const interest = ref(0)
const selectedCategory = ref<CategoryItem | null>(null)
const categoryPopupRef = ref<InstanceType<typeof InterestCategorySelectorPopup> | null>(null)
const categories = ref<CategoryItem[]>([])

const formattedPrincipal = computed(() => {
  return principal.value.toFixed(2)
})

const formattedInterest = computed(() => {
  return interest.value.toFixed(2)
})

const calculateAutoPrincipal = (): number => {
  const { loanAccount, totalAmount } = props
  // 如果有贷款账户且有利率信息，计算利息
  if (loanAccount && loanAccount.annualInterestRate) {
    const monthlyRate = loanAccount.annualInterestRate / 100 / 12
    let calculatedInterest = totalAmount * monthlyRate
    
    // 确保利息是正数且不超过总金额
    calculatedInterest = Math.max(0, Math.min(totalAmount, calculatedInterest))
    
    return Math.round((totalAmount - calculatedInterest) * 100) / 100
  }
  
  // 如果没有贷款信息，默认全部是本金
  return Math.round(totalAmount * 100) / 100
}

const calculateAutoInterest = (): number => {
  const { loanAccount, totalAmount } = props
  // 如果有贷款账户且有利率信息，计算利息
  if (loanAccount && loanAccount.annualInterestRate) {
    const monthlyRate = loanAccount.annualInterestRate / 100 / 12
    let calculatedInterest = totalAmount * monthlyRate
    
    // 确保利息是正数且不超过总金额
    calculatedInterest = Math.max(0, Math.min(totalAmount, calculatedInterest))
    
    return Math.round(calculatedInterest * 100) / 100
  }
  
  // 如果没有贷款信息，默认利息为0
  return 0
}

const onPrincipalInput = (e: any) => {
  const value = parseFloat(e.detail.value) || 0
  // 确保不小于0，不大于总金额
  const newPrincipal = Math.max(0, Math.min(props.totalAmount, value))
  principal.value = Math.round(newPrincipal * 100) / 100
  // 自动计算利息
  interest.value = Math.round((props.totalAmount - principal.value) * 100) / 100
  
  emitValues()
}

const onInterestInput = (e: any) => {
  const value = parseFloat(e.detail.value) || 0
  // 确保不小于0，不大于总金额
  const newInterest = Math.max(0, Math.min(props.totalAmount, value))
  interest.value = Math.round(newInterest * 100) / 100
  // 自动计算本金
  principal.value = Math.round((props.totalAmount - interest.value) * 100) / 100
  
  emitValues()
}

const emitValues = () => {
  emit('update:principal', principal.value)
  emit('update:interest', interest.value)
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
  // 先隐藏键盘
  uni.hideKeyboard()
  categoryPopupRef.value?.open(selectedCategory.value?.id)
}

const onCategorySelect = (category: CategoryItem) => {
  selectedCategory.value = category
  emit('update:interestTypeId', category.id)
}

const getIconClass = (name: string): string => {
  return getCategoryIconClass(name)
}

// 当总金额变化时，重新计算本金和利息
watch(() => props.totalAmount, (newTotal) => {
  principal.value = calculateAutoPrincipal()
  interest.value = calculateAutoInterest()
  emitValues()
}, { immediate: true })

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

.adjustable-amounts {
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
