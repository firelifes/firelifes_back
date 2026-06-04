<template>
  <view class="record-page">
    <view class="header">
      <view class="header-bottom">
        <view class="header-left">
          <text class="type-btn" :class="{ active: transactionType === 'expense' }" @tap="switchType('expense')">支出</text>
          <text class="type-divider">|</text>
          <text class="type-btn" :class="{ active: transactionType === 'income' }" @tap="switchType('income')">收入</text>
          <text class="type-divider">|</text>
          <text class="type-btn" :class="{ active: transactionType === 'transfer' }" @tap="switchType('transfer')">转账</text>
        </view>
        <text class="cancel-btn" @tap="handleCancel">取消</text>
      </view>
    </view>

    <view class="content">
      <view v-if="pageLoading" class="page-loading-overlay">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载中...</text>
      </view>
      <template v-else>
        <view v-if="showDraftBanner && transactionType !== 'transfer'" class="draft-banner">
          <view class="draft-banner-inner">
            <view class="draft-icon category-icon-svg category-icon-zhangdan"></view>
            <text class="draft-text">有未完成的记账草稿</text>
            <view class="draft-actions">
              <view class="draft-btn dismiss-btn" @tap="dismissDraft">
                <text class="draft-btn-text">放弃</text>
              </view>
              <view class="draft-btn restore-btn" @tap="restoreDraft">
                <text class="draft-btn-text">恢复</text>
              </view>
            </view>
          </view>
        </view>
        <CategorySelector v-if="transactionType !== 'transfer'" ref="categorySelectorRef" :transactionType="transactionType === 'expense' ? 'expense' : 'income'" :selectedCategoryId="selectedCategory?.id || 0" @select="selectCategory" />
        <TransferOperations v-else @select="handleTransferOperation" />
      </template>
    </view>

    <WdPopup
    position="bottom"
    v-model="showTransactionForm"
    :z-index="1000"
    :modal="true"
    :close-on-click-modal="true"
    :safe-area-inset-bottom="true"
    custom-style="border-radius: 32rpx 32rpx 0 0; background: transparent; max-height: 85vh; overflow: hidden;"
    @close="handleCloseTransactionForm"
  >
    <!-- 收支表单 -->
    <IncomeExpenseForm
      v-if="transactionType !== 'transfer' && !currentTransferOperation"
      :date="selectedDate"
      :transactionType="transactionType"
      :categoryName="selectedCategory?.name"
      :selectedAccount="selectedAccount"
      :submitting="submitStatus !== 'idle'"
      :initialAmount="displayAmount"
      :initialRemark="remark"
      :initialAssetData="assetData"
      @update:date="selectedDate = $event"
      @update:amount="displayAmount = $event"
      @update:remark="remark = $event"
      @update:selectedAccount="selectedAccount = $event"
      @update:assetData="assetData = $event"
      @complete="handleComplete"
      @toggleDatePicker="showDatePicker = true"
    />
    <!-- 转账表单 -->
    <TransferForm
      v-else
      :date="selectedDate"
      :isTransfer="isTransfer"
      :isRepayment="isRepayment"
      :fromAccount="fromAccount"
      :toAccount="toAccount"
      :submitting="submitStatus !== 'idle'"
      :initialAmount="displayAmount"
      :initialRemark="remark"
      :transferOperation="currentTransferOperation"
      :interestCategory="interestCategory"
      @update:date="selectedDate = $event"
      @update:amount="displayAmount = $event"
      @update:remark="remark = $event"
      @update:fromAccount="fromAccount = $event"
      @update:toAccount="toAccount = $event"
      @update:principal="principalAmount = $event"
      @update:interest="interestAmount = $event"
      @update:interestTypeId="interestTypeId = $event"
      @update:counterparty="counterparty = $event"
      @update:direction="transferDirection = $event"
      @update:implicitAccount="implicitAccount = $event"
      @complete="handleComplete"
      @toggleDatePicker="showDatePicker = true"
      @openInterestCategoryPicker="handleOpenInterestCategoryPicker"
    />
  </WdPopup>

    <!-- 二级弹框：利息分类选择。放在页面级别（与一级 WdPopup 平级），
         z-index: 3000 > 一级的 1000，避免嵌套导致的显示问题 -->
    <InterestCategorySelectorPopup
      ref="interestCategoryPopupRef"
      @select="handleInterestCategorySelect"
      @close="handleInterestCategoryClose"
    />

    <DatePicker :visible="showDatePicker" :date="selectedDate" @update:date="selectedDate = $event" @close="showDatePicker = false" />
    <CustomTabbar />

    <view v-if="submitStatus === 'submitting'" class="loading-overlay" @tap.stop>
      <view class="loading-box">
        <view class="loading-spinner"></view>
        <text class="loading-text">记账中...</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import CategorySelector from './components/CategorySelector.vue'
