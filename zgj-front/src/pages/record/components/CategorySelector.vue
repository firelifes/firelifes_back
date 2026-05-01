<template>
  <view class="category-selector">
    <view class="category-grid">
      <view
        v-for="(category, index) in categories"
        :key="index"
        class="category-item"
        :class="{ selected: selectedCategory === category.name }"
        @click="selectCategory(category)"
      >
        <view class="category-icon">
          {{ category.icon }}
        </view>
        <text class="category-name">{{ category.name }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  transactionType: 'income' | 'expense'
  selectedCategory: string
}>()

const emit = defineEmits<{
  (e: 'select', category: { name: string; icon: string }): void
}>()

const expenseCategories = [
  { name: '餐饮', icon: '🍜' },
  { name: '购物', icon: '🛍️' },
  { name: '日用', icon: '🧻' },
  { name: '交通', icon: '🚌' },
  { name: '零食', icon: '🍰' },
  { name: '运动', icon: '🚴' },
  { name: '娱乐', icon: '🎮' },
  { name: '通讯', icon: '📱' },
  { name: '服饰', icon: '👔' },
  { name: '住房', icon: '🏠' },
  { name: '居家', icon: '🛋️' },
  { name: '孩子', icon: '👶' },
  { name: '长辈', icon: '👴' },
  { name: '社交', icon: '💬' },
  { name: '旅行', icon: '✈️' },
  { name: '数码', icon: '📱' },
  { name: '汽车', icon: '🚗' },
  { name: '医疗', icon: '💊' },
  { name: '书籍', icon: '📚' },
  { name: '学习', icon: '🎓' },
  { name: '礼金', icon: '🧧' },
  { name: '礼物', icon: '🎁' },
  { name: '办公', icon: '💼' },
  { name: '维修', icon: '🔧' },
  { name: '捐赠', icon: '❤️' },
  { name: '彩票', icon: '🎰' },
  { name: '亲友', icon: '👨‍👩‍👧‍👦' },
  { name: '快递', icon: '📦' },
  { name: '日用品', icon: '🧺' },
  { name: '游戏', icon: '🎮' },
  { name: '储蓄', icon: '💰' },
  { name: '其他', icon: '📦' }
]

const incomeCategories = [
  { name: '工资', icon: '💼' },
  { name: '奖金', icon: '🎁' },
  { name: '投资', icon: '📈' },
  { name: '礼金', icon: '🧧' },
  { name: '兼职', icon: '👔' },
  { name: '理财', icon: '💰' },
  { name: '报销', icon: '📋' },
  { name: '其他', icon: '📦' }
]

const categories = computed(() => {
  return props.transactionType === 'expense' ? expenseCategories : incomeCategories
})

const selectCategory = (category: { name: string; icon: string }) => {
  emit('select', category)
}
</script>

<style scoped>
.category-selector {
  padding: 20rpx;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30rpx 20rpx;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.category-item:active {
  transform: scale(0.95);
}

.category-icon {
  width: 88rpx;
  height: 88rpx;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  margin-bottom: 12rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(5rpx);
  border: 1rpx solid rgba(255, 255, 255, 0.5);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.category-item.selected .category-icon {
  background: linear-gradient(135deg, #FFD166 0%, #FFC145 100%);
  color: #fff;
  box-shadow: 0 8rpx 20rpx rgba(255, 209, 102, 0.4);
  transform: scale(1.05);
  animation: bounceIn 0.4s ease;
}

@keyframes bounceIn {
  0% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1.05);
    opacity: 1;
  }
}

.category-name {
  font-size: 24rpx;
  color: #5C6B7A;
  text-align: center;
  line-height: 1.3;
  font-weight: 500;
  transition: all 0.3s ease;
}

.category-item.selected .category-name {
  color: #FFB347;
  font-weight: 600;
}
</style>