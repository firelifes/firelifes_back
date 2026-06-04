<template>
  <view class="account-selector">
    <view class="account-search" v-if="searchable">
      <input class="search-input" v-model="searchKeyword" placeholder="搜索账户..." />
    </view>

    <scroll-view class="account-list" scroll-y>
      <view v-show="filteredAccounts.length > 0">
        <view class="section-title">资产账户</view>
        <view
          v-for="account in filteredAccounts.filter(a => a.type !== 'liability')"
          :key="account.id"
          class="account-item"
          :class="{ selected: selectedId === account.id }"
          @click="selectAccount(account)"
        >
          <view class="account-icon category-icon-svg" :class="getAccountIconClass(account.icon, account.type)"></view>
          <view class="account-info">
            <text class="account-name">{{ account.name }}</text>
          </view>
          <text class="account-balance" :class="account.type === 'liability' ? 'negative' : 'positive'">
            {{ formatBalance(account.balance) }}
          </text>
          <view class="check-mark category-icon-svg category-icon-duigou" v-if="selectedId === account.id"></view>
        </view>
      </view>

      <view v-show="filteredAccounts.filter(a => a.type === 'liability').length > 0">
        <view class="section-title">负债账户</view>
        <view
          v-for="account in filteredAccounts.filter(a => a.type === 'liability')"
          :key="account.id"
          class="account-item"
          :class="{ selected: selectedId === account.id }"
          @click="selectAccount(account)"
        >
          <view class="account-icon category-icon-svg" :class="getAccountIconClass(account.icon, account.type)"></view>
          <view class="account-info">
            <text class="account-name">{{ account.name }}</text>
          </view>
          <text class="account-balance negative">
            {{ formatBalance(account.balance) }}
          </text>
          <view class="check-mark category-icon-svg category-icon-duigou" v-if="selectedId === account.id"></view>
        </view>
      </view>

      <view v-if="filteredAccounts.length === 0 && !loading" class="empty-state">
        <text class="empty-text">{{ emptyText }}</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { Account } from '../../../types/account'
import { getAccountIconClass } from '../../../types/account'

const props = defineProps<{
  filterType?: 'expense' | 'income' | 'transfer' | 'repayment' | 'repay-credit' | 'repay-loan' | 'lend' | 'borrow'
  filterRole?: 'from' | 'to'
  excludeAccountId?: string
  searchable?: boolean
  emptyText?: string
}>()

const emit = defineEmits<{
  (e: 'select', account: Account): void
}>()

const selectedId = ref<string>('')
const searchKeyword = ref('')
const loading = ref(true)
const accounts = ref<Account[]>([])

const filteredAccounts = computed(() => {
  let list = accounts.value

  if (props.filterType) {
    list = getFilteredAccounts(list, props.filterType, props.filterRole || 'from')
  }

  if (props.excludeAccountId) {
    list = list.filter(a => a.id !== props.excludeAccountId)
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(a => a.name.toLowerCase().includes(keyword))
  }

  return list
})

const getFilteredAccounts = (
  allAccounts: Account[],
  transactionType: string,
  role: string
): Account[] => {
  switch (transactionType) {
    case 'expense':
      return allAccounts.filter(a =>
        !a.isDeleted && a.isVisible && (a.type === 'cash' || a.type === 'liability')
      )

    case 'income':
      return allAccounts.filter(a =>
        !a.isDeleted && a.isVisible && a.type !== 'liability'
      )

    case 'transfer':
      return allAccounts.filter(a => !a.isDeleted && a.isVisible)

    case 'repayment':
      if (role === 'from') {
        return allAccounts.filter(a =>
          !a.isDeleted && a.isVisible && a.type !== 'liability'
        )
      } else {
        return allAccounts.filter(a =>
          !a.isDeleted && a.isVisible && a.type === 'liability'
        )
      }

    case 'repay-credit':
      if (role === 'from') {
        return allAccounts.filter(a =>
          !a.isDeleted && a.isVisible && ['cash', 'investment', 'fixed_asset', 'depreciable_asset'].includes(a.type)
        )
      } else {
        return allAccounts.filter(a =>
          !a.isDeleted && a.isVisible && a.type === 'credit_card'
        )
      }

    case 'repay-loan':
      if (role === 'from') {
        return allAccounts.filter(a =>
          !a.isDeleted && a.isVisible && ['cash', 'investment', 'fixed_asset', 'depreciable_asset'].includes(a.type)
        )
      } else {
        return allAccounts.filter(a =>
          !a.isDeleted && a.isVisible && a.type === 'liability'
        )
      }

    case 'lend':
      if (role === 'from') {
        return allAccounts.filter(a =>
          !a.isDeleted && a.isVisible && ['cash', 'investment', 'fixed_asset', 'depreciable_asset'].includes(a.type)
        )
      } else {
        return allAccounts.filter(a =>
          !a.isDeleted && a.isVisible && a.type === 'receivable'
        )
      }

    case 'borrow':
      if (role === 'from') {
        return allAccounts.filter(a =>
          !a.isDeleted && a.isVisible && a.type === 'payable'
        )
      } else {
        return allAccounts.filter(a =>
          !a.isDeleted && a.isVisible && ['cash', 'investment', 'fixed_asset', 'depreciable_asset'].includes(a.type)
        )
      }

    default:
      return allAccounts.filter(a => !a.isDeleted && a.isVisible)
  }
}

