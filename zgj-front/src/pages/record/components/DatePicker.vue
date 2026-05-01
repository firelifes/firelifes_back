<template>
  <view v-if="visible" class="date-picker-overlay" @click="close">
    <view class="date-picker-content" @click.stop>
      <view class="picker-header">
        <text class="picker-cancel" @click="close">取消</text>
        <text class="picker-title">选择日期</text>
        <text class="picker-confirm" @click="confirm">确定</text>
      </view>
      <view class="picker-body">
        <picker-view 
          :value="pickerValue" 
          :indicator-style="{ height: '80rpx' }"
          :item-height="80"
          class="picker-view"
          @change="onChange"
        >
          <picker-view-column>
            <view v-for="year in years" :key="year" class="picker-item">
              {{ year }}
            </view>
          </picker-view-column>
          <picker-view-column>
            <view v-for="month in months" :key="month" class="picker-item">
              {{ month }}
            </view>
          </picker-view-column>
          <picker-view-column>
            <view v-for="day in days" :key="day" class="picker-item">
              {{ day }}
            </view>
          </picker-view-column>
        </picker-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps<{
  visible: boolean
  date: string
}>()

const emit = defineEmits<{
  (e: 'update:date', date: string): void
  (e: 'close'): void
}>()

// 当前日期
const today = new Date()

// 年份列表
const years = computed(() => {
  const result = []
  const currentYear = today.getFullYear()
  for (let i = currentYear - 10; i <= currentYear + 10; i++) {
    result.push(i)
  }
  return result
})

// 月份列表
const months = computed(() => {
  const result = []
  for (let i = 1; i <= 12; i++) {
    result.push(i)
  }
  return result
})

// 日期列表（根据年月动态计算）
const selectedYear = ref(today.getFullYear())
const selectedMonth = ref(today.getMonth() + 1)

const days = computed(() => {
  const result = []
  const daysInMonth = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
  for (let i = 1; i <= daysInMonth; i++) {
    result.push(i)
  }
  return result
})

// picker-view 的选中值 [年索引, 月索引, 日索引]
const pickerValue = ref([0, 0, 0])

// 更新选中值
const updateSelectedValues = () => {
  const yearIndex = years.value.indexOf(selectedYear.value)
  const monthIndex = months.value.indexOf(selectedMonth.value)
  const dayIndex = days.value.indexOf(selectedDay.value)
  pickerValue.value = [yearIndex, monthIndex, dayIndex]
}

// 选中的日期
const selectedDay = ref(today.getDate())

// 日期变化时
const onChange = (e: any) => {
  const [yearIndex, monthIndex, dayIndex] = e.detail.value
  
  selectedYear.value = years.value[yearIndex]
  selectedMonth.value = months.value[monthIndex]
  
  // 确保日期不超出当月范围
  const daysInMonth = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
  selectedDay.value = Math.min(days.value[dayIndex], daysInMonth)
  
  // 更新picker值以确保日期正确
  setTimeout(() => {
    const newDayIndex = days.value.indexOf(selectedDay.value)
    pickerValue.value = [yearIndex, monthIndex, newDayIndex]
  }, 0)
}

// 格式化日期
const formatDate = () => {
  const year = selectedYear.value
  const month = String(selectedMonth.value).padStart(2, '0')
  const day = String(selectedDay.value).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 确认选择
const confirm = () => {
  emit('update:date', formatDate())
  close()
}

// 关闭弹窗
const close = () => {
  emit('close')
}

// 监听外部日期变化
watch(() => props.date, (newDate) => {
  if (newDate) {
    const date = new Date(newDate)
    selectedYear.value = date.getFullYear()
    selectedMonth.value = date.getMonth() + 1
    selectedDay.value = date.getDate()
    updateSelectedValues()
  }
})

// 监听月份变化，确保日期有效
watch([selectedYear, selectedMonth], () => {
  const daysInMonth = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
  if (selectedDay.value > daysInMonth) {
    selectedDay.value = daysInMonth
  }
})

// 组件挂载时初始化
onMounted(() => {
  if (props.date) {
    const date = new Date(props.date)
    selectedYear.value = date.getFullYear()
    selectedMonth.value = date.getMonth() + 1
    selectedDay.value = date.getDate()
  } else {
    selectedYear.value = today.getFullYear()
    selectedMonth.value = today.getMonth() + 1
    selectedDay.value = today.getDate()
  }
  updateSelectedValues()
})
</script>

<style scoped>
.date-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5rpx);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.date-picker-content {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 32rpx 32rpx 0 0;
  width: 100%;
  max-height: 70vh;
  box-shadow: 0 -10rpx 40rpx rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(20rpx);
  border-top: 1rpx solid rgba(255, 255, 255, 0.6);
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid rgba(229, 231, 235, 0.6);
}

.picker-cancel {
  font-size: 28rpx;
  color: #9CA3AF;
  font-weight: 500;
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
  transition: all 0.2s ease;
}

.picker-cancel:active {
  background: rgba(156, 163, 175, 0.1);
  color: #6B7280;
}

.picker-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #2D3436;
}

.picker-confirm {
  font-size: 28rpx;
  color: #FFB347;
  font-weight: 600;
  padding: 8rpx 20rpx;
  border-radius: 12rpx;
  transition: all 0.2s ease;
}

.picker-confirm:active {
  background: rgba(255, 179, 71, 0.15);
  transform: scale(0.95);
}

.picker-body {
  padding: 20rpx 0;
  height: 420rpx;
}

.picker-view {
  width: 100%;
  height: 420rpx;
}

.picker-item {
  font-size: 30rpx;
  color: #6C757D;
  padding: 20rpx 0;
  text-align: center;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  transition: all 0.2s ease;
}

.picker-item.active {
  color: #2D3436;
  font-weight: 600;
  font-size: 34rpx;
}
</style>
