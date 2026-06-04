<template>
  <BottomScrollPopup
    v-model="visibleModel"
    :z-index="1000"
    :height="80"
    :custom-style="popupCustomStyle"
    @close="handlePopupClose"
  >
    <scroll-view scroll-y class="form-content" :show-scrollbar="false">
      <view class="amount-display">
        <text class="currency">¥</text>
        <text class="amount">{{ displayAmount || '0.00' }}</text>
      </view>

      <view v-if="showAssetFields" class="date-row" @tap="toggleDatePicker">
        <view class="date-icon category-icon-svg category-icon-riqi"></view>
        <text class="date-label">日期</text>
        <view class="date-value-row">
          <text class="date-value">{{ formattedDateFull }}</text>
          <text class="date-arrow">▼</text>
        </view>
      </view>

      <view class="account-area">
        <view class="account-row single" @tap="openAccount">
          <text class="account-label">{{ transactionType === 'income' ? '收入账户' : '支出账户' }}</text>
          <view class="account-value" v-if="selectedAccount">
            <view class="account-value-icon category-icon-svg" :class="getAccountIconClass(selectedAccount.icon, selectedAccount.type)"></view>
            <text class="account-value-name">{{ selectedAccount.name }}</text>
          </view>
          <text class="account-value placeholder" v-else>点击选择</text>
          <text class="account-arrow">▼</text>
        </view>
      </view>

      <view class="remark-area">
        <WdTextarea
          v-model="remark"
          placeholder="点击填写备注"
          :maxlength="200"
          autoHeight
          customStyle="background: rgba(245, 246, 250, 0.8); border-radius: 20rpx; padding: 20rpx 24rpx; font-size: 28rpx;"
        />
      </view>

      <AssetFields
        v-if="transactionType === 'expense'"
        v-model="showAssetFields"
        :purchasePrice="parseFloat(displayAmount) || 0"
        :purchaseDate="date"
        :defaultName="categoryName"
        :initialData="initialAssetData"
        @update:assetData="handleAssetDataChange"
      />
    </scroll-view>

    <template v-if="!showAssetFields" #footer>
      <view class="keyboard">
        <view class="keyboard-row">
          <view class="key-item" @tap="inputAmount('7')"><text>7</text></view>
          <view class="key-item" @tap="inputAmount('8')"><text>8</text></view>
          <view class="key-item" @tap="inputAmount('9')"><text>9</text></view>
          <view class="key-item function" @tap="toggleDatePicker">
            <text class="date-text">{{ formattedDate }}</text>
          </view>
        </view>
        <view class="keyboard-row">
          <view class="key-item" @tap="inputAmount('4')"><text>4</text></view>
          <view class="key-item" @tap="inputAmount('5')"><text>5</text></view>
          <view class="key-item" @tap="inputAmount('6')"><text>6</text></view>
          <view class="key-item function" @tap="inputAmount('+')"><text>+</text></view>
        </view>
        <view class="keyboard-row">
          <view class="key-item" @tap="inputAmount('1')"><text>1</text></view>
          <view class="key-item" @tap="inputAmount('2')"><text>2</text></view>
          <view class="key-item" @tap="inputAmount('3')"><text>3</text></view>
          <view class="key-item function" @tap="inputAmount('-')"><text>-</text></view>
        </view>
        <view class="keyboard-row">
          <view class="key-item" @tap="inputAmount('.')"><text>.</text></view>
          <view class="key-item" @tap="inputAmount('0')"><text>0</text></view>
          <view class="key-item function" @tap="deleteDigit"><text>⌫</text></view>
          <view class="key-item confirm" :class="{ disabled: submitting }" @tap="!submitting && handleComplete()">
            <text>{{ submitting ? '提交中...' : '完成' }}</text>
          </view>
        </view>
      </view>
    </template>

    <template v-else #footer>
      <view class="complete-btn-wrapper">
        <view class="complete-btn" :class="{ disabled: submitting }" @tap="!submitting && handleComplete()">
          <text>{{ submitting ? '提交中...' : '完  成' }}</text>
        </view>
      </view>
    </template>
  </BottomScrollPopup>

  <!-- 二级弹框：选择账户 -->
  <AccountSelectorPopup ref="accountPopupRef" :title="'选择账户'" :filterType="transactionType" @select="handleAccountSelect" />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Account } from '../../../types/account'
import { getAccountIconClass } from '../../../types/account'
import type { DepreciatingAssetData } from '../../../types/asset'
import AccountSelectorPopup from './AccountSelectorPopup.vue'
import AssetFields from './AssetFields.vue'
import BottomScrollPopup from '../../../components/BottomScrollPopup.vue'

const props = defineProps<{
  /** 弹框显示控制（v-model:visible），由父组件控制 */
  visible: boolean
  date: string
  transactionType: 'income' | 'expense'
  categoryName?: string
  selectedAccount?: Account | null
  submitting?: boolean
  initialAmount?: string
  initialRemark?: string
  initialAssetData?: DepreciatingAssetData | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'update:date', date: string): void
  (e: 'update:amount', amount: string): void
  (e: 'update:remark', remark: string): void
  (e: 'update:selectedAccount', account: Account | null): void
  (e: 'update:assetData', data: DepreciatingAssetData | null): void
  (e: 'complete'): void
  (e: 'toggleDatePicker'): void
  (e: 'close'): void
}>()

