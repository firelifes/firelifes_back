<template>
  <!-- V20260528-1 -->
  <view class="transaction-form">
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

    <view class="account-area" v-if="isTransfer || isRepayment || transferOperation === 'transfer'">
      <view class="account-row" @tap="openFromAccount">
        <text class="account-label">{{ isRepayment ? '还款账户' : '转出账户' }}</text>
        <view class="account-value" v-if="fromAccount">
          <view class="account-value-icon category-icon-svg" :class="getAccountIconClass(fromAccount.icon, fromAccount.type)"></view>
          <text class="account-value-name">{{ fromAccount.name }}</text>
        </view>
        <text class="account-value placeholder" v-else>点击选择</text>
        <text class="account-arrow">▼</text>
      </view>
      <view class="account-row" @tap="openToAccount">
        <text class="account-label">{{ isRepayment ? '债权账户' : '转入账户' }}</text>
        <view class="account-value" v-if="toAccount">
          <view class="account-value-icon category-icon-svg" :class="getAccountIconClass(toAccount.icon, toAccount.type)"></view>
          <text class="account-value-name">{{ toAccount.name }}</text>
        </view>
        <text class="account-value placeholder" v-else>点击选择</text>
        <text class="account-arrow">▼</text>
      </view>
    </view>

    <view class="account-area" v-if="transferOperation === 'repay-credit'">
      <view class="account-row" @tap="openFromAccount">
        <text class="account-label">还款账户</text>
        <view class="account-value" v-if="fromAccount">
          <view class="account-value-icon category-icon-svg" :class="getAccountIconClass(fromAccount.icon, fromAccount.type)"></view>
          <text class="account-value-name">{{ fromAccount.name }}</text>
        </view>
        <text class="account-value placeholder" v-else>点击选择</text>
        <text class="account-arrow">▼</text>
      </view>
      <view class="account-row" @tap="openToAccount">
        <text class="account-label">信用卡账户</text>
        <view class="account-value" v-if="toAccount">
          <view class="account-value-icon category-icon-svg" :class="getAccountIconClass(toAccount.icon, toAccount.type)"></view>
          <text class="account-value-name">{{ toAccount.name }}</text>
        </view>
        <text class="account-value placeholder" v-else>点击选择</text>
        <text class="account-arrow">▼</text>
      </view>
    </view>

    <view class="account-area" v-if="transferOperation === 'repay-loan'">
      <view class="account-row" @tap="openFromAccount">
        <text class="account-label">还款账户</text>
        <view class="account-value" v-if="fromAccount">
          <view class="account-value-icon category-icon-svg" :class="getAccountIconClass(fromAccount.icon, fromAccount.type)"></view>
          <text class="account-value-name">{{ fromAccount.name }}</text>
        </view>
        <text class="account-value placeholder" v-else>点击选择</text>
        <text class="account-arrow">▼</text>
      </view>
      <view class="account-row" @tap="openToAccount">
        <text class="account-label">贷款账户</text>
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
      :interestCategories="[]"
      @update:principal="(val) => emit('update:principal', val)"
      @update:interest="(val) => emit('update:interest', val)"
      @update:interestTypeId="(val) => emit('update:interestTypeId', val)"
      @interestCategoryPopupOpen="interestCategoryPopupVisible = true"
      @interestCategoryPopupClose="interestCategoryPopupVisible = false"
    />

    <view class="account-area" v-if="!isTransfer && !isRepayment && !transferOperation">
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
      :purchaseDate="props.date"
      :defaultName="categoryName"
      :initialData="props.initialAssetData"
      @update:assetData="handleAssetDataChange"
    />

    <view v-if="!showAssetFields && !interestCategoryPopupVisible" class="keyboard">
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
          <text>{{ submitting ? '提交中...' : (isTransfer ? '确认转账' : isRepayment ? '确认还款' : '完成') }}</text>
        </view>
      </view>
    </view>

    <view v-if="showAssetFields" class="complete-btn-wrapper">
      <view class="complete-btn" :class="{ disabled: submitting }" @tap="!submitting && handleComplete()">
        <text>{{ submitting ? '提交中...' : '完  成' }}</text>
      </view>
    </view>

    <AccountSelectorPopup ref="accountPopupRef" :title="'选择账户'" :filterType="transactionType" @select="handleAccountSelect" />
    <AccountSelectorPopup ref="fromAccountPopupRef" :title="isRepayment ? '选择还款账户' : '选择转出账户'" :filterType="isRepayment ? 'repayment' : 'transfer'" :filterRole="'from'" @select="handleFromAccountSelect" />
    <AccountSelectorPopup ref="toAccountPopupRef" :title="isRepayment ? '选择债权账户' : '选择转入账户'" :filterType="isRepayment ? 'repayment' : 'transfer'" :filterRole="'to'" :excludeAccountId="fromAccount?.id" @select="handleToAccountSelect" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Account } from '../../../types/account'
import { getAccountIconClass } from '../../../types/account'
import type { DepreciatingAssetData } from '../../../types/asset'
import AccountSelectorPopup from './AccountSelectorPopup.vue'
import AssetFields from './AssetFields.vue'
import RepaymentSplitForm from './RepaymentSplitForm.vue'
import BorrowLendForm from './BorrowLendForm.vue'
import { getImplicitAccounts, getCounterparties } from '../../../api/account'

type TransferOperationType = 'transfer' | 'repay-credit' | 'repay-loan' | 'lend' | 'borrow'

