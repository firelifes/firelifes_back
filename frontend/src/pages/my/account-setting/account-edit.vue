<template>
  <view class="account-edit-page">
    <view class="settings-header">
      <view class="header-back" @click="goBack">
        <view class="header-back-icon category-icon-svg category-icon-chevron-left"></view>
      </view>
      <text class="header-title">{{ isEdit ? '编辑账户' : '新增账户' }}</text>
    </view>

    <scroll-view class="content" scroll-y>
      <!-- 表单卡片：账户名称 + 账户余额 -->
      <view class="card">
        <view class="form-row">
          <text class="form-label">账户名称</text>
          <WdInput
            v-model="formData.name"
            placeholder="请输入账户名称"
            :maxlength="20"
            showClear
            customStyle="background: var(--color-border-light, #F1F5F9); border-radius: 10rpx;"
          />
        </view>

        <view class="form-row">
          <text class="form-label">账户余额</text>
          <view class="balance-input-wrap">
            <text class="balance-prefix">¥</text>
            <view class="balance-divider"></view>
            <view class="balance-input-area">
              <WdInput
                :model-value="balanceInput"
                @update:model-value="onBalanceInput"
                type="text"
                :placeholder="formData.type === 'liability' || formData.type === 'credit_card' ? '-0.00' : '0.00'"
                customStyle="background: transparent; border: none; padding: 0;"
              />
            </view>
          </view>
        </view>
      </view>

      <!-- 账户类型卡片 -->
      <view class="card">
        <text class="form-label">账户类型</text>
        <view class="type-grid">
          <view class="type-row">
            <view
              v-for="item in typeRow1"
              :key="item.value"
              class="type-card"
              :class="{ active: formData.type === item.value }"
              :style="formData.type === item.value ? { background: item.activeBg } : {}"
              @click="onTypeChange(item.value)"
            >
              <view class="type-card-dot" :style="{ background: item.color }"></view>
              <view class="type-card-icon category-icon-svg" :class="item.svgIcon" :style="formData.type === item.value ? { color: item.color } : {}"></view>
              <text class="type-card-label" :style="formData.type === item.value ? { color: item.color, fontWeight: '600' } : {}">{{ item.label }}</text>
            </view>
          </view>
          <view class="type-row">
            <view
              v-for="item in typeRow2"
              :key="item.value"
              class="type-card"
              :class="{ active: formData.type === item.value }"
              :style="formData.type === item.value ? { background: item.activeBg } : {}"
              @click="onTypeChange(item.value)"
            >
              <view class="type-card-dot" :style="{ background: item.color }"></view>
              <view class="type-card-icon category-icon-svg" :class="item.svgIcon" :style="formData.type === item.value ? { color: item.color } : {}"></view>
              <text class="type-card-label" :style="formData.type === item.value ? { color: item.color, fontWeight: '600' } : {}">{{ item.label }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 图标选择卡片 -->
      <view class="card">
        <text class="form-label">账户图标</text>
        <view class="icon-trigger-row" @click="showIconPicker = true">
          <view class="icon-trigger-preview category-icon-svg" :class="getAccountIconClass(formData.icon, formData.type)"></view>
          <view class="icon-trigger-info">
            <text class="icon-trigger-tips">点击可切换其他图标</text>
          </view>
          <text class="icon-trigger-arrow">›</text>
        </view>
      </view>

      <!-- 账户说明卡片 -->
      <view class="card">
        <view class="form-row">
          <text class="form-label">账户说明</text>
          <WdTextarea
            v-model="formData.description"
            placeholder="请输入账户说明（选填）"
            :maxlength="500"
            showWordCount
            autoHeight
            customStyle="background: var(--color-border-light, #F1F5F9); border-radius: 10rpx;"
          />
        </view>
      </view>

      <!-- 开关卡片 -->
      <view v-if="canSetDefault" class="card switch-card">
        <view class="switch-row">
          <view class="switch-info">
            <text class="switch-title">默认支出账户</text>
            <text class="switch-desc">记账时自动选中此账户用于支出</text>
          </view>
          <WdSwitch
            v-model="formData.isDefaultExpense"
            activeColor="var(--color-primary, #0D9488)"
          />
        </view>
        <view class="switch-divider"></view>
        <view class="switch-row">
          <view class="switch-info">
            <text class="switch-title">默认收入账户</text>
            <text class="switch-desc">收入记账时自动选中此账户</text>
          </view>
          <WdSwitch
            v-model="formData.isDefaultIncome"
            activeColor="var(--color-primary, #0D9488)"
          />
        </view>
      </view>

      <!-- 负债类贷款参数组件 -->
      <LiabilityForm
        v-if="formData.type === 'liability'"
        v-model="liabilityFields"
        :current-balance="Math.abs(formData.balance)"
        :linked-account-name="linkedAccountName"
        @pick-asset-account="showAccountPicker = true"
      />

      <!-- 信用卡参数组件 -->
      <CreditCardForm
        v-if="formData.type === 'credit_card'"
        v-model="creditCardFields"
      />

      <view class="safe-bottom"></view>
    </scroll-view>

    <!-- 保存按钮 -->
    <view class="save-section">
      <WdButton
        type="primary"
        block
        :disabled="!canSave"
        :loading="saving"
        customStyle="height: 96rpx; border-radius: 12rpx; font-size: 32rpx; font-weight: 600;"
        @click="handleSave"
      >
        保存
      </WdButton>
    </view>
  </view>

  <!-- 图标选择底部弹出面板 -->
  <wd-popup v-model="showIconPicker" position="bottom" customStyle="border-radius: 24rpx 24rpx 0 0;">
    <view class="icon-picker-popup">
      <view class="picker-header">
        <text class="picker-title">选择图标</text>
        <text class="picker-cancel" @click="showIconPicker = false">取消</text>
      </view>
      <view class="icon-picker-grid">
        <view
          v-for="icon in ACCOUNT_ICONS"
          :key="icon"
          class="icon-picker-item"
          :class="{ active: getAccountIconClass(formData.icon, formData.type) === getAccountIconClass(icon, formData.type) }"
          @click="selectIcon(icon)"
        >
          <view class="icon-picker-svg category-icon-svg" :class="icon"></view>
        </view>
      </view>
    </view>
  </wd-popup>

  <!-- 账户选择弹窗 -->
  <wd-popup v-model="showAccountPicker" position="bottom">
    <view class="account-picker-popup">
      <view class="picker-header">
        <text class="picker-title">选择关联资产账户</text>
        <text class="picker-cancel" @click="showAccountPicker = false">取消</text>
      </view>
      <view class="picker-list">
        <view
          v-for="account in assetAccounts"
          :key="account.id"
          class="picker-item"
          :class="{ selected: liabilityFields.linkedAssetAccountId === account.id }"
          @click="selectLinkedAccount(account.id)"
        >
          <view class="picker-icon category-icon-svg" :class="getAccountIconClass(account.icon, account.type)"></view>
          <text class="picker-name">{{ account.name }}</text>
          <text v-if="liabilityFields.linkedAssetAccountId === account.id" class="check-icon">✓</text>
        </view>
        <view
          v-if="liabilityFields.linkedAssetAccountId"
          class="picker-item picker-clear"
          @click="clearLinkedAccount"
        >
          <text class="picker-name clear-text">不关联任何账户</text>
        </view>
      </view>
    </view>
  </wd-popup>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getAccountDetail, createAccount, updateAccount, getAccountList } from '../../../api/account'