import IncomeExpenseForm from './components/IncomeExpenseForm.vue'
import TransferForm from './components/TransferForm.vue'
import DatePicker from './components/DatePicker.vue'
import TransferOperations from './components/TransferOperations.vue'
import InterestCategorySelectorPopup from './components/InterestCategorySelectorPopup.vue'
import { recordApi } from '../../api/record'
import { getAccountList, getImplicitAccounts, getCounterparties } from '../../api/account'
import { categoryApi } from '../../api/category'
import type { Account } from '../../types/account'
import type { DepreciatingAssetData } from '../../types/asset'
import type { RecordType, CreateRecordData } from '../../api/record'
import CustomTabbar from '../../components/CustomTabbar.vue'
import { draft, type RecordDraft } from '../../utils/draft'
import { saveAccountMemory, findAccountByMemory } from '../../utils/record-memory'
import type { RecordData } from '../../api/record'

type TransferOperationType = 'transfer' | 'repay-credit' | 'repay-loan' | 'lend' | 'borrow'

const transactionType = ref<'income' | 'expense' | 'transfer'>('expense')
const currentTransferOperation = ref<TransferOperationType | null>(null)
const counterparties = ref<string[]>([])
const selectedCategory = ref<{ id: number; name: string; icon: string } | null>(null)
const displayAmount = ref('')
const remark = ref('')
const selectedDate = ref(new Date().toISOString().split('T')[0])
const showDatePicker = ref(false)
const showTransactionForm = ref(false)
const isSubmitting = ref(false)
const submitStatus = ref<'idle' | 'submitting' | 'success' | 'error'>('idle')
const categorySelectorRef = ref()

const pageLoading = ref(true)

const selectedAccount = ref<Account | null>(null)
const fromAccount = ref<Account | null>(null)
const toAccount = ref<Account | null>(null)
const assetData = ref<DepreciatingAssetData | null>(null)
const showDraftBanner = ref(false)
const principalAmount = ref(0)
const interestAmount = ref(0)
const interestTypeId = ref(0)
const interestCategory = ref<{ id: number; name: string; icon?: string } | null>(null)
const interestCategoryPopupRef = ref()
const counterparty = ref('')
const transferDirection = ref<'out' | 'in'>('out')
const implicitAccount = ref<Account | null>(null)
let draftData: RecordDraft | null = null
/** 标记是否刚完成记账（用于区分 onShow 是记账成功回跳还是用户主动进入） */
const justCompletedKey = 'record_just_completed'
const setJustCompleted = (value: boolean) => {
  try {
    uni.setStorageSync(justCompletedKey, value)
  } catch {}
}
const getJustCompleted = (): boolean => {
  try {
    return uni.getStorageSync(justCompletedKey) || false
  } catch {
    return false
  }
}

const isTransfer = computed(() => selectedCategory.value?.name === '转账')
const isRepayment = computed(() => selectedCategory.value?.name === '还债')

const recordType = computed<RecordType>(() => {
  if (isTransfer.value) return 'transfer'
  if (isRepayment.value) return 'repayment'
  return transactionType.value
})

onMounted(() => {
})

onUnmounted(() => {
  saveDraft()
})

/** 30小时窗口：从后端获取的最新记录 */
const latestRecord = ref<RecordData | null>(null)
const LAST_RECORD_WINDOW = 30 * 60 * 60 * 1000

/** 判断最新记录是否在30小时窗口内 */
const isLatestRecordWithinWindow = (): boolean => {
  const record = latestRecord.value
  if (!record || !record.createdAt) return false
  return Date.now() - new Date(record.createdAt).getTime() <= LAST_RECORD_WINDOW
}