const props = defineProps<{
  date: string
  transactionType: 'income' | 'expense' | 'transfer'
  categoryName?: string
  isTransfer?: boolean
  isRepayment?: boolean
  fromAccount?: Account | null
  toAccount?: Account | null
  selectedAccount?: Account | null
  submitting?: boolean
  initialAmount?: string
  initialRemark?: string
  initialAssetData?: DepreciatingAssetData | null
  transferOperation?: TransferOperationType | null
}>()

const emit = defineEmits<{
  (e: 'update:date', date: string): void
  (e: 'update:amount', amount: string): void
  (e: 'update:remark', remark: string): void
  (e: 'update:fromAccount', account: Account | null): void
  (e: 'update:toAccount', account: Account | null): void
  (e: 'update:selectedAccount', account: Account | null): void
  (e: 'update:assetData', data: DepreciatingAssetData | null): void
  (e: 'update:principal', value: number): void
  (e: 'update:interest', value: number): void
  (e: 'update:interestTypeId', value: number): void
  (e: 'update:counterparty', value: string): void
  (e: 'update:direction', value: 'out' | 'in'): void
  (e: 'update:implicitAccount', account: Account | null): void
  (e: 'complete'): void
  (e: 'toggleDatePicker'): void
}>()

const interestCategoryPopupVisible = ref(false)

const displayAmount = ref('')
const remark = ref('')
const firstOperand = ref<string>('')
const operator = ref<string>('')
const waitingForSecondOperand = ref(false)
const showAssetFields = ref(false)
const implicitAccounts = ref<Account[]>([])
const counterparties = ref<string[]>([])

const accountPopupRef = ref<InstanceType<typeof AccountSelectorPopup> | null>(null)
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

const openAccount = () => {
  accountPopupRef.value?.open(props.selectedAccount?.id)
}

const openFromAccount = () => {
  fromAccountPopupRef.value?.open(props.fromAccount?.id)
}

const openToAccount = () => {
  toAccountPopupRef.value?.open(props.toAccount?.id)
}

const handleAccountSelect = (account: Account) => {
  emit('update:selectedAccount', account)
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
  console.log('[TransactionForm] formattedDate computed, props.date=', props.date, 'parsed=', dateStr, 'today=', todayStr, 'isToday=', dateStr === todayStr)
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

watch(() => props.transactionType, () => {
  displayAmount.value = ''
  firstOperand.value = ''
  operator.value = ''
  waitingForSecondOperand.value = false
  emit('update:amount', '')
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
.transaction-form {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 32rpx 32rpx 0 0;
  padding: 24rpx 20rpx;
  padding-bottom: 100rpx;
  backdrop-filter: blur(20rpx);
  border-top: 1rpx solid rgba(255, 255, 255, 0.5);
  max-height: 80vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
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
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
  margin-right: 16rpx;
  min-width: 100rpx;
}

.date-value-row {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.date-value {
  font-size: var(--text-body);
  color: var(--color-text-primary, #1E293B);
  font-weight: 500;
}

.date-arrow {
  font-size: var(--text-caption);
  color: var(--color-text-secondary, #94A3B8);
}

.complete-btn-wrapper {
  padding: 28rpx 20rpx 40rpx;
  animation: completeBtnIn 0.2s ease;
}

@keyframes completeBtnIn {
  from {
    opacity: 0;
    transform: translateY(10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.complete-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, var(--color-primary, #0D9488) 0%, var(--color-primary-dark, #0B7A70) 100%);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-title);
  font-weight: 600;
  color: var(--color-text-inverse, #FFFFFF);
  box-shadow: 0 4rpx 16rpx rgba(13, 148, 136, 0.3);
  transition: all 0.15s ease;
}

.complete-btn:active {
  transform: scale(0.97);
  opacity: 0.9;
}

.complete-btn.disabled {
  opacity: 0.6;
}

.keyboard {
  background: linear-gradient(180deg, var(--color-border-light, #F1F5F9) 0%, var(--color-border, #E2E8F0) 100%);
  border-radius: 24rpx;
  padding: 20rpx;
  backdrop-filter: blur(10rpx);
}

.keyboard-row {
  display: flex;
  margin-bottom: 16rpx;
}

.keyboard-row:last-child {
  margin-bottom: 0;
}

.key-item {
  flex: 1;
  height: 96rpx;
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 8rpx;
  font-size: var(--text-number);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.8);
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(5rpx);
}

.key-item:active {
  transform: scale(0.95);
  background: var(--color-bg-card, #FFFFFF);
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.06);
}

.key-item:first-child {
  margin-left: 0;
}

.key-item:last-child {
  margin-right: 0;
}

.key-item.function {
  background: var(--color-border-light, #F1F5F9);
  font-size: var(--text-body);
  color: var(--color-text-primary, #1E293B);
}

.key-item.function:active {
  background: var(--color-border, #E2E8F0);
}

.key-item.confirm {
  background: linear-gradient(135deg, var(--color-primary, #0D9488) 0%, var(--color-primary-dark, #0B7A70) 100%);
  color: var(--color-text-inverse, #FFFFFF);
  font-size: var(--text-title);
  font-weight: 600;
  box-shadow: 0 6rpx 20rpx rgba(13, 148, 136, 0.4);
}

.key-item.confirm:active {
  transform: scale(0.95);
  box-shadow: 0 4rpx 12rpx rgba(13, 148, 136, 0.3);
}

.key-item.confirm.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.date-text {
  font-size: var(--text-note);
  color: var(--color-text-primary, #1E293B);
  font-weight: 500;
}
</style>
