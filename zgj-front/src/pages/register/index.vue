<template>
  <view class="register-container">
    <view class="header">
      <view class="back-btn" @click="goBack">
        <text>←</text>
      </view>
      <text class="title">注册账号</text>
    </view>

    <view class="form-area">
      <view class="input-item">
        <input class="input" v-model="phone" type="number" placeholder="请输入手机号" maxlength="11" />
      </view>

      <view class="input-item">
        <input class="input" v-model="code" type="number" placeholder="请输入验证码" maxlength="6" />
        <view class="send-code-btn" :class="{ disabled: isCounting }" @click="sendCode">
          {{ isCounting ? `${count}s` : '获取验证码' }}
        </view>
      </view>

      <view class="input-item">
        <input class="input" v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="设置密码（6-20位）" />
        <view class="toggle-pwd" @click="showPassword = !showPassword">
          {{ showPassword ? '隐藏' : '显示' }}
        </view>
      </view>

      <view class="input-item">
        <input class="input" v-model="confirmPassword" :type="showPassword ? 'text' : 'password'" placeholder="确认密码" />
      </view>

      <view class="input-item">
        <input class="input" v-model="nickname" placeholder="昵称（选填）" />
      </view>

      <view class="agreement">
        <checkbox-group @change="toggleAgreement">
          <label class="checkbox-label">
            <checkbox :checked="agreed" color="#3cc51f" />
            <text>我已阅读并同意</text>
            <text class="link">《用户协议》</text>
            <text>和</text>
            <text class="link">《隐私政策》</text>
          </label>
        </checkbox-group>
      </view>

      <view class="register-btn" :class="{ disabled: !canRegister || loading }" @click="handleRegister">
        {{ loading ? '注册中...' : '注册' }}
      </view>

      <view class="login-link">
        <text>已有账号？</text>
        <text class="link" @click="goToLogin">立即登录</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '../../stores/user'
import { validatePhone, validatePassword, validateCode } from '../../utils/validate'
import { useCountdown } from '../../utils/countdown'
import { sendSmsCode, register } from '../../api/auth'

const userStore = useUserStore()
const phone = ref('')
const code = ref('')
const password = ref('')
const confirmPassword = ref('')
const nickname = ref('')
const showPassword = ref(false)
const agreed = ref(false)
const loading = ref(false)

const { count, isCounting, start } = useCountdown()

const canRegister = computed(() => {
  if (!agreed.value) return false
  if (!validatePhone(phone.value)) return false
  if (!validateCode(code.value)) return false
  if (!validatePassword(password.value)) return false
  if (password.value !== confirmPassword.value) return false
  return true
})

const toggleAgreement = (e: any) => {
  agreed.value = e.detail.value.length > 0
}

const sendCode = async () => {
  if (isCounting.value || !validatePhone(phone.value)) return
  
  try {
    await sendSmsCode(phone.value, 'register')
    uni.showToast({
      title: '验证码已发送',
      icon: 'success'
    })
    start()
  } catch (err) {
    console.error(err)
  }
}

const handleRegister = async () => {
  if (!canRegister.value || loading.value) return
  
  loading.value = true
  try {
    const res = await register({
      phone: phone.value,
      code: code.value,
      password: password.value,
      nickname: nickname.value
    })
    userStore.setAuth(res.data.token, res.data.user)
    uni.showToast({
      title: '注册成功',
      icon: 'success'
    })
    setTimeout(() => {
      uni.switchTab({
        url: '/pages/detail/index'
      })
    }, 1000)
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  uni.navigateBack()
}

const goToLogin = () => {
  uni.navigateBack()
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  padding: 40rpx 30rpx;
  position: relative;
}

.back-btn {
  font-size: 48rpx;
  color: #333;
  padding: 8rpx;
}

.title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.form-area {
  background: white;
  margin: 40rpx 30rpx;
  border-radius: 24rpx;
  padding: 40rpx;
}

.input-item {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e5e5e5;
  padding: 24rpx 0;
  position: relative;
}

.input {
  flex: 1;
  font-size: 30rpx;
}

.toggle-pwd {
  font-size: 26rpx;
  color: #999;
  padding: 8rpx;
}

.send-code-btn {
  font-size: 26rpx;
  color: #3cc51f;
  padding: 8rpx 16rpx;
  border: 1px solid #3cc51f;
  border-radius: 8rpx;
}

.send-code-btn.disabled {
  color: #ccc;
  border-color: #ccc;
}

.agreement {
  padding: 32rpx 0;
  font-size: 24rpx;
  color: #666;
}

.checkbox-label {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.link {
  color: #3cc51f;
}

.register-btn {
  background: #3cc51f;
  color: white;
  text-align: center;
  padding: 28rpx;
  border-radius: 50rpx;
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 40rpx;
}

.register-btn.disabled {
  background: #ccc;
}

.login-link {
  text-align: center;
  font-size: 26rpx;
  color: #666;
}
</style>