/** 获取30小时窗口内的最新记录，无有效记录返回null */
const getBestRecentRecord = (): RecordData | null => {
  if (latestRecord.value && latestRecord.value.createdAt && isLatestRecordWithinWindow()) {
    return latestRecord.value
  }
  return null
}

const fetchLatestRecord = async () => {
  try {
    console.log('[SmartMemory] fetchLatestRecord 开始...')
    const res = await recordApi.getLatestRecord()
    console.log('[SmartMemory] fetchLatestRecord 结果:', JSON.stringify({ success: res.success, hasData: !!res.data, data: res.data ? { id: res.data.id, date: res.data.date, type: res.data.type, accountId: res.data.accountId, createdAt: res.data.createdAt } : null }))
    if (res.success && res.data) {
      latestRecord.value = res.data
      console.log('[SmartMemory] latestRecord 已设置, within30h:', isLatestRecordWithinWindow())
    } else {
      latestRecord.value = null
      console.log('[SmartMemory] latestRecord 为 null')
    }
  } catch (e) {
    console.error('[SmartMemory] fetchLatestRecord 异常:', e)
    latestRecord.value = null
  }
}

/** 应用30小时内最新记录：恢复日期和交易类型，无记录返回false */
const applyRecentRecord = async (): Promise<boolean> => {
  const record = getBestRecentRecord()
  console.log('[SmartMemory] applyRecentRecord, bestRecentRecord:', record ? { id: record.id, date: record.date, type: record.type, accountId: record.accountId } : 'null')
  if (!record) return false

  selectedDate.value = record.date
  console.log('[SmartMemory] 设置 selectedDate =', selectedDate.value)
  if (record.type === 'expense' || record.type === 'income') {
    transactionType.value = record.type
    console.log('[SmartMemory] 设置 transactionType =', transactionType.value)
  }
  // 如果有账户信息，尝试恢复账户（需要先加载账户列表）
  if (record.accountId) {
    try {
      const res = await getAccountList()
      console.log('[SmartMemory] getAccountList 结果:', res.success, 'count:', res.data?.length)
      if (res.success && res.data && res.data.length > 0) {
        const accounts = res.data.filter(a => !a.isDeleted && a.isVisible)
        if (record.type === 'expense') {
          const expenseAccounts = accounts.filter(a => a.type === 'cash' || a.type === 'liability')
          const matched = expenseAccounts.find(a => a.id === String(record.accountId)) as Account | undefined
          console.log('[SmartMemory] applyRecentRecord 账户匹配: record.accountId=', record.accountId, 'String后=', String(record.accountId), 'matched=', matched?.name || '未匹配')
          if (matched) {
            selectedAccount.value = matched
          }
        } else if (record.type === 'income') {
          const incomeAccounts = accounts.filter(a => a.type !== 'liability')
          const matched = incomeAccounts.find(a => a.id === String(record.accountId)) as Account | undefined
          console.log('[SmartMemory] applyRecentRecord 收入账户匹配:', matched?.name || '未匹配')
          if (matched) {
            selectedAccount.value = matched
          }
        }
      }
    } catch (e) {
      console.error('[SmartMemory] applyRecentRecord getAccountList 异常:', e)
    }
  }
  return true
}

onShow(async () => {
  console.log('[SmartMemory] onShow 触发, draftExists:', draft.hasValidDraft(), 'justCompleted:', getJustCompleted())
  pageLoading.value = true
  try {
    await fetchLatestRecord()

    if (draft.hasValidDraft()) {
      draftData = draft.load()
      showDraftBanner.value = true
      console.log('[SmartMemory] 草稿存在，显示 banner')
      return
    }

    if (getJustCompleted()) {
      console.log('[SmartMemory] justCompleted=true，记账成功回跳')
      setJustCompleted(false)
      await applyRecentRecord()
      partialReset()
    } else {
      console.log('[SmartMemory] 用户主动进入')
      const hasRecent = await applyRecentRecord()
      console.log('[SmartMemory] applyRecentRecord 结果:', hasRecent)
      if (hasRecent) {
        selectedCategory.value = null
        displayAmount.value = ''
        remark.value = ''
        fromAccount.value = null
        toAccount.value = null
        assetData.value = null
        console.log('[SmartMemory] 30h窗口命中, selectedDate=', selectedDate.value, 'selectedAccount=', selectedAccount.value?.name || 'null')
      } else {
        console.log('[SmartMemory] 30h窗口未命中或无记录，resetForm')
        resetForm()
      }
    }
  } finally {
    pageLoading.value = false
    console.log('[SmartMemory] pageLoading=false, 页面就绪')
  }
})