/**
 * 一级弹框自定义样式：玻璃拟态（半透明白 + 模糊 + 顶部细线）
 * 与 TransferForm 保持一致
 */
const popupCustomStyle = [
  'background: rgba(255, 255, 255, 0.95)',
  'backdrop-filter: blur(20rpx)',
  '-webkit-backdrop-filter: blur(20rpx)',
  'border-top: 1rpx solid rgba(255, 255, 255, 0.5)',
].join('; ')

/** v-model 代理：桥接父组件的 `visible` prop 到 BottomScrollPopup 的 `modelValue` */
const visibleModel = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const displayAmount = ref('')
const remark = ref('')
const firstOperand = ref<string>('')
const operator = ref<string>('')
const waitingForSecondOperand = ref(false)
const showAssetFields = ref(false)

const accountPopupRef = ref<InstanceType<typeof AccountSelectorPopup> | null>(null)

const openAccount = () => {
  accountPopupRef.value?.open(props.selectedAccount?.id)
}

const handleAccountSelect = (account: Account) => {
  emit('update:selectedAccount', account)
}

const handlePopupClose = () => {
  emit('close')
}

const parseDate = (dateStr?: string): Date => {
  if (!dateStr) return new Date()
  return new Date(dateStr)
}

const formattedDate = computed(() => {
  const d = parseDate(props.date)
  const today = new Date()
  const dateStr = d.toDateString()
  const todayStr = today.toDateString()
  if (dateStr === todayStr) {
    return '今天'
  }
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
})