import { recordApi } from '../../../api/record'
import { navigateBack } from '../../../utils/navigate'
import type { Account, AccountRequest, AccountType, CreditCardFields } from '../../../types/account'
import { ACCOUNT_ICONS, getAccountIconClass } from '../../../types/account'
import LiabilityForm from './components/LiabilityForm.vue'
import type { LiabilityFormData } from './components/LiabilityForm.vue'
import CreditCardForm from './components/CreditCardForm.vue'

const accountId = ref<string | null>(null)
const isEdit = computed(() => !!accountId.value)
const account = ref<Account | null>(null)
const saving = ref(false)
const oldBalance = ref(0)
const showIconPicker = ref(false)

const TYPE_CONFIG: Record<AccountType, { color: string; svgIcon: string; label: string; activeBg: string }> = {
  cash:         { color: '#00BFFF', svgIcon: 'account-icon-wallet', label: '现金类', activeBg: 'rgba(0,191,255,0.06)' },
  investment:   { color: '#FF9800', svgIcon: 'account-icon-trending', label: '投资类', activeBg: 'rgba(255,152,0,0.06)' },
  fixed_asset:  { color: '#9C27B0', svgIcon: 'account-icon-house', label: '固定资产类', activeBg: 'rgba(156,39,176,0.06)' },
  depreciable_asset: { color: '#00BCD4', svgIcon: 'account-icon-mobile', label: '折旧资产类', activeBg: 'rgba(0,188,212,0.06)' },
  liability:    { color: '#FA3534', svgIcon: 'account-icon-loan', label: '负债类', activeBg: 'rgba(250,53,52,0.06)' },
  credit_card:  { color: '#7C3AED', svgIcon: 'account-icon-credit-card', label: '信用卡类', activeBg: 'rgba(124,58,237,0.06)' },
}