/** 记账成功后的部分重置：清空金额/备注，保留日期/分类/账户，方便连续记账 */
const partialReset = () => {
  displayAmount.value = ''
  remark.value = ''
  assetData.value = null
  // 以下字段保持不变，延续上一笔：
  // selectedDate — 沿用上一笔日期
  // selectedCategory — 保持当前分类，方便继续记同分类
  // selectedAccount / fromAccount / toAccount — 保持当前账户
  // 利息分类状态保留：连续记录同类贷款还款时无需重新选择
}

const resetForm = () => {
  transactionType.value = 'expense'
  selectedCategory.value = null
  displayAmount.value = ''
  remark.value = ''
  selectedDate.value = new Date().toISOString().split('T')[0]
  selectedAccount.value = null
  fromAccount.value = null
  toAccount.value = null
  principalAmount.value = 0
  interestAmount.value = 0
  interestTypeId.value = 0
  interestCategory.value = null
  categorySelectorRef.value?.reload?.()
}

const switchType = (type: 'income' | 'expense' | 'transfer') => {
  transactionType.value = type
  selectedCategory.value = null
  selectedAccount.value = null
  fromAccount.value = null
  toAccount.value = null
  currentTransferOperation.value = null
}

const handleTransferOperation = async (operation: TransferOperationType) => {
  currentTransferOperation.value = operation
  
  const res = await getAccountList()
  if (res.success && res.data) {
    const accounts = res.data.filter(a => !a.isDeleted && a.isVisible)
    
    switch (operation) {
      case 'transfer': {
        const nonLiability = accounts.filter(a => a.type !== 'liability')
        fromAccount.value = nonLiability.find(a => a.isDefaultExpense) || nonLiability[0] || null
        toAccount.value = accounts.find(a => a.id !== fromAccount.value?.id) || null
        break
      }
      case 'repay-credit': {
        const assetAccounts = accounts.filter(a => ['cash', 'investment', 'fixed_asset', 'depreciable_asset'].includes(a.type))
        const creditAccounts = accounts.filter(a => a.type === 'credit_card')
        fromAccount.value = assetAccounts.find(a => a.isDefaultExpense) || assetAccounts[0] || null
        toAccount.value = creditAccounts[0] || null
        if (!creditAccounts.length) {
          uni.showToast({ title: '请先创建信用卡账户', icon: 'none' })
          return
        }
        break
      }
      case 'repay-loan': {
        const assetAccounts = accounts.filter(a => ['cash', 'investment', 'fixed_asset', 'depreciable_asset'].includes(a.type))
        const loanAccounts = accounts.filter(a => a.type === 'liability')
        fromAccount.value = assetAccounts.find(a => a.isDefaultExpense) || assetAccounts[0] || null
        toAccount.value = loanAccounts[0] || null
        if (!loanAccounts.length) {
          uni.showToast({ title: '请先创建贷款账户', icon: 'none' })
          return
        }
        break
      }
      case 'lend':
      case 'borrow': {
        const assetAccounts = accounts.filter(a => ['cash', 'investment', 'fixed_asset', 'depreciable_asset'].includes(a.type))
        fromAccount.value = assetAccounts.find(a => a.isDefaultExpense) || assetAccounts[0] || null
        
        const counterRes = await getCounterparties()
        if (counterRes.success && counterRes.data) {
          counterparties.value = counterRes.data
        }
        break
      }
    }
  }
  
  showTransactionForm.value = true
}

