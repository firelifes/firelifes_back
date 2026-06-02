<template>
  <view class="transfer-operations">
    <view class="operation-grid">
      <view class="operation-card" @tap="handleOperation('transfer')">
        <view class="operation-icon transfer-icon">🔄</view>
        <text class="operation-name">转账</text>
        <text class="operation-desc">账户间资金转移</text>
      </view>
      
      <view class="operation-card" @tap="handleOperation('repay-credit')">
        <view class="operation-icon credit-icon">💳</view>
        <text class="operation-name">还信用卡</text>
        <text class="operation-desc">信用卡账单还款</text>
      </view>
      
      <view class="operation-card" @tap="handleOperation('repay-loan')">
        <view class="operation-icon loan-icon">🏠</view>
        <text class="operation-name">还贷款</text>
        <text class="operation-desc">房贷/车贷还款</text>
      </view>
      
      <view class="operation-card" @tap="handleOperation('lend')">
        <view class="operation-icon lend-icon">🤝</view>
        <text class="operation-name">借出/收回</text>
        <text class="operation-desc">借钱给别人</text>
      </view>
      
      <view class="operation-card" @tap="handleOperation('borrow')">
        <view class="operation-icon borrow-icon">📋</view>
        <text class="operation-name">借入/偿还</text>
        <text class="operation-desc">向别人借钱</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'select', operation: TransferOperationType): void
}>()

type TransferOperationType = 'transfer' | 'repay-credit' | 'repay-loan' | 'lend' | 'borrow'

const handleOperation = (operation: TransferOperationType) => {
  emit('select', operation)
}
</script>

<style lang="scss" scoped>
.transfer-operations {
  padding: 24rpx;
}

.operation-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.operation-card {
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 32rpx 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.98);
    background: #F8FAFC;
  }
}

.operation-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
}

.transfer-icon {
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
}

.credit-icon {
  background: linear-gradient(135deg, #EC4899 0%, #F43F5E 100%);
}

.loan-icon {
  background: linear-gradient(135deg, #0D9488 0%, #10B981 100%);
}

.lend-icon {
  background: linear-gradient(135deg, #F59E0B 0%, #F97316 100%);
}

.borrow-icon {
  background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
}

.operation-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1E293B;
}

.operation-desc {
  font-size: 22rpx;
  color: #94A3B8;
}
</style>