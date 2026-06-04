<template>
  <WdPopup
    position="bottom"
    v-model="visible"
    :z-index="zIndex"
    :modal="modal"
    :close-on-click-modal="closeOnClickModal"
    :custom-style="popupStyle"
    @close="handleClose"
  >
    <view class="bottom-scroll-popup">
      <!-- 顶部 header：默认是「标题 + 关闭」，可被 header 插槽完全替换 -->
      <view v-if="$slots.header || title" class="popup-header">
        <slot name="header">
          <text class="popup-title">{{ title }}</text>
          <text class="popup-close" @tap="handleClose">×</text>
        </slot>
      </view>

      <!-- 中间 body：flex:1 + min-height:0，让内层的 scroll-view / 子组件能正确滚动
           这里强制 display:flex column，方便使用方直接放 flex:1 的子元素 -->
      <view class="popup-body">
        <slot />
      </view>

      <!-- 底部 footer：flex-shrink:0，固定高度，不会被挤压 -->
      <view v-if="$slots.footer" class="popup-footer">
        <slot name="footer" />
      </view>
    </view>
  </WdPopup>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * 底部弹框（带可滚动 body）通用组件
 *
 * 解决的问题：避免每个使用方重复写 WdPopup + flex 高度链 + min-height:0 的样板代码
 * （已出现 3 次同类 bug：InterestCategorySelectorPopup / TransferForm / AccountSelectorPopup）
 *
 * 核心布局（已封装，使用方无需关心）：
 *
 *   WdPopup content view:  height: <height>vh;  display: flex; flex-direction: column;
 *     .bottom-scroll-popup:  flex: 1; min-height: 0;
 *       .popup-header:        flex-shrink: 0;
 *       .popup-body:          flex: 1; min-height: 0;  display: flex; flex-direction: column;
 *         <slot />            ← 使用方直接放 scroll-view，加 flex:1 + min-height:0 即可滚动
 *       .popup-footer:        flex-shrink: 0;          ← 固定不滚动（如键盘）
 *
 * 使用示例：
 *
 *   <!-- 场景 1：标题 + 滚动列表 -->
 *   <BottomScrollPopup v-model="visible" title="选择分类">
 *     <scroll-view scroll-y class="my-list">...</scroll-view>
 *   </BottomScrollPopup>
 *
 *   <!-- 场景 2：标题 + 表单 + 底部按钮 -->
 *   <BottomScrollPopup v-model="visible" title="新建">
 *     <scroll-view scroll-y>...表单...</scroll-view>
 *     <template #footer>
 *       <button @tap="submit">确定</button>
 *     </template>
 *   </BottomScrollPopup>
 *
 *   <!-- 场景 3：完全自定义 header -->
 *   <BottomScrollPopup v-model="visible">
 *     <template #header>
 *       <view>自定义</view>
 *     </template>
 *     ...body...
 *   </BottomScrollPopup>
 */
const props = withDefaults(
  defineProps<{
    /** v-model 控制显示隐藏 */
    modelValue: boolean
    /** 弹框层级，嵌套弹框需要递增 */
    zIndex?: number
    /** 弹框高度，单位 vh，默认 70 */
    height?: number
    /** 弹框标题，传入则显示默认 header（标题 + ×）；不传且无 header 插槽则不显示 header */
    title?: string
    /** 是否显示遮罩 */
    modal?: boolean
    /** 点击遮罩是否关闭 */
    closeOnClickModal?: boolean
    /** 使用方自定义外层样式（字符串或字符串数组），会拼接到默认 popup 样式之后 */
    customStyle?: string | string[]
  }>(),
  {
    zIndex: 2000,
    height: 70,
    title: '',
    modal: true,
    closeOnClickModal: true,
    customStyle: '',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'close'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const popupStyle = computed(() => {
  // 关键：height + display:flex column + min-height 链条，让内层 scroll-view 拿到非 0 高度
  const baseStyle = [
    'border-radius: 32rpx 32rpx 0 0',
    'background: var(--color-bg-card, #FFFFFF)',
    `height: ${props.height}vh`,
    `max-height: ${props.height}vh`,
    'display: flex',
    'flex-direction: column',
    'overflow: hidden',
  ]
  const extra = props.customStyle
  const userStyle = Array.isArray(extra) ? extra : extra ? [extra] : []
  return [...baseStyle, ...userStyle].join('; ')
})

const handleClose = () => {
  emit('close')
  visible.value = false
}

defineExpose({
  open: () => {
    visible.value = true
  },
  close: () => {
    visible.value = false
  },
})
</script>

<style scoped>
/* 顶层 flex 容器：撑满 WdPopup 的内容区 */
.bottom-scroll-popup {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0; /* 关键：覆盖 flex item 默认的 min-height:auto */
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 32rpx 20rpx;
  border-bottom: 1rpx solid var(--color-border, #E2E8F0);
  background: var(--color-bg-card, #FFFFFF);
  flex-shrink: 0;
}

.popup-title {
  font-size: var(--text-title);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}

.popup-close {
  font-size: var(--text-number);
  color: var(--color-text-secondary, #94A3B8);
  padding: 4rpx 12rpx;
  line-height: 1;
}

/* body：flex 1 + min-height 0 + 自身也是 flex column
   使用方在 body 里放 <scroll-view class="xxx" style="flex:1; min-height:0;"> 即可正确滚动 */
.popup-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.popup-footer {
  flex-shrink: 0;
}
</style>