const saveDraft = () => {
  const hasData = selectedCategory.value || displayAmount.value || remark.value
  if (!hasData && transactionType.value === 'expense') return

  draft.save({
    transactionType: transactionType.value,
    categoryId: selectedCategory.value?.id || null,
    categoryName: selectedCategory.value?.name || '',
    categoryIcon: selectedCategory.value?.icon || '',
    displayAmount: displayAmount.value,
    remark: remark.value,
    selectedDate: selectedDate.value,
    accountId: selectedAccount.value ? Number(selectedAccount.value.id) : null,
    accountName: selectedAccount.value?.name || '',
    accountIcon: selectedAccount.value?.icon || '',
    fromAccountId: fromAccount.value ? Number(fromAccount.value.id) : null,
    fromAccountName: fromAccount.value?.name || '',
    toAccountId: toAccount.value ? Number(toAccount.value.id) : null,
    toAccountName: toAccount.value?.name || '',
  })
}

const dismissDraft = async () => {
  draft.remove()
  showDraftBanner.value = false
  draftData = null
  console.log('[SmartMemory] dismissDraft, 应用30h窗口...')
  const hasRecent = await applyRecentRecord()
  if (hasRecent) {
    selectedCategory.value = null
    displayAmount.value = ''
    remark.value = ''
    fromAccount.value = null
    toAccount.value = null
    assetData.value = null
    console.log('[SmartMemory] dismissDraft 30h命中, selectedDate=', selectedDate.value, 'selectedAccount=', selectedAccount.value?.name || 'null')
  } else {
    console.log('[SmartMemory] dismissDraft 30h未命中, resetForm')
    resetForm()
  }
}

const restoreDraft = () => {
  if (!draftData) return
  const d = draftData
  transactionType.value = d.transactionType
  selectedDate.value = d.selectedDate
  displayAmount.value = d.displayAmount
  remark.value = d.remark

  if (d.categoryId) {
    selectedCategory.value = {
      id: d.categoryId,
      name: d.categoryName,
      icon: d.categoryIcon
    }
  }

  showDraftBanner.value = false
  draftData = null
}

