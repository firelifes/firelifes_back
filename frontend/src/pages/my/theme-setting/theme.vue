<template>
  <view class="theme-container">
    <view class="settings-header">
      <view class="header-back" @click="goBack">
        <view class="header-back-icon category-icon-svg category-icon-chevron-left"></view>
      </view>
      <text class="header-title">主题设置</text>
    </view>

    <view class="section">
      <view class="section-title">预设主题</view>
      <view class="presets-row">
        <view
          v-for="preset in presets"
          :key="preset.name"
          class="preset-card"
          :class="{ active: activePreset === preset.name }"
          :style="{ background: preset.colors['--color-primary-light'] }"
          @click="selectPreset(preset.name)"
        >
          <view
            class="preset-dot"
            :style="{ background: preset.colors['--color-primary'] }"
          ></view>
          <text
            class="preset-label"
            :style="{ color: preset.colors['--color-primary'] }"
          >{{ preset.label }}</text>
          <text
            v-if="activePreset === preset.name"
            class="preset-check"
            :style="{ color: preset.colors['--color-primary'] }"
          >✓</text>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-title">自定义颜色</view>
      <view class="color-card">
        <view
          v-for="token in editableTokens"
          :key="token.key"
          class="color-row"
          @click="openPicker(token)"
        >
          <text class="color-label">{{ token.label }}</text>
          <view class="color-value-row">
            <text class="color-value-text">{{ state.colors[token.key] }}</text>
            <view
              class="color-circle"
              :style="{ background: state.colors[token.key] }"
            ></view>
          </view>
        </view>
      </view>
    </view>

    <view class="reset-area">
      <view class="reset-btn" @click="handleReset">
        <text class="reset-text">恢复默认</text>
      </view>
    </view>

    <view v-if="showPicker" class="picker-overlay" @click="closePicker">
      <view class="picker-sheet" @click.stop>
        <view class="picker-header">
          <text class="picker-title">选择颜色</text>
        </view>
        <view class="picker-preview" :style="{ background: pickerValue }">
          <text class="picker-preview-text">{{ pickerValue }}</text>
        </view>
        <view class="picker-input-area">
          <text class="picker-label">{{ pickerTarget?.label }}</text>
          <input
            class="picker-input"
            v-model="pickerValue"
            placeholder="#000000"
            maxlength="7"
            @input="onPickerInput"
          />
        </view>
        <view class="picker-presets">
          <view
            v-for="c in colorPresets"
            :key="c"
            class="picker-preset-dot"
            :style="{ background: c }"
            @click="pickerValue = c"
          ></view>
        </view>
        <view class="picker-actions">
          <view class="picker-cancel" @click="closePicker">
            <text>取消</text>
          </view>
          <view class="picker-confirm" @click="confirmPicker">
            <text>确定</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { themePresets, themeColorLabels } from '../../../theme/presets'
import {
  getCurrentColors,
  setPresetTheme,
  setCustomColor,
  resetToDefault,
  getThemeState,
} from '../../../theme'
import { useUserStore } from '../../../stores/user'

const presets = themePresets
const store = useUserStore()

const activePreset = ref('teal')
const state = reactive({
  colors: {} as Record<string, string>,
})

const showPicker = ref(false)
const pickerValue = ref('')
const pickerTarget = ref<{ key: string; label: string } | null>(null)

const editableTokens = (Object.entries(themeColorLabels) as [string, string][])
  .filter(([key]) => key !== '--color-wechat' && key !== '--color-mask')
  .map(([key, label]) => ({ key, label }))

const colorPresets = [
  '#0D9488', '#2563EB', '#D97706', '#E91E63', '#8B5CF6',
  '#1E293B', '#94A3B8', '#CBD5E1', '#F5F7FA', '#FFFFFF',
  '#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#0F172A',
]

const loadState = () => {
  const themeState = getThemeState()
  activePreset.value = themeState.mode === 'preset' ? themeState.presetName : ''
  state.colors = getCurrentColors()
}

const selectPreset = (name: string) => {
  setPresetTheme(name)
  loadState()
  store.syncThemeToServer()
}

const openPicker = (token: { key: string; label: string }) => {
  pickerTarget.value = token
  pickerValue.value = state.colors[token.key] || '#000000'
  showPicker.value = true
}

const closePicker = () => {
  showPicker.value = false
  pickerTarget.value = null
}

