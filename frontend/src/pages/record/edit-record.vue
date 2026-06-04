<template>
  <view class="edit-page">
    <view class="edit-header">
      <view class="back-btn" @tap="goBack">
        <view class="back-icon category-icon-svg category-icon-chevron-left"></view>
      </view>
      <text class="edit-title">
        {{ recordType === 'income' ? '编辑收入' : recordType === 'transfer' ? '编辑转账' : recordType === 'repayment' ? '编辑还债' : '编辑支出' }}
      </text>
      <text class="delete-btn" @tap="showDeleteConfirm">删除</text>
    </view>

    <view v-if="loading" class="loading-state">
      <text>加载中...</text>
    </view>

    <view v-else class="edit-body">
      <!-- 收支表单 -->
      <IncomeExpenseForm
        v-if="recordType !== 'transfer' && recordType !== 'repayment'"
        :date="recordDate"
        :transactionType="recordType === 'income' ? 'income' : 'expense'"
        :categoryName="categoryName"
        :selectedAccount="selectedAccount"
        :submitting="submitting"
        :initialAmount="initialAmount"
        :initialRemark="initialRemark"
        :initialAssetData="initialAssetData"
        @update:date="recordDate = $event"
        @update:amount="editAmount = $event"
        @update:remark="editRemark = $event"
        @update:selectedAccount="selectedAccount = $event"
        @update:assetData="assetDataUpdate = $event"
        @complete="handleUpdate"
        @toggleDatePicker="showDatePicker = true"
      />
      <!-- 转账表单 -->
      <TransferForm
        v-else
        :date="recordDate"
        :isTransfer="recordType === 'transfer'"
        :isRepayment="recordType === 'repayment'"
        :fromAccount="fromAccount"
        :toAccount="toAccount"
        :submitting="submitting"
        :initialAmount="initialAmount"
        :initialRemark="initialRemark"
        @update:date="recordDate = $event"
        @update:amount="editAmount = $event"
        @update:remark="editRemark = $event"
        @update:fromAccount="fromAccount = $event"
        @update:toAccount="toAccount = $event"
        @complete="handleUpdate"
        @toggleDatePicker="showDatePicker = true"
      />
    </view>

    <DatePicker :visible="showDatePicker" :date="recordDate" @update:date="recordDate = $event" @close="showDatePicker = false" />

    <view v-if="submitStatus !== 'idle'" class="loading-overlay" @tap.stop>
      <view class="loading-box">
        <view v-if="submitStatus === 'submitting'" class="loading-spinner"></view>
        <view v-else-if="submitStatus === 'success'" class="loading-check category-icon-svg category-icon-duigou"></view>
        <view v-else class="loading-check category-icon-svg category-icon-guanbi" style="background: var(--color-danger, #EF4444)"></view>
        <text class="loading-text">
          {{ submitStatus === 'submitting' ? '保存中...' : submitStatus === 'success' ? '保存成功' : '保存失败' }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import IncomeExpenseForm from './components/IncomeExpenseForm.vue'
import TransferForm from './components/TransferForm.vue'
import DatePicker from './components/DatePicker.vue'
import { recordApi } from '../../api/record'
import { getAccountList } from '../../api/account'
import { categoryApi } from '../../api/category'
import type { Account } from '../../types/account'
import type { DepreciatingAssetData } from '../../types/asset'

const recordId = ref(0)
const loading = ref(true)
const submitting = ref(false)
const submitStatus = ref<'idle' | 'submitting' | 'success' | 'error'>('idle')

const recordType = ref<'income' | 'expense' | 'transfer' | 'repayment'>('expense')
const recordDate = ref(new Date().toISOString().split('T')[0])
const editAmount = ref('')
const editRemark = ref('')
const initialAmount = ref('')
const initialRemark = ref('')
const initialAssetData = ref<DepreciatingAssetData | null>(null)
const assetDataUpdate = ref<DepreciatingAssetData | null>(null)
const categoryName = ref('')
const typeId = ref(0)
const showDatePicker = ref(false)

const selectedAccount = ref<Account | null>(null)
const fromAccount = ref<Account | null>(null)
const toAccount = ref<Account | null>(null)

const isTransfer = computed(() => recordType.value === 'transfer')
const isRepayment = computed(() => recordType.value === 'repayment')

const goBack = () => {
  uni.navigateBack()
}

const showDeleteConfirm = () => {
  uni.showModal({
    title: '确认删除',
    content: '删除后不可恢复，确定要删除这条记录吗？',
    success: async (res: any) => {
      if (res.confirm) {
        try {
          await recordApi.deleteRecord(recordId.value)
          uni.showToast({ title: '已删除', icon: 'success' })
          setTimeout(() => uni.navigateBack(), 500)
        } catch {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    },
  })
}

const loadRecord = async () => {
  try {
    const res = await recordApi.getRecord(recordId.value)
    if (!res.success || !res.data) {
      uni.showToast({ title: '记录不存在', icon: 'none' })
      setTimeout(() => uni.navigateBack(), 800)
      loading.value = false
      return
    }

    const r: any = res.data
    recordType.value = r.type
    recordDate.value = r.date
    typeId.value = r.typeId
    editRemark.value = r.remark || ''
    initialRemark.value = r.remark || ''
    const absAmount = Math.abs(r.amount).toFixed(2)
    editAmount.value = absAmount
    initialAmount.value = absAmount

    const accRes = await getAccountList()
    if (accRes.success && accRes.data) {
      const accounts = accRes.data.filter((a: Account) => !a.isDeleted)
      if (r.accountId) {
        const accountId = Number(r.accountId)
        if (isTransfer.value || isRepayment.value) {
          fromAccount.value = accounts.find((a: Account) => Number(a.id) === accountId) || null
          if (r.toAccountId) {
            const toId = Number(r.toAccountId)
            toAccount.value = accounts.find((a: Account) => Number(a.id) === toId) || null
          }
        } else {
          selectedAccount.value = accounts.find((a: Account) => Number(a.id) === accountId) || null
        }
      }
    }

    if (r.typeId) {
      try {
        const catRes = await categoryApi.getUserCategories(r.type)
        if (catRes.success && catRes.data) {
          for (const g of catRes.data) {
            const child = g.children?.find((c: any) => Number(c.id) === Number(r.typeId))
            if (child) {
              categoryName.value = child.name
              break
            }
          }
        }
      } catch { /* ignore */ }
    }

    if (r.type === 'expense') {
      try {
        const assetRes = await recordApi.getDepreciatingAssetByRecordId(recordId.value)
        if (assetRes.success && assetRes.data) {
          const a = assetRes.data
          initialAssetData.value = {
            name: a.name,
            category: a.category as any,
            depreciationMethod: a.depreciationMethod as any,
            purchasePrice: a.purchasePrice,
            purchaseDate: a.purchaseDate,
            expectedLifeMonths: a.expectedLifeMonths,
            residualValue: a.residualValue,
          }
        }
      } catch { /* ignore */ }
    }
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
  loading.value = false
}

const handleUpdate = async () => {
  if (!editAmount.value) {
    uni.showToast({ title: '请输入金额', icon: 'none' })
    return
  }
  if (submitting.value) return
  submitting.value = true
  submitStatus.value = 'submitting'

  try {
    const amount = parseFloat(editAmount.value)
    let finalAmount = amount
    if (recordType.value === 'expense' || isTransfer.value || isRepayment.value) {
      finalAmount = -Math.abs(amount)
    }

    const payload: any = {
      typeId: typeId.value,
      type: recordType.value,
      amount: finalAmount,
      remark: editRemark.value,
      date: recordDate.value,
    }

    if (isTransfer.value || isRepayment.value) {
      if (fromAccount.value) payload.accountId = Number(fromAccount.value.id)
      if (toAccount.value) payload.toAccountId = Number(toAccount.value.id)
    } else if (selectedAccount.value) {
      payload.accountId = Number(selectedAccount.value.id)
    }

    if (recordType.value === 'expense' && assetDataUpdate.value) {
      payload.depreciatingAsset = {
        name: assetDataUpdate.value.name,
        category: assetDataUpdate.value.category,
        depreciationMethod: assetDataUpdate.value.depreciationMethod,
        purchasePrice: assetDataUpdate.value.purchasePrice,
        purchaseDate: assetDataUpdate.value.purchaseDate,
        expectedLifeMonths: assetDataUpdate.value.expectedLifeMonths,
        residualValue: assetDataUpdate.value.residualValue,
      }
    }

    const res = await recordApi.updateRecord(recordId.value, payload)

    if (res.success) {
      submitStatus.value = 'success'
      setTimeout(() => uni.navigateBack(), 600)
    } else {
      submitStatus.value = 'error'
      setTimeout(() => { submitStatus.value = 'idle'; submitting.value = false }, 1200)
      uni.showToast({ title: res.message || '保存失败', icon: 'none' })
    }
  } catch (e: any) {
    submitStatus.value = 'error'
    setTimeout(() => { submitStatus.value = 'idle'; submitting.value = false }, 1200)
    uni.showToast({ title: '网络错误', icon: 'none' })
  }
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage?.options || currentPage?.$page?.options || {}
  recordId.value = parseInt(options.id) || 0
  if (recordId.value) {
    loadRecord()
  } else {
    loading.value = false
    uni.showToast({ title: '记录不存在', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 800)
  }
})
</script>

<style scoped>
.edit-page {
  min-height: 100vh;
  background: var(--color-bg-page, #F5F7FA);
}

.edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background: linear-gradient(135deg, var(--color-primary, #0D9488) 0%, var(--color-primary-dark, #0B7A70) 100%);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4rpx;
  font-size: var(--text-body);
  color: var(--color-text-inverse, #FFFFFF);
}

.back-icon {
  width: 36rpx;
  height: 36rpx;
}

.edit-title {
  font-size: var(--text-body);
  font-weight: 600;
  color: var(--color-text-inverse, #FFFFFF);
}

.delete-btn {
  font-size: var(--text-small);
  color: rgba(255, 255, 255, 0.85);
}

.loading-state {
  padding: 200rpx 0;
  text-align: center;
  font-size: var(--text-body);
  color: var(--color-text-secondary, #94A3B8);
}

.edit-body {
  padding-top: 20rpx;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(6rpx);
}

.loading-box {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 24rpx;
  padding: 48rpx 64rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  width: 56rpx;
  height: 56rpx;
  border: 4rpx solid var(--color-border, #E2E8F0);
  border-top-color: var(--color-primary, #0D9488);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-check {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  color: var(--color-text-inverse, #FFFFFF);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16rpx;
  box-sizing: border-box;
}

.loading-check {
  background: var(--color-success, #10B981);
}

.loading-text {
  font-size: var(--text-body);
  color: var(--color-text-primary, #1E293B);
  font-weight: 500;
}
</style>