const selectCategory = async (category: { id: number; name: string; icon: string }) => {
  if (pageLoading.value) {
    uni.showToast({ title: '页面初始化中，请稍候...', icon: 'none' })
    return
  }

  selectedCategory.value = category

  if (category.name === '转账' || category.name === '还债') {
    fromAccount.value = null
    toAccount.value = null
  }

  try {
    const res = await getAccountList()
    if (res.success && res.data && res.data.length > 0) {
      const accounts = res.data.filter(a => !a.isDeleted && a.isVisible)

      if (category.name === '转账') {
        // 先查记忆
        const memoryFrom = findAccountByMemory('transfer_from', undefined, accounts)
        const nonLiability = accounts.filter(a => a.type !== 'liability')
        if (memoryFrom) {
          fromAccount.value = memoryFrom as Account
        } else {
          fromAccount.value = nonLiability.find(a => a.isDefaultExpense) || nonLiability[0] || null
        }
        const memoryTo = findAccountByMemory('transfer_to', undefined, accounts.filter(a => a.id !== fromAccount.value?.id))
        toAccount.value = memoryTo
          ? (memoryTo as Account)
          : accounts.find(a => a.id !== fromAccount.value?.id) || null
      } else if (category.name === '还债') {
        const nonLiability = accounts.filter(a => a.type !== 'liability')
        const liabilities = accounts.filter(a => a.type === 'liability')
        // 先查记忆
        const memoryFrom = findAccountByMemory('repayment_from', undefined, nonLiability)
        fromAccount.value = memoryFrom
          ? (memoryFrom as Account)
          : nonLiability.find(a => a.isDefaultExpense) || nonLiability[0] || null
        const memoryTo = findAccountByMemory('repayment_to', undefined, liabilities)
        toAccount.value = memoryTo
          ? (memoryTo as Account)
          : liabilities[0] || null
      } else if (transactionType.value === 'expense') {
        const expenseAccounts = accounts.filter(a => a.type === 'cash' || a.type === 'liability')
        console.log('[SmartMemory] selectCategory expense, expenseAccounts:', expenseAccounts.map(a => ({ id: a.id, name: a.name })))
        // 优先：如果已有 selectedAccount 且在可用列表中，保留它
        let useExisting = false
        if (selectedAccount.value) {
          console.log('[SmartMemory] selectCategory selectedAccount 已存在:', selectedAccount.value.name, 'id:', selectedAccount.value.id)
          const existingInList = expenseAccounts.find(a => a.id === selectedAccount.value!.id)
          if (existingInList) {
            console.log('[SmartMemory] selectCategory 保留已选账户:', existingInList.name)
            selectedAccount.value = existingInList
            useExisting = true
          } else {
            console.log('[SmartMemory] selectCategory 已选账户不在可用列表中')
          }
        }
        if (!useExisting) {
          // 30小时窗口：优先用最新记录的账户（需在30小时内）
          const recent = getBestRecentRecord()
          console.log('[SmartMemory] selectCategory 30h窗口检查, recent:', recent ? { id: recent.id, type: recent.type, accountId: recent.accountId } : 'null')
          if (recent && recent.type === 'expense' && recent.accountId) {
            const matched = expenseAccounts.find(a => a.id === String(recent.accountId)) as Account | undefined
            console.log('[SmartMemory] selectCategory 30h窗口匹配: recent.accountId=', recent.accountId, 'matched=', matched?.name || '未匹配')
            if (matched) {
              selectedAccount.value = matched
              selectedDate.value = recent.date
              console.log('[SmartMemory] selectCategory 同步日期为:', selectedDate.value)
            }
          }
        }
        if (!selectedAccount.value) {
          console.log('[SmartMemory] selectCategory 回退到分类记忆/默认账户')
          // 回退：分类记忆 → 默认账户
          const memoryAccount = findAccountByMemory('expense', category.id, expenseAccounts)
          selectedAccount.value = memoryAccount
            ? (memoryAccount as Account)
            : expenseAccounts.find(a => a.isDefaultExpense) || expenseAccounts[0] || null
          console.log('[SmartMemory] selectCategory 最终账户:', selectedAccount.value?.name)
        }
      } else {
        const incomeAccounts = accounts.filter(a => a.type !== 'liability')
        // 优先：如果已有 selectedAccount 且在可用列表中，保留它
        let useExisting = false
        if (selectedAccount.value) {
          const existingInList = incomeAccounts.find(a => a.id === selectedAccount.value!.id)
          if (existingInList) {
            selectedAccount.value = existingInList
            useExisting = true
          }
        }
        if (!useExisting) {
          // 30小时窗口：优先用最新记录的账户（需在30小时内）
          const recent = getBestRecentRecord()
          if (recent && recent.type === 'income' && recent.accountId) {
            const matched = incomeAccounts.find(a => a.id === String(recent.accountId)) as Account | undefined
            if (matched) {
              selectedAccount.value = matched
              selectedDate.value = recent.date
              console.log('[SmartMemory] selectCategory 收入同步日期为:', selectedDate.value)
            }
          }
        }
        if (!selectedAccount.value) {
          // 回退：分类记忆 → 默认账户
          const memoryAccount = findAccountByMemory('income', category.id, incomeAccounts)
          selectedAccount.value = memoryAccount
            ? (memoryAccount as Account)
            : incomeAccounts.find(a => a.isDefaultIncome) || incomeAccounts[0] || null
        }
      }
    }
  } catch (error) {
    console.error('加载账户列表失败:', error)
  }

  showTransactionForm.value = true
}

const handleCloseTransactionForm = () => {
  showTransactionForm.value = false
  // 关键：一级弹框关闭时，必须同步关闭未关闭的二级弹框，避免残留弹框
  interestCategoryPopupRef.value?.close?.()
  saveDraft()
}

// 还贷款时，利息分类默认选择「利息支出」
const ensureDefaultInterestCategory = async () => {
  try {
    const res = await categoryApi.getUserCategories('expense')
    if (res && res.success && Array.isArray(res.data)) {
      // 遍历所有分组，查找名为「利息支出」的分类
      for (const group of res.data) {
        const list: any[] = (group as any).children || []
        const found = list.find(c => c && c.name === '利息支出')
        if (found) {
          interestCategory.value = {
            id: found.id,
            name: found.name,
            icon: found.iconUrl, // 与 InterestCategorySelectorPopup 选中时返回的 icon 字段保持一致
          }
          interestTypeId.value = found.id
          return
        }
      }
    }
    // 找不到时清空，让用户手动选择
    interestCategory.value = null
    interestTypeId.value = 0
  } catch (e) {
    console.error('[还贷款] 加载默认利息分类失败:', e)
    interestCategory.value = null
    interestTypeId.value = 0
  }
}

