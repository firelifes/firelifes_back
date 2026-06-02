<template>
  <view class="card liability-form">
    <view class="liability-header">贷款参数</view>

    <view class="form-row">
      <text class="form-label">启用贷款自动记账</text>
      <view class="switch-row-inline">
        <view class="switch-info-inline">
          <text class="switch-desc-inline">开启后显示以下贷款参数设置</text>
        </view>
        <WdSwitch
          v-model="localData.autoRepaymentEnabled"
          activeColor="var(--color-danger, #EF4444)"
        />
      </view>
    </view>

    <template v-if="localData.autoRepaymentEnabled">
      <view class="form-row">
        <text class="form-label">原始贷款总本金</text>
        <WdInput
          v-model.number="localData.originalPrincipal"
          type="digit"
          placeholder="请输入原始贷款总额"
          customStyle="background: var(--color-bg-card, #FFFFFF); border-radius: 10rpx;"
        >
          <template #suffix>
            <text class="unit">元</text>
          </template>
        </WdInput>
      </view>

      <view class="form-row">
        <text class="form-label">贷款年利率</text>
        <WdInput
          v-model.number="localData.annualInterestRate"
          type="digit"
          placeholder="4.9"
          customStyle="background: var(--color-bg-card, #FFFFFF); border-radius: 10rpx;"
        >
          <template #suffix>
            <text class="unit">%</text>
          </template>
        </WdInput>
        <text class="field-hint">灵活还款可选填0表示无息</text>
      </view>

      <view class="form-row">
        <text class="form-label">还款方式</text>
        <view class="option-grid option-grid-2x2">
          <view
            v-for="method in repaymentMethods"
            :key="method.value"
            class="option-item"
            :class="{ active: localData.repaymentMethod === method.value }"
            @click="localData.repaymentMethod = method.value"
          >
            <text class="option-text">{{ method.label }}</text>
            <text class="option-desc">{{ method.desc }}</text>
          </view>
        </view>
      </view>

      <template v-if="localData.repaymentMethod !== 'flexible'">
        <view class="form-row">
          <text class="form-label">总还款期数</text>
          <WdInput
            v-model.number="localData.totalMonths"
            type="number"
            placeholder="请输入总期数"
            customStyle="background: var(--color-bg-card, #FFFFFF); border-radius: 10rpx;"
          >
            <template #suffix>
              <text class="unit">月</text>
            </template>
          </WdInput>
        </view>

        <view class="form-row">
          <text class="form-label">剩余还款期数</text>
          <WdInput
            v-model.number="localData.remainingMonths"
            type="number"
            placeholder="请输入剩余期数"
            customStyle="background: var(--color-bg-card, #FFFFFF); border-radius: 10rpx;"
          >
            <template #suffix>
              <text class="unit">月</text>
            </template>
          </WdInput>
        </view>

        <view class="form-row">
          <text class="form-label">每月还款日</text>
          <view class="day-grid">
            <view
              v-for="day in 31"
              :key="day"
              class="day-item"
              :class="{ active: localData.repaymentDay === day }"
              @click="localData.repaymentDay = day"
            >
              <text class="day-text">{{ day }}</text>
            </view>
          </view>
        </view>
      </template>

      <view v-else class="flex-mode-hint">
        <text class="hint-text">灵活还款模式无需设置还款期数和还款日，随时手动操作还款</text>
      </view>

      <view class="form-row">
        <text class="form-label">关联资产账户（可选）</text>
        <view class="account-picker" @click="$emit('pickAssetAccount')">
          <text v-if="linkedAccountName" class="picker-value">{{ linkedAccountName }}</text>
          <text v-else class="picker-placeholder">选择关联的固定资产账户</text>
          <text class="picker-arrow">›</text>
        </view>
      </view>

      <!-- 下一期还款预览 -->
      <view v-if="localData.repaymentMethod !== 'flexible' && repaymentPreview" class="repayment-preview">
        <text class="preview-title">下一期还款预览</text>
        <view class="preview-info-row">
          <text class="preview-info-text">{{ previewPeriodLabel }}</text>
          <text class="preview-info-text">下次还款日期：{{ repaymentPreview.nextPaymentDate }}</text>
        </view>
        <view class="preview-grid">
          <view class="preview-item">
            <text class="preview-item-label">应还本金</text>
            <text class="preview-item-value">¥{{ formatAmount(repaymentPreview.principal) }}</text>
          </view>
          <view class="preview-item">
            <text class="preview-item-label">应还利息</text>
            <text class="preview-item-value">¥{{ formatAmount(repaymentPreview.interest) }}</text>
          </view>
          <view class="preview-item">
            <text class="preview-item-label">贴息金额</text>
            <text class="preview-item-value">¥{{ formatAmount(localData.subsidyAmount || 0) }}</text>
          </view>
          <view class="preview-item">
            <text class="preview-item-label">本息合计</text>
            <text class="preview-item-value preview-total">¥{{ formatAmount(repaymentPreview.totalPayment + (localData.subsidyAmount || 0)) }}</text>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import type { RepaymentMethod } from '../../../../types/account'

