<template>
  <view class="fp-container">
    <view class="fp-header">
      <view class="back-btn" @click="goBack">
        <view class="back-icon category-icon-svg category-icon-chevron-left"></view>
      </view>
      <text class="title">忘记密码</text>
    </view>

    <view class="form-card">
      <view class="input-row">
        <view class="input-icon category-icon-svg login-icon-phone"></view>
        <input class="input" v-model="phone" type="number" placeholder="请输入手机号" maxlength="11" />
      </view>

      <view class="input-row code-row">
        <view class="input-left">
          <view class="input-icon category-icon-svg login-icon-mail"></view>
          <input class="input" v-model="code" type="number" placeholder="请输入验证码" maxlength="6" />
        </view>
        <view class="send-code-btn" :class="{ disabled: isCounting }" @click="sendCode">
          {{ isCounting ? `${count}s` : '获取验证码' }}
        </view>
      </view>

      <view class="input-row pw-row">
        <view class="input-left">
          <view class="input-icon category-icon-svg login-icon-lock"></view>
          <input class="input" v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="设置新密码（6-20位）" />
        </view>
        <view class="toggle-pwd" @click="showPassword = !showPassword">
          <view class="toggle-pwd-icon category-icon-svg" :class="showPassword ? 'login-icon-eye' : 'login-icon-eye-off'"></view>
        </view>
      </view>

      <view class="input-row">
        <view class="input-icon category-icon-svg login-icon-lock"></view>
        <input class="input" v-model="confirmPassword" type="password" placeholder="再次输入新密码" />
      </view>

      <view class="reset-btn" :class="{ disabled: !canReset || loading }" @click="handleReset">
        {{ loading ? '重置中...' : '重置密码' }}
      </view>

      <view class="login-link">
        <text class="login-text">想起密码？</text>
        <text class="login-go" @click="goToLogin">去登录</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '../../stores/user'
import { validatePhone, validatePassword, validateCode } from '../../utils/validate'
import { useCountdown } from '../../utils/countdown'
import { sendSmsCode, resetPassword } from '../../api/auth'

const userStore = useUserStore()
const phone = ref('')
const code = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const loading = ref(false)

const { count, isCounting, start } = useCountdown()

const canReset = computed(() => {
  if (!validatePhone(phone.value)) return false
  if (!validateCode(code.value)) return false
  if (!validatePassword(password.value)) return false
  if (password.value !== confirmPassword.value) return false
  return true
})

const sendCode = async () => {
  if (!validatePhone(phone.value)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }
  if (isCounting.value) return

  try {
    await sendSmsCode(phone.value, 'reset-password')
    uni.showToast({ title: '验证码已发送', icon: 'success' })
    start()
  } catch (err: any) {
    const message = err?.data?.message || err?.message || '发送失败，请稍后重试'
    uni.showToast({ title: message, icon: 'none' })
  }
}

const handleReset = async () => {
  if (!canReset.value || loading.value) return

  loading.value = true
  try {
    const res = await resetPassword({
      phone: phone.value,
      code: code.value,
      password: password.value
    })

    userStore.setAuth(res.data.token, res.data.user)

    uni.showToast({ title: '密码已重置', icon: 'success' })
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/detail/index' })
    }, 1000)
  } catch (err: any) {
    const message = err?.data?.message || err?.message || '重置失败，请重试'
    uni.showToast({ title: message, icon: 'none' })
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  uni.redirectTo({ url: '/pages/login/login' })
}

const goToLogin = () => {
  uni.redirectTo({ url: '/pages/login/login' })
}
</script>

<style scoped>
.fp-container {
  min-height: 100vh;
  background: var(--color-bg-page, #F5F7FA);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.fp-header {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 40rpx 30rpx;
  position: relative;
}

.back-btn {
  position: absolute;
  left: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60rpx;
  height: 60rpx;
  color: var(--color-text-primary, #1E293B);
}

.back-icon {
  width: 44rpx;
  height: 44rpx;
}

.title {
  font-size: var(--text-title);
  font-weight: 600;
  color: var(--color-text-primary, #1E293B);
}

.form-card {
  width: 654rpx;
  background: var(--color-bg-card, #FFFFFF);
  border-radius: 24rpx;
  padding: 44rpx;
  margin-top: 20rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.06);
}

.input-row {
  display: flex;
  align-items: center;
  border-bottom: 2rpx solid var(--color-border, #E2E8F0);
  padding: 24rpx 0;
}

.input-icon {
  width: 36rpx;
  height: 36rpx;
  margin-right: 16rpx;
  color: var(--color-text-secondary, #94A3B8);
}

.input {
  flex: 1;
  font-size: var(--text-body);
  color: var(--color-text-primary, #1E293B);
}

.input::placeholder {
  color: var(--color-text-secondary, #94A3B8);
}

.code-row {
  justify-content: space-between;
}

.input-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.send-code-btn {
  font-size: var(--text-small);
  color: var(--color-primary, #0D9488);
  background: var(--color-primary-light, #E6F7F5);
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
  white-space: nowrap;
}

.send-code-btn.disabled {
  color: var(--color-text-secondary, #94A3B8);
  background: var(--color-border-light, #F1F5F9);
}

.pw-row {
  justify-content: space-between;
}

.toggle-pwd {
  padding: 8rpx;
}

.toggle-pwd-icon {
  width: 34rpx;
  height: 34rpx;
  color: var(--color-text-secondary, #94A3B8);
}

.reset-btn {
  width: 100%;
  height: 96rpx;
  background: var(--color-primary, #0D9488);
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-title);
  font-weight: 600;
  color: var(--color-text-inverse, #FFFFFF);
  margin-top: 40rpx;
  margin-bottom: 32rpx;
}

.reset-btn.disabled {
  background: var(--color-text-tertiary, #CBD5E1);
}

.login-link {
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-text {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
}

.login-go {
  font-size: var(--text-small);
  color: var(--color-primary, #0D9488);
  margin-left: 4rpx;
}
</style>
