<template>
  <view class="login-container">
    <view class="logo-area">
      <image class="logo" src="/static/logo.png" mode="aspectFit" />
      <text class="app-name">Fire生活家</text>
    </view>

    <view class="tab-area">
      <view class="tab-item" :class="{ active: loginType === 'password' }" @click="loginType = 'password'">
        密码登录
      </view>
      <view class="tab-item" :class="{ active: loginType === 'code' }" @click="loginType = 'code'">
        验证码登录
      </view>
    </view>

    <view class="form-area">
      <view class="input-item">
        <input class="input" v-model="phone" type="number" placeholder="请输入手机号" maxlength="11" />
      </view>

      <view class="input-item" v-if="loginType === 'password'">
        <input class="input" v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="请输入密码" />
        <view class="toggle-pwd" @click="showPassword = !showPassword">
          {{ showPassword ? '隐藏' : '显示' }}
        </view>
      </view>

      <view class="input-item" v-else>
        <input class="input" v-model="code" type="number" placeholder="请输入验证码" maxlength="6" />
        <view class="send-code-btn" :class="{ disabled: isCounting }" @click="sendCode">
          {{ isCounting ? `${count}s` : '获取验证码' }}
        </view>
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

      <view class="login-btn" :class="{ disabled: !canLogin || loading }" @click="handleLogin">
        {{ loading ? '登录中...' : '登录' }}
      </view>

      <view class="wechat-login-btn" @click="handleWechatLogin">
        <text>微信一键登录</text>
      </view>

      <view class="links">
        <text class="link" @click="goToRegister">注册账号</text>
        <text class="divider">|</text>
        <text class="link">忘记密码</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '../../stores/user'
import { validatePhone, validatePassword, validateCode } from '../../utils/validate'
import { useCountdown } from '../../utils/countdown'
import { sendSmsCode, login } from '../../api/auth'

const userStore = useUserStore()
const loginType = ref<'password' | 'code'>('password')
const phone = ref('')
const password = ref('')
const code = ref('')
const showPassword = ref(false)
const agreed = ref(false)
const loading = ref(false)

const { count, isCounting, start } = useCountdown()

const canLogin = computed(() => {
  if (!agreed.value) return false
  if (!validatePhone(phone.value)) return false
  if (loginType.value === 'password') {
    return validatePassword(password.value)
  } else {
    return validateCode(code.value)
  }
})

const toggleAgreement = (e: any) => {
  agreed.value = e.detail.value.length > 0
}

const sendCode = async () => {
  if (!validatePhone(phone.value)) {
    uni.showToast({
      title: '请输入正确的手机号',
      icon: 'none'
    })
    return
  }
  if (isCounting.value) return
  
  try {
    const res = await sendSmsCode(phone.value, 'login')
    if (res.data?.code) {
      uni.showToast({
        title: `验证码: ${res.data.code}`,
        icon: 'none',
        duration: 3000
      })
    } else {
      uni.showToast({
        title: '验证码已发送',
        icon: 'success'
      })
    }
    start()
  } catch (err) {
    console.error(err)
  }
}

const handleLogin = async () => {
  if (!canLogin.value || loading.value) return
  
  loading.value = true
  try {
    let data
    if (loginType.value === 'password') {
      data = { phone: phone.value, password: password.value }
    } else {
      data = { phone: phone.value, code: code.value }
    }
    
    const res = await login(data)
    console.log('[login] 登录响应', res)
    
    userStore.setAuth(res.data.token, res.data.user)
    console.log('[login] token已保存', res.data.token.substring(0, 20) + '...')
    
    uni.showToast({
      title: '登录成功',
      icon: 'success'
    })
    setTimeout(() => {
      uni.switchTab({
        url: '/pages/detail/index'
      })
    }, 1000)
  } catch (err) {
    console.error('[login] 登录失败', err)
  } finally {
    loading.value = false
  }
}

const handleWechatLogin = () => {
  uni.showToast({
    title: '微信登录功能开发中',
    icon: 'none'
  })
}

const goToRegister = () => {
  uni.navigateTo({
    url: '/pages/register/index'
  })
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 80rpx 60rpx;
}

.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
}

.logo {
  width: 160rpx;
  height: 160rpx;
  border-radius: 32rpx;
  margin-bottom: 24rpx;
}

.app-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.tab-area {
  display: flex;
  margin-bottom: 60rpx;
  border-bottom: 1px solid #e5e5e5;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  font-size: 30rpx;
  color: #666;
  position: relative;
}

.tab-item.active {
  color: #3cc51f;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 4rpx;
  background: #3cc51f;
  border-radius: 2rpx;
}

.form-area {
  background: white;
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

.login-btn {
  background: #3cc51f;
  color: white;
  text-align: center;
  padding: 28rpx;
  border-radius: 50rpx;
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 24rpx;
}

.login-btn.disabled {
  background: #ccc;
}

.wechat-login-btn {
  background: #07c160;
  color: white;
  text-align: center;
  padding: 28rpx;
  border-radius: 50rpx;
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 40rpx;
}

.links {
  display: flex;
  justify-content: center;
  font-size: 26rpx;
  color: #666;
}

.divider {
  margin: 0 16rpx;
}
</style>