const onPickerInput = () => {
  const v = pickerValue.value
  if (v.length > 0 && !v.startsWith('#')) {
    pickerValue.value = '#' + v.replace(/^#+/, '')
  }
}

const confirmPicker = () => {
  if (!pickerTarget.value) return
  const v = pickerValue.value
  if (!/^#[0-9A-Fa-f]{6}$/.test(v)) {
    return
  }
  setCustomColor(pickerTarget.value.key, v)
  loadState()
  store.syncThemeToServer()
  closePicker()
}

const handleReset = () => {
  resetToDefault()
  loadState()
  store.syncThemeToServer()
}

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack({ delta: 1 })
  } else {
    uni.reLaunch({ url: '/pages/my/index' })
  }
}

onMounted(() => {
  loadState()
})
</script>

<style scoped>
.theme-container {
  min-height: 100vh;
  background: var(--color-bg-page, #F5F7FA);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: calc(env(safe-area-inset-top) + 20rpx) 30rpx 20rpx;
  background: linear-gradient(135deg, var(--color-primary, #00BFFF) 0%, var(--color-primary-dark, #0099CC) 100%);
  position: relative;
  flex-shrink: 0;
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

.section {
  width: 100%;
  padding: 0 30rpx;
  margin-bottom: 8rpx;
}

.section-title {
  font-size: var(--text-body);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
  margin-bottom: 20rpx;
}

.presets-row {
  display: flex;
  gap: 20rpx;
}

.preset-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28rpx 16rpx;
  border-radius: 20rpx;
  position: relative;
  gap: 12rpx;
}

.preset-card.active {
  outline: 3rpx solid var(--color-primary, #0D9488);
}

.preset-dot {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
}

.preset-label {
  font-size: var(--text-small);
  font-weight: 500;
}

.preset-check {
  font-size: var(--text-body);
  position: absolute;
  top: 12rpx;
  right: 16rpx;
}

.color-card {
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
}

.color-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 26rpx 28rpx;
  border-bottom: 2rpx solid var(--color-border-light, #F1F5F9);
}

.color-row:last-child {
  border-bottom: none;
}

.color-label {
  font-size: var(--text-body);
  color: var(--color-text-primary, #1E293B);
}

.color-value-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.color-value-text {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
}

.color-circle {
  width: 32rpx;
  height: 32rpx;
  border-radius: 16rpx;
  border: 2rpx solid var(--color-border, #E2E8F0);
}

.reset-area {
  width: 100%;
  padding: 32rpx 30rpx;
  display: flex;
  justify-content: center;
}

.reset-btn {
  padding: 20rpx 60rpx;
  border-radius: 48rpx;
  border: 2rpx solid var(--color-primary, #0D9488);
}

.reset-text {
  font-size: var(--text-body);
  font-weight: 500;
  color: var(--color-primary, #0D9488);
}

.picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.picker-sheet {
  width: 600rpx;
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 24rpx;
  overflow: hidden;
}

.picker-header {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 96rpx;
}

.picker-title {
  font-size: var(--text-title);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}

.picker-preview {
  height: 120rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.picker-preview-text {
  font-size: var(--text-body);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.picker-input-area {
  display: flex;
  align-items: center;
  padding: 20rpx 28rpx;
  border-top: 2rpx solid var(--color-border-light, #F1F5F9);
  border-bottom: 2rpx solid var(--color-border-light, #F1F5F9);
}

.picker-label {
  font-size: var(--text-body);
  color: var(--color-text-primary, #1E293B);
  margin-right: 16rpx;
}

.picker-input {
  flex: 1;
  font-size: var(--text-body);
  color: var(--color-text-primary, #1E293B);
  background: var(--color-bg-page, #F5F7FA);
  padding: 12rpx 16rpx;
  border-radius: 8rpx;
}

.picker-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  padding: 24rpx 28rpx;
  justify-content: center;
}

.picker-preset-dot {
  width: 44rpx;
  height: 44rpx;
  border-radius: 22rpx;
  border: 2rpx solid rgba(0, 0, 0, 0.1);
}

.picker-actions {
  display: flex;
  border-top: 2rpx solid var(--color-border-light, #F1F5F9);
}

.picker-cancel,
.picker-confirm {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 96rpx;
  font-size: var(--text-title);
}

.picker-cancel {
  color: var(--color-text-secondary, #94A3B8);
  border-right: 2rpx solid var(--color-border-light, #F1F5F9);
}

.picker-confirm {
  color: var(--color-primary, #0D9488);
  font-weight: 600;
}
</style>
