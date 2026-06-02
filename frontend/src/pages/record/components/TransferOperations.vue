<template>
  <view class="transfer-operations">
    <view class="category-grid">
      <view
        v-for="operation in operations"
        :key="operation.type"
        class="category-item"
        :class="{ selected: selectedOperation === operation.type }"
        @tap="handleOperation(operation.type)"
      >
        <view class="category-icon">
          <view class="category-icon-svg" :class="operation.iconClass"></view>
        </view>
        <text class="category-name">{{ operation.name }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'select', operation: TransferOperationType): void
}>()

type TransferOperationType = 'transfer' | 'repay-credit' | 'repay-loan' | 'lend' | 'borrow'

const selectedOperation = ref<TransferOperationType | null>(null)

const operations = [
  { type: 'transfer' as TransferOperationType, name: '转账', iconClass: 'category-icon-transfer' },
  { type: 'repay-credit' as TransferOperationType, name: '还信用卡', iconClass: 'category-icon-repay-credit' },
  { type: 'repay-loan' as TransferOperationType, name: '还贷款', iconClass: 'category-icon-repay-loan' },
  { type: 'lend' as TransferOperationType, name: '借出', iconClass: 'category-icon-lend' },
  { type: 'borrow' as TransferOperationType, name: '借入', iconClass: 'category-icon-borrow' },
]

const handleOperation = (operation: TransferOperationType) => {
  selectedOperation.value = operation
  emit('select', operation)
}
</script>

<style lang="scss" scoped>
.transfer-operations {
  padding: 24rpx;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16rpx;
  padding: 16rpx 0;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 8rpx;
  border-radius: 16rpx;
  transition: all 0.2s ease;

  &:active {
    background: rgba(0, 0, 0, 0.05);
  }

  &.selected {
    .category-icon {
      background: #6366F1;
    }
    .category-icon-svg {
      color: #FFFFFF;
    }
    .category-name {
      color: #6366F1;
      font-weight: 600;
    }
  }
}

.category-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #F1F5F9;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.category-icon-svg {
  width: 36rpx;
  height: 36rpx;
  color: #64748B;
  transition: all 0.2s ease;
}

.category-name {
  font-size: 22rpx;
  color: #475569;
  transition: all 0.2s ease;
}
</style>