const formattedDateFull = computed(() => {
  const d = parseDate(props.date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
})

const handleAssetDataChange = (data: DepreciatingAssetData | null) => {
  emit('update:assetData', data)
}

watch(() => props.initialAmount, (val) => {
  if (val) {
    displayAmount.value = val
    emit('update:amount', val)
  }
}, { immediate: true })

watch(() => props.initialRemark, (val) => {
  if (val) {
    remark.value = val
    emit('update:remark', val)
  }
}, { immediate: true })

watch(() => props.initialAssetData, (val) => {
  if (val) {
    showAssetFields.value = true
  }
}, { immediate: true })

const inputAmount = (digit: string) => {
  if (digit === '+' || digit === '-') {
    if (displayAmount.value === '') return

    if (firstOperand.value && operator.value && !waitingForSecondOperand.value) {
      const result = calculate(parseFloat(firstOperand.value), parseFloat(displayAmount.value), operator.value)
      displayAmount.value = formatNumber(result)
      firstOperand.value = displayAmount.value
    } else {
      firstOperand.value = displayAmount.value
    }

    operator.value = digit
    waitingForSecondOperand.value = true
    return
  }

  if (waitingForSecondOperand.value) {
    displayAmount.value = ''
    waitingForSecondOperand.value = false
  }

  if (digit === '.') {
    if (displayAmount.value.includes('.')) return
    if (displayAmount.value === '') {
      displayAmount.value = '0.'
    } else {
      displayAmount.value += '.'
    }
  } else if (digit === '0' && displayAmount.value === '0') {
    return
  } else {
    if (displayAmount.value.includes('.')) {
      const parts = displayAmount.value.split('.')
      if (parts[1].length >= 2) return
    }
    if (displayAmount.value === '0' && digit !== '.') {
      displayAmount.value = digit
    } else {
      displayAmount.value += digit
    }
  }
  emit('update:amount', displayAmount.value)
}

const calculate = (a: number, b: number, op: string): number => {
  if (op === '+') return a + b
  if (op === '-') return a - b
  return b
}

const formatNumber = (num: number): string => {
  if (Number.isInteger(num)) {
    return num.toString()
  }
  return num.toFixed(2).replace(/\.?0+$/, '')
}

const deleteDigit = () => {
  if (waitingForSecondOperand.value) return
  displayAmount.value = displayAmount.value.substring(0, displayAmount.value.length - 1)
  emit('update:amount', displayAmount.value)
}

const handleComplete = () => {
  if (firstOperand.value && operator.value && !waitingForSecondOperand.value) {
    const result = calculate(parseFloat(firstOperand.value), parseFloat(displayAmount.value), operator.value)
    displayAmount.value = formatNumber(result)
  }

  const finalAmount = Math.abs(parseFloat(displayAmount.value || '0')).toString()
  emit('update:amount', finalAmount)
  emit('update:remark', remark.value)
  emit('complete')
}

const toggleDatePicker = () => {
  emit('toggleDatePicker')
}
</script>

<style scoped>
/* 注意：弹框外壳（背景/圆角/高度/弹性列布局）由 BottomScrollPopup 通过 customStyle 提供，
   这里只关心弹框内部的内容区滚动和键盘样式。 */

.form-content {
  /* body 已经是 display:flex column + flex:1 + min-height:0，scroll-view 加 flex:1 + min-height:0 即可正确滚动 */
  flex: 1;
  min-height: 0;
  padding: 24rpx 20rpx;
  padding-bottom: 100rpx;
}

.amount-display {
  padding: 32rpx 0;
  text-align: center;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8rpx;
}

.currency {
  font-size: var(--text-title);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}

.amount {
  font-size: var(--text-number-hero);
  font-weight: 700;
  color: var(--color-text-primary, #1E293B);
  letter-spacing: -1rpx;
  transition: all 0.2s ease;
}

.remark-area {
  margin-bottom: 28rpx;
}

.account-area {
  margin-bottom: 20rpx;
}

.account-row {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  background: var(--color-border-light, #F1F5F9);
  border-radius: 16rpx;
  margin-bottom: 12rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  transition: all 0.2s ease;
}

.account-row:active {
  background: var(--color-primary-light, #E6F7F5);
  transform: scale(0.98);
}

.account-label {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
  margin-right: 16rpx;
  min-width: 120rpx;
}

.account-value {
  flex: 1;
  display: flex;
  align-items: center;
}

.account-value-icon {
  width: 40rpx;
  height: 40rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.account-value-name {
  font-size: var(--text-body);
  color: var(--color-text-primary, #1E293B);
  font-weight: 500;
}

.account-value.placeholder {
  font-size: var(--text-small);
  color: var(--color-text-tertiary, #CBD5E1);
}

.account-arrow {
  font-size: var(--text-caption);
  color: var(--color-text-secondary, #94A3B8);
  margin-left: 12rpx;
}

.date-row {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  background: var(--color-border-light, #F1F5F9);
  border-radius: 16rpx;
  margin-bottom: 12rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  animation: dateRowIn 0.2s ease;
}

@keyframes dateRowIn {
  from {
    opacity: 0;
    transform: translateY(-10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.date-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 12rpx;
  flex-shrink: 0;
}

.date-label {
  font-size: var(--text-body);
  color: var(--color-text-primary, #1E293B);
  margin-right: 16rpx;
}

.date-value-row {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8rpx;
}

.date-value {
  font-size: var(--text-body);
  color: var(--color-text-primary, #1E293B);
}

.date-arrow {
  font-size: var(--text-caption);
  color: var(--color-text-secondary, #94A3B8);
}

/* 键盘：放在 BottomScrollPopup 的 footer 槽里 */
.keyboard {
  background: linear-gradient(180deg, var(--color-border-light, #F1F5F9) 0%, var(--color-border, #E2E8F0) 100%);
  border-top: 1rpx solid var(--color-border, #E2E8F0);
  padding: 16rpx 20rpx calc(16rpx + env(safe-area-inset-bottom, 0px));
  backdrop-filter: blur(10rpx);
}

.keyboard .keyboard-row {
  display: flex;
  margin-bottom: 12rpx;
}

.keyboard .keyboard-row:last-child {
  margin-bottom: 0;
}

.keyboard .key-item {
  flex: 1;
  height: 88rpx;
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 6rpx;
  font-size: var(--text-number, 36rpx);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.8);
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.keyboard .key-item:active {
  transform: scale(0.94);
  box-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.06);
}

.keyboard .key-item:first-child {
  margin-left: 0;
}

.keyboard .key-item:last-child {
  margin-right: 0;
}

.keyboard .key-item.function {
  background: var(--color-border-light, #F1F5F9);
  font-size: var(--text-body, 28rpx);
  color: var(--color-text-primary, #1E293B);
}

.keyboard .key-item.function:active {
  background: var(--color-border, #E2E8F0);
}

.keyboard .key-item.confirm {
  background: linear-gradient(135deg, var(--color-primary, #0D9488) 0%, var(--color-primary-dark, #0B7A70) 100%);
  color: var(--color-text-inverse, #FFFFFF);
  font-size: var(--text-title, 32rpx);
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(13, 148, 136, 0.35);
}

.keyboard .key-item.confirm:active {
  transform: scale(0.94);
  box-shadow: 0 2rpx 6rpx rgba(13, 148, 136, 0.25);
}

.keyboard .key-item.confirm.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.keyboard .date-text {
  font-size: var(--text-note, 22rpx);
  color: var(--color-text-primary, #1E293B);
  font-weight: 500;
}

.complete-btn-wrapper {
  padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom, 0px));
  background: var(--color-bg-card, #FFFFFF);
  border-top: 1rpx solid var(--color-border, #E2E8F0);
}

.complete-btn {
  height: 88rpx;
  background: linear-gradient(135deg, var(--color-primary, #0D9488) 0%, var(--color-primary-dark, #0B7A70) 100%);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-inverse, #FFFFFF);
  font-size: var(--text-title, 32rpx);
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(13, 148, 136, 0.35);
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.complete-btn:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 6rpx rgba(13, 148, 136, 0.25);
}

.complete-btn.disabled {
  opacity: 0.6;
  pointer-events: none;
}
</style>
