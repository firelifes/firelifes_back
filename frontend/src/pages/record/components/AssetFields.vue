<template>
  <view class="asset-fields">
    <view class="asset-switch-row">
      <text class="switch-label">记入资产</text>
      <view class="switch-track" :class="{ active: modelValue }" @tap="toggleSwitch">
        <view class="switch-thumb" :class="{ active: modelValue }"></view>
      </view>
    </view>

    <view v-if="modelValue" class="asset-form">
      <view class="form-item" @tap="showCategoryPicker = true">
        <text class="form-label">品类标签</text>
        <view class="form-value">
          <text class="form-value-text">{{ categoryLabel || '请选择' }}</text>
          <text class="form-arrow">▼</text>
        </view>
      </view>

      <view class="form-item">
        <text class="form-label">折旧方法</text>
        <view class="radio-group">
          <view
            class="radio-item"
            :class="{ active: localMethod === 'straight-line' }"
            @tap="selectMethod('straight-line')"
          >
            <view class="radio-dot" :class="{ active: localMethod === 'straight-line' }"></view>
            <text class="radio-text">直线</text>
          </view>
          <view
            class="radio-item"
            :class="{ active: localMethod === 'double-declining-balance' }"
            @tap="selectMethod('double-declining-balance')"
          >
            <view class="radio-dot" :class="{ active: localMethod === 'double-declining-balance' }"></view>
            <text class="radio-text">双倍余额</text>
          </view>
        </view>
      </view>

      <view class="form-item depreciation-hint">
        <text class="form-label">月折旧额</text>
        <text class="depreciation-value">¥{{ monthlyDepreciationText }}</text>
      </view>

      <view class="form-item">
        <text class="form-label">预计使用</text>
        <view class="input-with-suffix">
          <input
            class="form-input number-input"
            type="number"
            v-model="localLifeMonths"
            placeholder="36"
            @blur="emitData"
          />
          <text class="input-suffix">个月</text>
        </view>
      </view>

      <view class="form-item">
        <text class="form-label">预期残值</text>
        <view class="input-with-prefix">
          <text class="input-prefix">¥</text>
          <input
            class="form-input number-input"
            type="digit"
            v-model="localResidualValue"
            placeholder="0.00"
            @blur="emitData"
          />
        </view>
      </view>

      <view class="form-item">
        <text class="form-label">资产名称</text>
        <input
          class="form-input"
          type="text"
          v-model="localName"
          :placeholder="defaultName"
          maxlength="50"
          @blur="emitData"
        />
      </view>
    </view>

    <view v-if="showCategoryPicker" class="picker-overlay" @tap="showCategoryPicker = false">
      <view class="picker-panel" @tap.stop>
        <view class="picker-header">
          <text class="picker-title">选择品类</text>
          <view class="picker-close category-icon-svg category-icon-guanbi" @tap="showCategoryPicker = false"></view>
        </view>
        <scroll-view scroll-y class="picker-body">
          <view
            v-for="cat in categories"
            :key="cat.key"
            class="picker-option"
            :class="{ active: localCategory === cat.key }"
            @tap="selectCategory(cat.key)"
          >
            <text class="picker-option-text">{{ cat.label }}</text>
            <view v-if="localCategory === cat.key" class="picker-option-check category-icon-svg category-icon-duigou"></view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  type DepreciatingCategory,
  type DepreciationMethod,
  CATEGORY_LABELS,
  CATEGORY_DEFAULTS,
  calculateMonthlyDepreciation,
  type DepreciatingAssetData,
} from '../../../types/asset'

const props = defineProps<{
  modelValue: boolean
  purchasePrice: number
  purchaseDate: string
  defaultName?: string
  initialData?: DepreciatingAssetData | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:assetData': [data: DepreciatingAssetData | null]
}>()

const categories = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
  key: key as DepreciatingCategory,
  label,
}))

const localCategory = ref<DepreciatingCategory>('other')
const localMethod = ref<DepreciationMethod>('straight-line')
const localLifeMonths = ref('')
const localResidualValue = ref('')
const localName = ref('')
const showCategoryPicker = ref(false)

const categoryLabel = computed(() => localCategory.value ? CATEGORY_LABELS[localCategory.value] : '')

const monthlyDepreciationText = computed(() => {
  const price = props.purchasePrice || 0
  const residual = parseFloat(localResidualValue.value) || 0
  const months = parseInt(localLifeMonths.value) || 1
  if (price <= 0) return '0.00'
  return calculateMonthlyDepreciation(price, residual, months, localMethod.value).toFixed(2)
})

const toggleSwitch = () => {
  const newVal = !props.modelValue
  emit('update:modelValue', newVal)
}

