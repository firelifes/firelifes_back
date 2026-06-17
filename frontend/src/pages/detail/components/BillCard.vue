<template>
  <view class="bill-card">
    <view class="bill-date">
      <text class="date-text">{{ formattedDate }}</text>
      <view class="day-totals">
        <text class="day-income">收入 {{ dayIncome }}</text>
        <text class="day-expense">支出 -{{ dayExpense }}</text>
      </view>
    </view>
    <view
      v-for="(item, index) in records"
      :key="item.id"
      class="bill-item-wrap"
      :class="{ 'bill-item-wrap-last': index === records.length - 1 }"
    >
      <wd-swipe-action :right-width="70">
        <template #default>
          <view class="bill-item" @tap="handleItemTap(item)">
            <view class="bill-item-left">
              <view class="category-icon" :style="{ backgroundColor: item.categoryColor }" @tap.stop="handleCategoryTap(item)">
                <view class="category-icon-svg" :class="item.categoryIcon"></view>
              </view>
              <view class="bill-item-info">
                <text class="bill-item-name">{{ item.displayName }}</text>
              </view>
            </view>
            <text class="bill-item-amount" :class="{ 'adjustment': isNeutral(item) }">
              {{ amountPrefix(item) }}{{ formatAmount(item.amount) }}
            </text>
          </view>
        </template>
        <template #right>
          <view class="delete-btn" @tap.stop="handleDelete(item)">
            <text class="delete-btn-text">删除</text>
          </view>
        </template>
      </wd-swipe-action>
    </view>
  </view>
</template>

<script setup lang="ts">
export interface BillCardRecord {
  id: number
  typeId: number
  type: 'income' | 'expense' | 'transfer' | 'repayment' | 'adjustment_increase' | 'adjustment_decrease'
  amount: number
  displayName: string
  categoryIcon: string
  categoryColor: string
}

defineProps<{
  formattedDate: string
  dayIncome: string
  dayExpense: string
  records: BillCardRecord[]
}>()

const emit = defineEmits<{
  'record-tap': [record: BillCardRecord]
  'category-tap': [record: BillCardRecord]
  'record-delete': [record: BillCardRecord]
}>()

const handleItemTap = (item: BillCardRecord) => {
  emit('record-tap', item)
}

const handleCategoryTap = (item: BillCardRecord) => {
  emit('category-tap', item)
}

const handleDelete = (item: BillCardRecord) => {
  emit('record-delete', item)
}

const formatAmount = (amount: number) => {
  return Math.abs(amount).toFixed(2)
}

const isNeutral = (item: BillCardRecord) => {
  return item.type === 'adjustment_increase' || item.type === 'adjustment_decrease' || item.type === 'transfer' || item.type === 'repayment'
}

const amountPrefix = (item: BillCardRecord) => {
  if (item.type === 'adjustment_increase') return '+'
  if (item.type === 'adjustment_decrease') return '-'
  if (item.type === 'expense') return '-'
  if (item.type === 'transfer' || item.type === 'repayment') return '→'
  return '+'
}
</script>

<style scoped>
.bill-card {
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.bill-date {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 28rpx;
  border-bottom: 1rpx solid var(--color-border, #E2E8F0);
}

.date-text {
  font-size: var(--text-body);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}

.day-totals {
  display: flex;
  gap: 24rpx;
}

.day-income {
  font-size: var(--text-note);
  color: var(--color-text-secondary, #94A3B8);
}

.day-expense {
  font-size: var(--text-note);
  color: var(--color-text-secondary, #94A3B8);
}

.bill-item-wrap {
  border-bottom: 1rpx solid var(--color-border, #E2E8F0);
  overflow: hidden;
}

.bill-item-wrap:last-child,
.bill-item-wrap-last {
  border-bottom: none;
}

.bill-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 28rpx;
  transition: background 0.15s ease;
}

.bill-item:active {
  background: var(--color-border-light, #F1F5F9);
}

.bill-item-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex: 1;
  min-width: 0;
}

.category-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}


.bill-item-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.bill-item-name {
  font-size: var(--text-body);
  font-weight: 500;
  color: var(--color-text-primary, #1E293B);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bill-item-amount {
  font-size: var(--text-title);
  font-weight: 600;
  flex-shrink: 0;
  margin-left: 20rpx;
  color: var(--color-text-primary, #1E293B);
}

.bill-item-amount.adjustment {
  color: var(--color-text-secondary, #94A3B8);
}

.delete-btn {
  width: 70px;
  height: 100%;
  background: var(--color-danger, #EF4444);
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn-text {
  font-size: var(--text-small);
  font-weight: 600;
  color: var(--color-text-inverse, #FFFFFF);
}
</style>