export interface LiabilityFormData {
  autoRepaymentEnabled: boolean
  originalPrincipal?: number
  annualInterestRate?: number
  repaymentMethod?: RepaymentMethod
  totalMonths?: number
  remainingMonths?: number
  repaymentDay?: number
  linkedAssetAccountId?: string
  subsidyAmount?: number
}

export interface RepaymentPreview {
  totalPayment: number
  principal: number
  interest: number
  nextPaymentDate: string
}

const props = defineProps<{
  modelValue: LiabilityFormData
  linkedAccountName?: string
  currentBalance?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: LiabilityFormData): void
  (e: 'pickAssetAccount'): void
}>()

const repaymentMethods: { value: RepaymentMethod; label: string; desc: string }[] = [
  { value: 'equal_principal_interest', label: '等额本息', desc: '月供固定' },
  { value: 'equal_principal', label: '等额本金', desc: '月供递减' },
  { value: 'interest_first', label: '先息后本', desc: '先还息后还本' },
  { value: 'flexible', label: '灵活还款', desc: '任意金额随时还' },
]

const localData = reactive<LiabilityFormData>({
  autoRepaymentEnabled: false,
  originalPrincipal: undefined,
  annualInterestRate: 4.9,
  repaymentMethod: 'equal_principal_interest',
  totalMonths: undefined,
  remainingMonths: undefined,
  repaymentDay: undefined,
  linkedAssetAccountId: undefined,
  subsidyAmount: 0,
})

watch(() => props.modelValue, (val) => {
  if (val) {
    localData.autoRepaymentEnabled = val.autoRepaymentEnabled ?? false
    localData.originalPrincipal = val.originalPrincipal
    localData.annualInterestRate = val.annualInterestRate ?? 4.9
    localData.repaymentMethod = val.repaymentMethod || 'equal_principal_interest'
    localData.totalMonths = val.totalMonths
    localData.remainingMonths = val.remainingMonths
    localData.repaymentDay = val.repaymentDay
    localData.linkedAssetAccountId = val.linkedAssetAccountId
    localData.subsidyAmount = val.subsidyAmount ?? 0
  }
}, { immediate: true, deep: true })

watch(localData, () => {
  emit('update:modelValue', { ...localData })
}, { deep: true })

const remainingPrincipal = computed(() => {
  return props.currentBalance || 0
})

const canCalculate = computed(() => {
  const d = localData
  return d.autoRepaymentEnabled
    && d.repaymentMethod !== 'flexible'
    && d.originalPrincipal && d.originalPrincipal > 0
    && d.annualInterestRate !== undefined && d.annualInterestRate !== null
    && d.totalMonths && d.totalMonths > 0
    && d.remainingMonths && d.remainingMonths > 0
    && d.repaymentDay && d.repaymentDay > 0
})

const currentPeriod = computed(() => {
  const d = localData
  if (!d.totalMonths || !d.remainingMonths) return 0
  return d.totalMonths - d.remainingMonths + 1
})

const previewPeriodLabel = computed(() => {
  const method = localData.repaymentMethod
  if (method === 'interest_first') {
    return `第 ${currentPeriod.value} 期（利息期）`
  }
  return `当前第 ${currentPeriod.value} 期 / 共 ${localData.totalMonths} 期`
})