// 监听转账操作类型：进入还贷款 → 自动选中利息支出；进入其他操作 → 清空
watch(currentTransferOperation, (op) => {
  if (op === 'repay-loan') {
    ensureDefaultInterestCategory()
  } else {
    interestCategory.value = null
    interestTypeId.value = 0
  }
})

// 一级弹框（TransferForm）触发：唤起页面级二级弹框（利息分类选择）
// 关键：弹框在页面级渲染（与一级平级），z-index 3000 > 一级 1000，
// 避免嵌套弹框之间的显示冲突
const handleOpenInterestCategoryPicker = () => {
  interestCategoryPopupRef.value?.open(interestCategory.value?.id)
}

// 二级弹框选中分类：同步 id 与分类对象，下传到一级弹框
const handleInterestCategorySelect = (category: { id: number; name: string; icon?: string }) => {
  interestCategory.value = category
  interestTypeId.value = category.id
}

const handleInterestCategoryClose = () => {
  // 二级弹框关闭，无需特殊处理
}

const handleCancel = () => {
  saveDraft()
  uni.reLaunch({ url: '/pages/detail/index' })
}

const handleComplete = async () => {
  if (!displayAmount.value) {
    uni.showToast({ title: '请输入金额', icon: 'none' })
    return
  }
  if (!selectedCategory.value) {
    uni.showToast({ title: '请选择分类', icon: 'none' })
    return
  }

  if (isTransfer.value || isRepayment.value) {
    if (!fromAccount.value) {
      uni.showToast({ title: isRepayment.value ? '请选择还款账户' : '请选择转出账户', icon: 'none' })
      return
    }
    if (!toAccount.value) {
      uni.showToast({ title: isRepayment.value ? '请选择债权账户' : '请选择转入账户', icon: 'none' })
      return
    }
    if (fromAccount.value.id === toAccount.value.id) {
      uni.showToast({ title: '转出和转入账户不能相同', icon: 'none' })
      return
    }
  }

  if (isSubmitting.value) return
  isSubmitting.value = true
  submitStatus.value = 'submitting'

  try {
    const amount = parseFloat(displayAmount.value)
    const finalAmount = transactionType.value === 'expense' || isTransfer.value || isRepayment.value ? -Math.abs(amount) : Math.abs(amount)

    const payload: CreateRecordData = {
      typeId: selectedCategory.value.id,
      type: recordType.value,
      amount: finalAmount,
      remark: remark.value,
      date: selectedDate.value
    }

    if (isTransfer.value || isRepayment.value) {
      payload.accountId = parseInt(fromAccount.value!.id)
      payload.toAccountId = parseInt(toAccount.value!.id)
    } else if (selectedAccount.value) {
      payload.accountId = parseInt(selectedAccount.value.id)
    }

    // 如果记入了折旧资产，附加资产数据
    if (assetData.value) {
      payload.depreciatingAsset = {
        name: assetData.value.name,
        category: assetData.value.category,
        depreciationMethod: assetData.value.depreciationMethod,
        purchasePrice: assetData.value.purchasePrice,
        purchaseDate: assetData.value.purchaseDate,
        expectedLifeMonths: assetData.value.expectedLifeMonths,
        residualValue: assetData.value.residualValue,
      }
    }

    const res = await recordApi.createRecord(payload)

    if (res.success) {
      // 写入账户记忆
      if (isTransfer.value) {
        if (fromAccount.value) saveAccountMemory('transfer_from', undefined, fromAccount.value.id)
        if (toAccount.value) saveAccountMemory('transfer_to', undefined, toAccount.value.id)
      } else if (isRepayment.value) {
        if (fromAccount.value) saveAccountMemory('repayment_from', undefined, fromAccount.value.id)
        if (toAccount.value) saveAccountMemory('repayment_to', undefined, toAccount.value.id)
      } else if (transactionType.value === 'expense' && selectedAccount.value) {
        saveAccountMemory('expense', selectedCategory.value!.id, selectedAccount.value.id)
      } else if (transactionType.value === 'income' && selectedAccount.value) {
        saveAccountMemory('income', selectedCategory.value!.id, selectedAccount.value.id)
      }

      draft.remove()
      submitStatus.value = 'idle'
      isSubmitting.value = false
      showTransactionForm.value = false
      setJustCompleted(true)
      uni.showToast({ title: '记账成功', icon: 'success' })
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/detail/index' })
      }, 800)
    } else {
      submitStatus.value = 'error'
      setTimeout(() => {
        submitStatus.value = 'idle'
        isSubmitting.value = false
      }, 1200)
      uni.showToast({ title: res.message || '记账失败', icon: 'none' })
    }
  } catch (error) {
    submitStatus.value = 'error'
    setTimeout(() => {
      submitStatus.value = 'idle'
      isSubmitting.value = false
    }, 1200)
    uni.showToast({ title: '网络错误', icon: 'none' })
    console.error('记账失败:', error)
  }
}