const typeRow1 = computed(() =>
  (['cash', 'investment', 'fixed_asset'] as AccountType[]).map(v => ({ value: v, ...TYPE_CONFIG[v] }))
)
const typeRow2 = computed(() =>
  (['depreciable_asset', 'liability', 'credit_card'] as AccountType[]).map(v => ({ value: v, ...TYPE_CONFIG[v] }))
)

const assetAccounts = ref<Account[]>([])
const showAccountPicker = ref(false)

const canSetDefault = computed(() => {
  return formData.value.type === 'cash' || formData.value.type === 'liability' || formData.value.type === 'credit_card'
})

const liabilityFields = ref<LiabilityFormData>({
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

const creditCardFields = ref<CreditCardFields>({
  billingDay: 5,
  dueDay: 25,
  creditLimit: undefined,
  minPaymentRate: 10,
  dailyInterestRate: 0.05,
})

const linkedAccountName = computed(() => {
  if (!liabilityFields.value.linkedAssetAccountId) return ''
  const account = assetAccounts.value.find(a => a.id === liabilityFields.value.linkedAssetAccountId)
  return account?.name || ''
})

const formData = ref<AccountRequest>({
  name: '',
  icon: 'account-icon-wallet',
  type: 'cash',
  balance: 0,
  description: '',
  isDefaultExpense: false,
  isDefaultIncome: false,
})

const balanceInput = ref('')

const canSave = computed(() => {
  return formData.value.name.trim().length > 0 &&
         formData.value.name.length <= 20 &&
         !isNaN(formData.value.balance)
})

const selectIcon = (icon: string) => {
  formData.value.icon = icon
  showIconPicker.value = false
}

const loadAccountDetail = async (id: string) => {
  try {
    const res = await getAccountDetail(id)
    if (res.success) {
      account.value = res.data
      oldBalance.value = res.data.balance
      let displayBalance = res.data.balance
      if ((res.data.type === 'liability' || res.data.type === 'credit_card') && res.data.balance > 0) {
        displayBalance = -Math.abs(res.data.balance)
      }
      formData.value = {
        name: res.data.name,
        icon: res.data.icon,
        type: res.data.type,
        balance: displayBalance,
        description: res.data.description,
        isDefaultExpense: res.data.isDefaultExpense || false,
        isDefaultIncome: res.data.isDefaultIncome || false,
      }
      if (res.data.type === 'liability') {
        liabilityFields.value = {
          autoRepaymentEnabled: !!(res.data.originalPrincipal || res.data.totalMonths || res.data.repaymentDay),
          originalPrincipal: res.data.originalPrincipal,
          annualInterestRate: res.data.annualInterestRate ?? 4.9,
          repaymentMethod: res.data.repaymentMethod || 'equal_principal_interest',
          totalMonths: res.data.totalMonths,
          remainingMonths: res.data.remainingMonths,
          repaymentDay: res.data.repaymentDay,
          linkedAssetAccountId: res.data.linkedAssetAccountId,
        }
      }
      if (res.data.type === 'credit_card' && res.data.creditCardFields) {
        creditCardFields.value = {
          billingDay: res.data.creditCardFields.billingDay ?? 5,
          dueDay: res.data.creditCardFields.dueDay ?? 25,
          creditLimit: res.data.creditCardFields.creditLimit,
          minPaymentRate: res.data.creditCardFields.minPaymentRate ?? 10,
          dailyInterestRate: res.data.creditCardFields.dailyInterestRate ?? 0.05,
        }
      }
      balanceInput.value = displayBalance.toString()
      loadAssetAccounts()
    } else {
      uni.showToast({ title: res.message || '获取账户详情失败', icon: 'none' })
    }
  } catch (err) {
    console.error('加载账户详情失败:', err)
    uni.showToast({ title: '网络错误', icon: 'none' })
  }
}

const onTypeChange = (type: AccountType) => {
  const oldType = formData.value.type
  formData.value.type = type

  if (type !== 'cash' && type !== 'liability' && type !== 'credit_card') {
    formData.value.isDefaultExpense = false
    formData.value.isDefaultIncome = false
  }

  const negativeTypes: AccountType[] = ['liability', 'credit_card']
  const wasNegative = negativeTypes.includes(oldType)
  const isNegative = negativeTypes.includes(type)

  if (isNegative && !wasNegative) {
    if (balanceInput.value !== '' && !balanceInput.value.startsWith('-')) {
      const num = parseFloat(balanceInput.value) || 0
      if (num > 0) {
        balanceInput.value = '-' + balanceInput.value
        formData.value.balance = -num
      }
    }
  } else if (!isNegative && wasNegative) {
    if (balanceInput.value.startsWith('-')) {
      const num = parseFloat(balanceInput.value) || 0
      balanceInput.value = balanceInput.value.slice(1)
      formData.value.balance = Math.abs(num)
    }
  }
}

const onBalanceInput = (value: string) => {
  const isNegative = formData.value.type === 'liability' || formData.value.type === 'credit_card'
  const regex = isNegative ? /^-?\d*\.?\d{0,2}$/ : /^\d*\.?\d{0,2}$/

  if (regex.test(value) || value === '') {
    if (value !== '') {
      const num = parseFloat(value) || 0
      if (isNegative && num > 0 && !value.startsWith('-')) {
        balanceInput.value = '-' + value
        formData.value.balance = -num
      } else {
        balanceInput.value = value
        formData.value.balance = num
      }
    } else {
      balanceInput.value = value
      formData.value.balance = 0
    }
  }
}

const createAdjustmentRecord = async (
  diff: number,
  accountIdVal: string,
  accountName: string,
  mode: 'create' | 'adjust'
) => {
  const recordType = diff > 0 ? 'adjustment_increase' : 'adjustment_decrease'

  const remark = mode === 'create'
    ? `新建账户「${accountName}」`
    : `调整账户「${accountName}」`

  const now = new Date()
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

  try {
    const res = await recordApi.createRecord({
      type: recordType,
      amount: Math.abs(diff),
      accountId: Number(accountIdVal),
      remark,
      date: dateStr,
    })
    if (res.success) {
      return true
    }
    console.error('创建调整记录失败:', res.message)
    return false
  } catch (err) {
    console.error('创建调整记录异常:', err)
    return false
  }
}

const handleSave = async () => {
  if (!canSave.value || saving.value) return

  if ((formData.value.type === 'liability' || formData.value.type === 'credit_card') && formData.value.balance > 0) {
    formData.value.balance = -Math.abs(formData.value.balance)
    if (balanceInput.value && !balanceInput.value.startsWith('-')) {
      balanceInput.value = '-' + balanceInput.value
    }
  }

  saving.value = true
  try {
    const payload: AccountRequest = {
      ...formData.value,
    }
    if (formData.value.type === 'liability') {
      payload.originalPrincipal = liabilityFields.value.originalPrincipal
      payload.annualInterestRate = liabilityFields.value.annualInterestRate
      payload.repaymentMethod = liabilityFields.value.repaymentMethod
      payload.totalMonths = liabilityFields.value.totalMonths
      payload.remainingMonths = liabilityFields.value.remainingMonths
      payload.repaymentDay = liabilityFields.value.repaymentDay
      payload.linkedAssetAccountId = liabilityFields.value.linkedAssetAccountId
    }
    if (formData.value.type === 'credit_card') {
      payload.creditCardFields = { ...creditCardFields.value }
    }

    if (isEdit.value && accountId.value) {
      const res = await updateAccount(accountId.value, payload)
      if (res.success) {
        const diff = formData.value.balance - oldBalance.value
        if (diff !== 0) {
          const recordCreated = await createAdjustmentRecord(diff, accountId.value, formData.value.name, 'adjust')
          if (!recordCreated) {
            uni.showToast({ title: '余额已保存，但调整记录生成失败', icon: 'none' })
          }
        }
        uni.showToast({ title: '修改成功', icon: 'success' })
        setTimeout(() => { navigateBack('/pages/my/account-setting/account-list') }, 1500)
      } else {
        uni.showToast({ title: res.message || '修改失败', icon: 'none' })
      }
    } else {
      const res = await createAccount(payload)
      if (res.success) {
        const newId = res.data.id
        if (formData.value.balance !== 0) {
          const recordCreated = await createAdjustmentRecord(
            formData.value.balance, newId, formData.value.name, 'create'
          )
          if (!recordCreated) {
            uni.showToast({ title: '账户已保存，但调整记录生成失败', icon: 'none' })
            setTimeout(() => { navigateBack('/pages/my/account-setting/account-list') }, 1500)
            return
          }
        }
        uni.showToast({ title: '创建成功', icon: 'success' })
        setTimeout(() => { navigateBack('/pages/my/account-setting/account-list') }, 1500)
      } else {
        uni.showToast({ title: res.message || '创建失败', icon: 'none' })
      }
    }
  } catch (err) {
    console.error('保存失败:', err)
    uni.showToast({ title: '网络错误', icon: 'none' })
  } finally {
    saving.value = false
  }
}

const loadAssetAccounts = async () => {
  try {
    const res = await getAccountList()
    if (res.success) {
      assetAccounts.value = res.data.filter((a: Account) => a.type === 'fixed_asset')
    }
  } catch (error) {
    console.error('加载资产账户失败:', error)
  }
}

const selectLinkedAccount = (id: string) => {
  liabilityFields.value.linkedAssetAccountId = id
  showAccountPicker.value = false
}

const clearLinkedAccount = () => {
  liabilityFields.value.linkedAssetAccountId = undefined
  showAccountPicker.value = false
}

const goBack = () => {
  navigateBack('/pages/my/account-setting/account-list')
}

onLoad((options: any) => {
  if (options.id) {
    accountId.value = options.id
    loadAccountDetail(options.id)
  } else {
    loadAssetAccounts()
  }
})
</script>

<style scoped>
.account-edit-page {
  min-height: 100vh;
  background-color: var(--color-bg-page, #F5F7FA);
  display: flex;
  flex-direction: column;
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
  flex: 1;
  overflow-y: auto;
  padding: 16rpx 16rpx;
  padding-bottom: 140rpx;
}

.card {
  background-color: var(--color-bg-card, #FFFFFF);
  border-radius: 24rpx;
  padding: 32rpx 28rpx;
  margin-bottom: 20rpx;
}

.icon-trigger-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.icon-trigger-preview {
  padding: 12rpx;
  border-radius: 16rpx;
  background-color: var(--color-primary-light, rgba(0, 191, 255, 0.1));
  color: var(--color-primary, #00BFFF);
  flex-shrink: 0;
}

.icon-trigger-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.icon-trigger-text {
  font-size: 28rpx;
  color: var(--color-text-primary, #1E293B);
  font-weight: 500;
  line-height: 1.4;
}

.icon-trigger-tips {
  font-size: 24rpx;
  color: var(--color-text-secondary, #94A3B8);
  line-height: 1.3;
}

.icon-trigger-arrow {
  font-size: 32rpx;
  color: var(--color-text-tertiary, #CBD5E1);
}

/* 图标底部弹出面板 */
.icon-picker-popup {
  padding: 32rpx 28rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
}

.icon-picker-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  justify-content: flex-start;
}

.icon-picker-item {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  background: var(--color-border-light, #F1F5F9);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms ease;
}

.icon-picker-item:active {
  transform: scale(0.92);
}

.icon-picker-item.active {
  background: var(--color-primary-light, #E6F7F5);
}

.icon-picker-svg {
  color: var(--color-text-primary, #333);
}

.icon-picker-item.active .icon-picker-svg {
  color: var(--color-primary, #00BFFF);
}

/* 弹出面板通用 header */
.icon-picker-popup .picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.icon-picker-popup .picker-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}

.icon-picker-popup .picker-cancel {
  font-size: 28rpx;
  color: var(--color-text-secondary, #94A3B8);
}

/* 类型选择 */
.type-grid {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.type-row {
  display: flex;
  gap: 16rpx;
}

.type-card {
  flex: 1;
  height: 112rpx;
  border-radius: 16rpx;
  background: var(--color-border-light, #F1F5F9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  transition: all 150ms ease;
}

.type-card:active {
  transform: scale(0.96);
}

.type-card-dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 4rpx;
}

.type-card-icon {
  color: var(--color-text-secondary, #94A3B8);
}

.type-card.active .type-card-icon {
  color: inherit;
}

.type-card-label {
  font-size: var(--text-note);
  color: var(--color-text-secondary, #94A3B8);
  margin-top: 2rpx;
}

/* 表单行 */
.form-row {
  margin-bottom: 32rpx;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-label {
  font-size: var(--text-small);
  color: var(--color-text-primary, #1E293B);
  font-weight: 600;
  margin-bottom: 16rpx;
}

.balance-input-wrap {
  display: flex;
  align-items: center;
  background: var(--color-border-light, #F1F5F9);
  border-radius: 10rpx;
  padding: 0 24rpx;
  height: 88rpx;
}

.balance-prefix {
  font-size: var(--text-title);
  font-weight: 700;
  color: var(--color-text-primary, #1E293B);
}

.balance-divider {
  width: 1rpx;
  height: 36rpx;
  background: var(--color-border, #E2E8F0);
  margin: 0 20rpx;
  flex-shrink: 0;
}

.balance-input-area {
  flex: 1;
}

/* 开关卡片 */
.switch-card {
  padding: 0;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx;
}

.switch-divider {
  height: 1rpx;
  background: var(--color-border-light, #F1F5F9);
  margin: 0 28rpx;
}

.switch-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  margin-right: 20rpx;
}

.switch-title {
  font-size: var(--text-body);
  color: var(--color-text-primary, #1E293B);
  font-weight: 500;
}

.switch-desc {
  font-size: var(--text-note);
  color: var(--color-text-secondary, #94A3B8);
}

/* 负债类 */
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

.option-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.option-item {
  padding: 16rpx 28rpx;
  background: var(--color-bg-card, #FFFFFF);
  border: 2rpx solid var(--color-border, #E2E8F0);
  border-radius: 12rpx;
  transition: all 0.2s ease;
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

.account-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  background: var(--color-border-light, #F1F5F9);
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

/* 保存区域 */
.save-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: var(--color-bg-page, #F5F7FA);
}

.safe-bottom {
  height: calc(env(safe-area-inset-bottom) + 20rpx);
}

/* 弹窗 */
.account-picker-popup {
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 24rpx 24rpx 0 0;
  max-height: 60vh;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 24rpx;
  border-bottom: 2rpx solid var(--color-border-light, #F1F5F9);
}

.picker-title {
  font-size: var(--text-title);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}

.picker-cancel {
  font-size: var(--text-body);
  color: var(--color-text-secondary, #94A3B8);
}

.picker-list {
  padding: 16rpx 0;
  max-height: 50vh;
  overflow-y: auto;
}

.picker-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  transition: background 0.2s ease;
}

.picker-item:active {
  background: var(--color-border-light, #F1F5F9);
}

.picker-icon {
  width: 36rpx;
  height: 36rpx;
  margin-right: 16rpx;
  color: var(--color-text-primary, #1E293B);
}

.picker-name {
  flex: 1;
  font-size: var(--text-body);
  color: var(--color-text-primary, #1E293B);
}

.check-icon {
  font-size: var(--text-body);
  color: var(--color-primary, #0D9488);
  font-weight: 600;
}

.picker-clear .picker-name {
  color: var(--color-danger, #EF4444);
  text-align: center;
}
</style>