const repaymentPreview = computed<RepaymentPreview | null>(() => {
  if (!canCalculate.value) return null

  const d = localData
  const P = remainingPrincipal.value
  const i = (d.annualInterestRate || 0) / 100 / 12
  const n = d.remainingMonths!
  const N = d.totalMonths!
  const day = d.repaymentDay!

  let principal = 0
  let interest = 0
  let totalPayment = 0

  if (d.repaymentMethod === 'equal_principal_interest') {
    if (i === 0) {
      principal = P / n
      interest = 0
      totalPayment = principal
    } else {
      const factor = Math.pow(1 + i, n)
      totalPayment = P * (i * factor) / (factor - 1)
      interest = P * i
      principal = totalPayment - interest
    }
  } else if (d.repaymentMethod === 'equal_principal') {
    principal = (d.originalPrincipal || P) / N
    interest = P * i
    totalPayment = principal + interest
  } else if (d.repaymentMethod === 'interest_first') {
    if (n === 1) {
      principal = P
    } else {
      principal = 0
    }
    interest = P * i
    totalPayment = principal + interest
  }

  // 四舍五入保留两位小数
  principal = Math.round(principal * 100) / 100
  interest = Math.round(interest * 100) / 100
  totalPayment = Math.round(totalPayment * 100) / 100

  // 计算下次还款日期
  const now = new Date()
  const nextDate = new Date(now.getFullYear(), now.getMonth(), day)
  if (nextDate <= now) {
    nextDate.setMonth(nextDate.getMonth() + 1)
  }
  const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`

  return { totalPayment, principal, interest, nextPaymentDate: dateStr }
})

const formatAmount = (val: number): string => {
  return val.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<style scoped>
.liability-form {
  background: var(--color-danger-light, #FEF2F2);
  border: 2rpx solid rgba(239, 68, 68, 0.1);
}

.liability-header {
  font-size: var(--text-body);
  font-weight: 600;
  color: var(--color-danger, #EF4444);
  margin-bottom: 24rpx;
}

.form-row {
  margin-bottom: 32rpx;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-label {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
  font-weight: 500;
  margin-bottom: 12rpx;
}

.unit {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
  margin-right: 8rpx;
}

.field-hint {
  font-size: var(--text-note);
  color: var(--color-text-secondary, #94A3B8);
  margin-top: 8rpx;
  display: block;
}

.switch-row-inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.switch-info-inline {
  flex: 1;
}

.switch-desc-inline {
  font-size: var(--text-note);
  color: var(--color-text-secondary, #94A3B8);
}

.option-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.option-grid-2x2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.option-item {
  padding: 16rpx 20rpx;
  background: var(--color-bg-card, #FFFFFF);
  border: 2rpx solid var(--color-border, #E2E8F0);
  border-radius: 12rpx;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.option-item.active {
  border-color: var(--color-danger, #EF4444);
  background: var(--color-danger-light, #FEF2F2);
}

.option-text {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
}

.option-item.active .option-text {
  color: var(--color-danger, #EF4444);
  font-weight: 500;
}

.option-desc {
  font-size: 20rpx;
  color: var(--color-text-tertiary, #CBD5E1);
}

.option-item.active .option-desc {
  color: rgba(239, 68, 68, 0.6);
}

.day-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.day-item {
  width: 68rpx;
  height: 68rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-card, #FFFFFF);
  border: 2rpx solid var(--color-border, #E2E8F0);
  border-radius: 12rpx;
  transition: all 0.2s ease;
}

.day-item.active {
  border-color: var(--color-danger, #EF4444);
  background: var(--color-danger-light, #FEF2F2);
}

.day-text {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
}

.day-item.active .day-text {
  color: var(--color-danger, #EF4444);
  font-weight: 600;
}

.flex-mode-hint {
  padding: 16rpx 20rpx;
  background: rgba(239, 68, 68, 0.06);
  border-radius: 10rpx;
  margin-bottom: 32rpx;
}

.hint-text {
  font-size: var(--text-note);
  color: var(--color-danger, #EF4444);
}

.account-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 10rpx;
}

.picker-value {
  font-size: var(--text-body);
  color: var(--color-text-primary, #1E293B);
}

.picker-placeholder {
  font-size: var(--text-body);
  color: var(--color-text-tertiary, #CBD5E1);
}

.picker-arrow {
  font-size: var(--text-title);
  color: var(--color-text-tertiary, #CBD5E1);
}

/* 还款预览 */
.repayment-preview {
  margin-top: 32rpx;
  padding: 24rpx;
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 16rpx;
  border: 2rpx solid rgba(239, 68, 68, 0.12);
}

.preview-title {
  font-size: var(--text-small);
  font-weight: 600;
  color: var(--color-danger, #EF4444);
  display: block;
  margin-bottom: 16rpx;
}

.preview-info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.preview-info-text {
  font-size: var(--text-note);
  color: var(--color-text-secondary, #94A3B8);
}

.preview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.preview-item {
  padding: 20rpx;
  background: var(--color-border-light, #F1F5F9);
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.preview-item-label {
  font-size: var(--text-note);
  color: var(--color-text-secondary, #94A3B8);
}

.preview-item-value {
  font-size: var(--text-body);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}

.preview-total {
  color: var(--color-danger, #EF4444);
  font-size: 34rpx;
}
</style>