const formatBalance = (balance: number) => {
  const abs = Math.abs(balance)
  if (abs >= 10000) {
    return '¥' + (abs / 10000).toFixed(1) + '万'
  }
  return '¥' + abs.toFixed(2)
}

const selectAccount = (account: Account) => {
  selectedId.value = account.id
  emit('select', account)
}

const loadAccounts = async () => {
  try {
    loading.value = true
    const { getAccountList } = await import('../../../api/account')
    const res = await getAccountList()
    if (res.success && res.data) {
      accounts.value = res.data
      // 如果没有已选中的账户，自动选择默认账户
      if (!selectedId.value) {
        autoSelectDefaultAccount()
      }
    }
  } catch (error) {
    console.error('加载账户列表失败:', error)
  } finally {
    loading.value = false
  }
}

const autoSelectDefaultAccount = () => {
  const availableAccounts = getFilteredAccounts(
    accounts.value,
    props.filterType || 'expense',
    props.filterRole || 'from'
  )

  if (availableAccounts.length === 0) return

  // 根据交易类型选择对应的默认账户
  let defaultAccount: Account | null = null

  if (props.filterType === 'expense' || props.filterType === 'transfer') {
    // 支出/转出：选择默认支出账户
    defaultAccount = availableAccounts.find(a => a.isDefaultExpense) || null
  } else if (props.filterType === 'income') {
    // 收入：选择默认收入账户
    defaultAccount = availableAccounts.find(a => a.isDefaultIncome) || null
  } else if (props.filterType === 'repayment') {
    if (props.filterRole === 'from') {
      // 还款-从：选择默认支出账户
      defaultAccount = availableAccounts.find(a => a.isDefaultExpense) || null
    } else {
      // 还款-到：选择负债类的第一个
      defaultAccount = availableAccounts[0] || null
    }
  }

  // 如果没有找到默认账户，选择排序最靠前的
  if (!defaultAccount) {
    defaultAccount = availableAccounts.sort((a, b) => a.order - b.order)[0]
  }

  if (defaultAccount) {
    selectAccount(defaultAccount)
  }
}

const setSelected = (accountId?: string) => {
  selectedId.value = accountId || ''
}

watch(() => props.filterType, () => {
  selectedId.value = ''
  searchKeyword.value = ''
  // 切换类型时重新自动选择默认账户
  if (accounts.value.length > 0) {
    autoSelectDefaultAccount()
  }
})

onMounted(() => {
  loadAccounts()
})

defineExpose({
  setSelected,
  reload: loadAccounts
})
</script>

<style scoped>
.account-selector {
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.account-search {
  padding: 16rpx 24rpx;
  flex-shrink: 0;
}

.search-input {
  height: 72rpx;
  background: var(--color-border-light, #F1F5F9);
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: var(--text-body);
  color: var(--color-text-primary, #1E293B);
}

.account-list {
  flex: 1;
  height: 100%;
}

.section-title {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
  padding: 20rpx 24rpx 12rpx;
}

.account-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  margin: 0 16rpx 12rpx;
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.account-item:active {
  transform: scale(0.98);
  background: var(--color-primary-light, #E6F7F5);
}

.account-item.selected {
  background: var(--color-primary-light, #E6F7F5);
  box-shadow: 0 0 0 2rpx var(--color-primary, #0D9488);
}

.account-icon {
  width: 40rpx;
  height: 40rpx;
  margin-right: 20rpx;
  color: var(--color-text-primary, #333);
}

.account-info {
  flex: 1;
}

.account-name {
  font-size: var(--text-body);
  color: var(--color-text-primary, #1E293B);
  font-weight: 500;
}

.account-balance {
  font-size: var(--text-small);
  font-weight: 600;
  margin-right: 12rpx;
}

.account-balance.positive {
  color: var(--color-success, #10B981);
}

.account-balance.negative {
  color: var(--color-danger, #EF4444);
}

.check-mark {
  width: 28rpx;
  height: 28rpx;
  color: var(--color-primary, #0D9488);
}

.empty-state {
  padding: 80rpx;
  text-align: center;
}

.empty-text {
  font-size: var(--text-body);
  color: var(--color-text-secondary, #94A3B8);
}
</style>
