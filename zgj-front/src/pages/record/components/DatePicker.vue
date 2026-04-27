<template>
  <view v-if="visible" class="date-picker-overlay" @click="close">
    <view class="date-picker-content" @click.stop>
      <view class="picker-header">
        <text class="picker-cancel" @click="close">取消</text>
        <text class="picker-title">选择日期</text>
        <text class="picker-confirm" @click="confirm">确定</text>
      </view>
      <view class="picker-body">
        <view class="picker-columns">
          <view class="picker-column">
            <view
              v-for="year in years"
              :key="year"
              class="picker-item"
              :class="{ active: year === selectedYear }"
              @click="selectYear(year)"
            >
              {{ year }}
            </view>
          </view>
          <view class="picker-column">
            <view
              v-for="month in months"
              :key="month"
              class="picker-item"
              :class="{ active: month === selectedMonth }"
              @click="selectMonth(month)"
            >
              {{ month }}
            </view>
          </view>
          <view class="picker-column">
            <view
              v-for="day in days"
              :key="day"
              class="picker-item"
              :class="{ active: day === selectedDay }"
              @click="selectDay(day)"
            >
              {{ day }}
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  visible: boolean
  date: string
}>()

const emit = defineEmits<{
  (e: 'update:date', date: string): void
  (e: 'close'): void
}>()

const currentDate = new Date(props.date)
const selectedYear = ref(currentDate.getFullYear())
const selectedMonth = ref(currentDate.getMonth() + 1)
const selectedDay = ref(currentDate.getDate())

const years = computed(() => {
  const result = []
  const currentYear = new Date().getFullYear()
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    result.push(i)
  }
  return result
})

const months = computed(() => {
  const result = []
  for (let i = 1; i <= 12; i++) {
    result.push(i)
  }
  return result
})

const days = computed(() => {
  const result = []
  const daysInMonth = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
  for (let i = 1; i <= daysInMonth; i++) {
    result.push(i)
  }
  return result
})

watch(() => props.date, (newDate) => {
  const date = new Date(newDate)
  selectedYear.value = date.getFullYear()
  selectedMonth.value = date.getMonth() + 1
  selectedDay.value = date.getDate()
})

const selectYear = (year: number) => {
  selectedYear.value = year
}

const selectMonth = (month: number) => {
  selectedMonth.value = month
  // 调整日期，确保不超过当月天数
  const daysInMonth = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
  if (selectedDay.value > daysInMonth) {
    selectedDay.value = daysInMonth
  }
}

const selectDay = (day: number) => {
  selectedDay.value = day
}

const confirm = () => {
  const date = new Date(selectedYear.value, selectedMonth.value - 1, selectedDay.value)
  emit('update:date', date.toISOString().split('T')[0])
  emit('close')
}

const close = () => {
  emit('close')
}
</script>

<style scoped>
.date-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

.date-picker-content {
  background-color: #fff;
  border-radius: 16rpx 16rpx 0 0;
  width: 100%;
  max-height: 70vh;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #e0e0e0;
}

.picker-cancel {
  font-size: 28rpx;
  color: #999;
}

.picker-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.picker-confirm {
  font-size: 28rpx;
  color: #FFD166;
  font-weight: bold;
}

.picker-body {
  padding: 30rpx;
  max-height: 50vh;
  overflow-y: auto;
}

.picker-columns {
  display: flex;
  justify-content: space-around;
}

.picker-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15rpx;
}

.picker-item {
  font-size: 28rpx;
  color: #666;
  padding: 15rpx 20rpx;
  border-radius: 8rpx;
  transition: all 0.3s;
}

.picker-item.active {
  color: #FFD166;
  font-weight: bold;
  background-color: rgba(255, 209, 102, 0.1);
}
</style>