const selectCategory = (key: DepreciatingCategory) => {
  localCategory.value = key
  const defaults = CATEGORY_DEFAULTS[key]
  localMethod.value = defaults.defaultDepreciationMethod
  localLifeMonths.value = String(defaults.defaultLifeMonths)
  const price = props.purchasePrice || 0
  localResidualValue.value = (price * defaults.residualRate).toFixed(2)
  showCategoryPicker.value = false
  emitData()
}

const selectMethod = (method: DepreciationMethod) => {
  localMethod.value = method
  emitData()
}

const emitData = () => {
  const price = props.purchasePrice
  if (price <= 0 || !localCategory.value) {
    emit('update:assetData', null)
    return
  }
  emit('update:assetData', {
    name: localName.value || props.defaultName || '',
    category: localCategory.value,
    depreciationMethod: localMethod.value,
    purchasePrice: price,
    purchaseDate: props.purchaseDate,
    expectedLifeMonths: parseInt(localLifeMonths.value) || CATEGORY_DEFAULTS[localCategory.value].defaultLifeMonths,
    residualValue: parseFloat(localResidualValue.value) || 0,
  })
}

watch(() => props.modelValue, (val) => {
  if (!val) {
    showCategoryPicker.value = false
  }
})

watch(() => props.initialData, (data) => {
  if (data) {
    localCategory.value = data.category
    localMethod.value = data.depreciationMethod
    localLifeMonths.value = String(data.expectedLifeMonths)
    localResidualValue.value = data.residualValue.toFixed(2)
    localName.value = data.name
  }
}, { immediate: true })
</script>

<style scoped>
.asset-fields {
  background: var(--color-border-light, #F1F5F9);
  border-radius: 20rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
}

.asset-switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 28rpx;
}

.switch-label {
  font-size: var(--text-body);
  color: var(--color-text-primary, #1E293B);
  font-weight: 500;
}

.switch-track {
  width: 88rpx;
  height: 50rpx;
  border-radius: 25rpx;
  background: var(--color-border, #E2E8F0);
  transition: background 0.2s;
  position: relative;
}

.switch-track.active {
  background: var(--color-primary, #0D9488);
}

.switch-thumb {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: var(--color-bg-card, #FFFFFF);
  position: absolute;
  top: 3rpx;
  left: 3rpx;
  transition: left 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.switch-thumb.active {
  left: 41rpx;
}

.asset-form {
  border-top: 1rpx solid rgba(0, 0, 0, 0.05);
  padding: 20rpx 28rpx 28rpx;
  animation: assetFormIn 0.25s ease;
}

@keyframes assetFormIn {
  from {
    opacity: 0;
    transform: translateY(-10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18rpx 0;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.04);
}

.form-item:last-child {
  border-bottom: none;
}

.form-label {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
  flex-shrink: 0;
  min-width: 140rpx;
}

.form-value {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.form-value-text {
  font-size: var(--text-small);
  color: var(--color-text-primary, #1E293B);
}

.form-arrow {
  font-size: var(--text-caption);
  color: var(--color-text-secondary, #94A3B8);
  margin-left: 12rpx;
}

.radio-group {
  display: flex;
  gap: 32rpx;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.radio-dot {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  border: 3rpx solid var(--color-border, #E2E8F0);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s;
}

.radio-dot.active {
  border-color: var(--color-primary, #0D9488);
  background: var(--color-primary, #0D9488);
}

.radio-text {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
}

.depreciation-hint {
  border-bottom-style: dashed;
}

.depreciation-value {
  font-size: var(--text-small);
  color: var(--color-primary, #0D9488);
  font-weight: 600;
}

.form-input {
  flex: 1;
  text-align: right;
  font-size: var(--text-small);
  color: var(--color-text-primary, #1E293B);
  padding: 8rpx 0;
}

.number-input {
  text-align: right;
}

.input-with-suffix {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.input-suffix {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
}

.input-with-prefix {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.input-prefix {
  font-size: var(--text-small);
  color: var(--color-text-primary, #1E293B);
  font-weight: 600;
}

.picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 2000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.picker-panel {
  width: 100%;
  max-height: 600rpx;
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 32rpx 32rpx 0 0;
  animation: pickerIn 0.25s ease;
}

@keyframes pickerIn {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid var(--color-border, #E2E8F0);
}

.picker-title {
  font-size: var(--text-body);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}

.picker-close {
  width: 32rpx;
  height: 32rpx;
  color: var(--color-text-secondary, #94A3B8);
  padding: 8rpx;
}

.picker-body {
  max-height: 500rpx;
  padding: 16rpx 0;
}

.picker-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 32rpx;
}

.picker-option.active {
  background: rgba(0, 191, 255, 0.05);
}

.picker-option-text {
  font-size: var(--text-body);
  color: var(--color-text-primary, #1E293B);
}

.picker-option-check {
  width: 28rpx;
  height: 28rpx;
  color: var(--color-primary, #0D9488);
}
</style>
