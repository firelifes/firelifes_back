<template>
  <view class="transfer-form">
      <scroll-view scroll-y class="transfer-content" :show-scrollbar="false">
        <view class="amount-display">
          <text class="currency">¥</text>
          <text class="amount">{{ displayAmount || '0.00' }}</text>
        </view>

        <view class="account-area">
          <view class="account-row" @tap="openFromAccount">
            <text class="account-label">{{ getFromAccountLabel() }}</text>
            <view class="account-value" v-if="fromAccount">
              <view class="account-value-icon category-icon-svg" :class="getAccountIconClass(fromAccount.icon, fromAccount.type)"></view>
              <text class="account-value-name">{{ fromAccount.name }}</text>
            </view>
            <text class="account-value placeholder" v-else>点击选择</text>
            <text class="account-arrow">▼</text>
          </view>
          <view class="account-row" @tap="openToAccount">
            <text class="account-label">{{ getToAccountLabel() }}</text>
            <view class="account-value" v-if="toAccount">
              <view class="account-value-icon category-icon-svg" :class="getAccountIconClass(toAccount.icon, toAccount.type)"></view>
              <text class="account-value-name">{{ toAccount.name }}</text>
            </view>
            <text class="account-value placeholder" v-else>点击选择</text>
            <text class="account-arrow">▼</text>
          </view>
        </view>

        <BorrowLendForm
          v-if="transferOperation === 'lend' || transferOperation === 'borrow'"
          :type="transferOperation === 'lend' ? 'lend' : 'borrow'"
          :accounts="[]"
          :implicitAccounts="implicitAccounts"
          :counterparties="counterparties"
          @update:direction="(val) => emit('update:direction', val)"
          @update:counterparty="(val) => emit('update:counterparty', val)"
          @update:account="(val) => emit('update:fromAccount', val)"
          @update:implicitAccount="(val) => emit('update:implicitAccount', val)"
        />

        <RepaymentSplitForm
          v-if="transferOperation === 'repay-loan'"
          :totalAmount="parseFloat(displayAmount) || 0"
          :loanAccount="toAccount"
          :selectedCategory="interestCategory"
          @update:principal="(val) => emit('update:principal', val)"
          @update:interest="(val) => emit('update:interest', val)"
          @update:interestTypeId="(val) => emit('update:interestTypeId', val)"
          @openInterestCategoryPicker="emit('openInterestCategoryPicker')"
        />

        <view class="remark-area">
          <WdTextarea
            v-model="remark"
            placeholder="点击填写备注"
            :maxlength="200"
            autoHeight
            customStyle="background: rgba(245, 246, 250, 0.8); border-radius: 20rpx; padding: 20rpx 24rpx; font-size: 28rpx;"
          />
        </view>
      </scroll-view>

      <view class="transfer-keyboard">
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
            <text>{{ submitting ? '提交中...' : getConfirmText() }}</text>
          </view>
        </view>
      </view>
    </view>

    <AccountSelectorPopup ref="fromAccountPopupRef" :title="isRepayment ? '选择还款账户' : '选择转出账户'" :filterType="isRepayment ? 'repayment' : 'transfer'" :filterRole="'from'" @select="handleFromAccountSelect" />
    <AccountSelectorPopup ref="toAccountPopupRef" :title="isRepayment ? '选择债权账户' : '选择转入账户'" :filterType="isRepayment ? 'repayment' : 'transfer'" :filterRole="'to'" :excludeAccountId="fromAccount?.id" @select="handleToAccountSelect" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Account } from '../../../types/account'
import { getAccountIconClass } from '../../../types/account'
import AccountSelectorPopup from './AccountSelectorPopup.vue'
import RepaymentSplitForm from './RepaymentSplitForm.vue'
import BorrowLendForm from './BorrowLendForm.vue'
import { getImplicitAccounts, getCounterparties } from '../../../api/account'

type TransferOperationType = 'transfer' | 'repay-credit' | 'repay-loan' | 'lend' | 'borrow'

const props = defineProps<{
  date: string
  isTransfer?: boolean
  isRepayment?: boolean
  fromAccount?: Account | null
  toAccount?: Account | null
  submitting?: boolean
  initialAmount?: string
  initialRemark?: string
  transferOperation?: TransferOperationType | null
  interestCategory?: any  // 利息分类对象 {id, name, ...}，从父组件传入
}>()

const emit = defineEmits<{
  (e: 'update:date', date: string): void
  (e: 'update:amount', amount: string): void
  (e: 'update:remark', remark: string): void
  (e: 'update:fromAccount', account: Account | null): void
  (e: 'update:toAccount', account: Account | null): void
  (e: 'update:principal', value: number): void
  (e: 'update:interest', value: number): void
  (e: 'update:interestTypeId', value: number): void
  (e: 'update:counterparty', value: string): void
  (e: 'update:direction', value: 'out' | 'in'): void
  (e: 'update:implicitAccount', account: Account | null): void
  (e: 'complete'): void
  (e: 'toggleDatePicker'): void
  (e: 'openInterestCategoryPicker'): void  // 转发到页面，由页面展示二级弹框
}>()