</script>

<style>
.record-page {
  min-height: 100vh;
  background: var(--color-bg-page, #F5F7FA);
  padding-top: 120rpx;
  padding-bottom: 80px;
}

.header {
  background: linear-gradient(135deg, var(--color-primary, #0D9488) 0%, var(--color-primary-dark, #0B7A70) 100%);
  padding: 20rpx 30rpx;
  color: var(--color-text-inverse, #FFFFFF);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 80;
  box-shadow: 0 4rpx 20rpx rgba(13, 148, 136, 0.3);
  backdrop-filter: blur(10rpx);
}

.header-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
}

.content {
  position: relative;
  overflow-y: auto;
  padding-bottom: 20rpx;
}

.content.has-form {
  padding-bottom: 500rpx;
}

.type-btn {
  font-size: 32rpx;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  padding: 10rpx 30rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.type-btn.active {
  color: var(--color-text-inverse, #FFFFFF);
}

.type-btn.active::after {
  content: '';
  position: absolute;
  bottom: -5rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 6rpx;
  background: var(--color-text-inverse, #FFFFFF);
  border-radius: 3rpx;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10rpx);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.type-divider {
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.3);
  font-weight: 200;
}

.cancel-btn {
  font-size: 28rpx;
  color: var(--color-text-inverse, #FFFFFF);
  padding: 10rpx 24rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(5rpx);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.cancel-btn:active {
  transform: scale(0.95);
  background: rgba(255, 255, 255, 0.25);
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8rpx);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.loading-box {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  border-radius: 20rpx;
  padding: 48rpx 64rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08), 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.8);
  animation: popIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes popIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.loading-spinner {
  width: 56rpx;
  height: 56rpx;
  border: 4rpx solid var(--color-primary-light, #E6F7F5);
  border-top-color: var(--color-primary, #0D9488);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-check {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary, #0D9488) 0%, var(--color-primary-dark, #0B7A70) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: var(--color-text-inverse, #FFFFFF);
  font-weight: bold;
  box-shadow: 0 4rpx 16rpx rgba(13, 148, 136, 0.35);
  animation: checkPop 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes checkPop {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: var(--color-text-primary, #1E293B);
  font-size: 28rpx;
  font-weight: 500;
}

.draft-banner {
  margin: 16rpx 24rpx 0 24rpx;
  animation: draftSlideDown 0.2s ease;
}

@keyframes draftSlideDown {
  from { opacity: 0; transform: translateY(-16rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.draft-banner-inner {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  background: rgba(13, 148, 136, 0.08);
  border-radius: 16rpx;
}

.draft-icon {
  width: 28rpx;
  height: 28rpx;
  margin-right: 12rpx;
}

.draft-text {
  flex: 1;
  font-size: 26rpx;
  color: var(--color-text-primary, #1E293B);
}

.draft-actions {
  display: flex;
  gap: 16rpx;
}

.draft-btn {
  padding: 8rpx 24rpx;
  border-radius: 24rpx;
}

.draft-btn-text {
  font-size: 24rpx;
  font-weight: 500;
}

.dismiss-btn {
  background: transparent;
}

.dismiss-btn .draft-btn-text {
  color: var(--color-text-secondary, #94A3B8);
}

.restore-btn {
  background: var(--color-primary, #0D9488);
}

.restore-btn .draft-btn-text {
  color: var(--color-text-inverse, #FFFFFF);
}

.page-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-page, #F5F7FA);
  z-index: 50;
  min-height: 60vh;
  gap: 24rpx;
}
</style>