const displayAmount = ref('')
const remark = ref('')
const firstOperand = ref<string>('')
const operator = ref<string>('')
const waitingForSecondOperand = ref(false)
const implicitAccounts = ref<Account[]>([])
const counterparties = ref<string[]>([])

const fromAccountPopupRef = ref<InstanceType<typeof AccountSelectorPopup> | null>(null)
const toAccountPopupRef = ref<InstanceType<typeof AccountSelectorPopup> | null>(null)

const loadImplicitAccounts = async () => {
  const res = await getImplicitAccounts()
  if (res.success && res.data) {
    implicitAccounts.value = res.data
  }
}

const loadCounterparties = async () => {
  const res = await getCounterparties()
  if (res.success && res.data) {
    counterparties.value = res.data
  }
}

watch(() => props.transferOperation, async (op) => {
  if (op === 'lend' || op === 'borrow') {
    await loadImplicitAccounts()
    await loadCounterparties()
  }
})

const openFromAccount = () => {
  fromAccountPopupRef.value?.open(props.fromAccount?.id)
}

const openToAccount = () => {
  toAccountPopupRef.value?.open(props.toAccount?.id)
}

const handleFromAccountSelect = (account: Account) => {
  emit('update:fromAccount', account)
}

const handleToAccountSelect = (account: Account) => {
  emit('update:toAccount', account)
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

const getFromAccountLabel = () => {
  if (props.transferOperation === 'repay-credit' || props.transferOperation === 'repay-loan') {
    return '还款账户'
  }
  return '转出账户'
}

const getToAccountLabel = () => {
  if (props.transferOperation === 'repay-credit') {
    return '信用卡账户'
  }
  if (props.transferOperation === 'repay-loan') {
    return '贷款账户'
  }
  if (props.isRepayment) {
    return '债权账户'
  }
  return '转入账户'
}

const getConfirmText = () => {
  if (props.isRepayment) {
    return '确认还款'
  }
  if (props.transferOperation === 'repay-credit') {
    return '确认还款'
  }
  if (props.transferOperation === 'repay-loan') {
    return '确认还款'
  }
  return '确认转账'
}
</script>

<style scoped>
.transfer-form {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 32rpx 32rpx 0 0;
  backdrop-filter: blur(20rpx);
  border-top: 1rpx solid rgba(255, 255, 255, 0.5);
  /* 关键：flex column + overflow hidden，让内容区 scroll-view 独立滚动，
     键盘底部固定，从根本上消除与内嵌分类面板的双滚动条 */
  display: flex;
  flex-direction: column;
  max-height: 85vh;
  overflow: hidden;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.transfer-content {
  /* 内容区是唯一的滚动容器，flex:1 自动撑满剩余空间，键盘高度 + padding 留给键盘 */
  flex: 1;
  min-height: 0;
  padding: 24rpx 20rpx 20rpx;
  /* 隐藏滚动条但保留滚动能力，避免与分类面板的滚动条冲突 */
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

.transfer-keyboard {
  /* 键盘固定在底部，不随内容滚动 */
  flex-shrink: 0;
  background: linear-gradient(180deg, var(--color-border-light, #F1F5F9) 0%, var(--color-border, #E2E8F0) 100%);
  border-top: 1rpx solid var(--color-border, #E2E8F0);
  padding: 16rpx 20rpx calc(16rpx + env(safe-area-inset-bottom, 0px));
  backdrop-filter: blur(10rpx);
}

.transfer-keyboard .keyboard-row {
  display: flex;
  margin-bottom: 12rpx;
}

.transfer-keyboard .keyboard-row:last-child {
  margin-bottom: 0;
}

.transfer-keyboard .key-item {
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

.transfer-keyboard .key-item:active {
  transform: scale(0.94);
  box-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.06);
}

.transfer-keyboard .key-item:first-child {
  margin-left: 0;
}

.transfer-keyboard .key-item:last-child {
  margin-right: 0;
}

.transfer-keyboard .key-item.function {
  background: var(--color-border-light, #F1F5F9);
  font-size: var(--text-body, 28rpx);
  color: var(--color-text-primary, #1E293B);
}

.transfer-keyboard .key-item.function:active {
  background: var(--color-border, #E2E8F0);
}

.transfer-keyboard .key-item.confirm {
  background: linear-gradient(135deg, var(--color-primary, #0D9488) 0%, var(--color-primary-dark, #0B7A70) 100%);
  color: var(--color-text-inverse, #FFFFFF);
  font-size: var(--text-title, 32rpx);
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(13, 148, 136, 0.35);
}

.transfer-keyboard .key-item.confirm:active {
  transform: scale(0.94);
  box-shadow: 0 2rpx 6rpx rgba(13, 148, 136, 0.25);
}

.transfer-keyboard .key-item.confirm.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.transfer-keyboard .date-text {
  font-size: var(--text-note, 22rpx);
  color: var(--color-text-primary, #1E293B);
  font-weight: 500;
}
</style>
