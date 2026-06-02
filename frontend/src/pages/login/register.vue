<template>
  <view class="register-container">
    <view class="header">
      <view class="back-btn" @click="goBack">
        <view class="back-icon category-icon-svg category-icon-chevron-left"></view>
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
            <checkbox :checked="agreed" color="#0D9488" />
            <text>我已阅读并同意</text>
            <text class="link" @click.stop="openAgreement('user')">《用户协议》</text>
            <text>和</text>
            <text class="link" @click.stop="openAgreement('privacy')">《隐私政策》</text>
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

      <view class="divider-or">
        <view class="divider-line"></view>
        <text class="divider-text">或</text>
        <view class="divider-line"></view>
      </view>

      <view class="wechat-btn" :class="{ disabled: wxLoading }" @click="handleWechatRegister">
        <text class="wechat-icon">💬</text>
        <text>{{ wxLoading ? '登录中...' : '微信一键注册' }}</text>
      </view>
    </view>

    <view v-if="showAgreementPopup" class="popup-overlay" @touchmove.stop.prevent @click="closeAgreement">
      <view class="popup-sheet" @click.stop>
        <view class="popup-header">
          <text class="popup-title">{{ agreementTitle }}</text>
        </view>
        <view class="popup-divider"></view>
        <scroll-view class="popup-content" scroll-y :style="{ height: contentHeight + 'px' }">
          <text class="popup-text">{{ currentAgreementContent }}</text>
        </scroll-view>
        <view class="popup-close" @click.stop="closeAgreement">
          <text class="close-text">关闭</text>
        </view>
      </view>
    </view>

    <view v-if="showWxQrcode" class="popup-overlay" @touchmove.stop.prevent @click="closeWxQrcode">
      <view class="qrcode-sheet" @click.stop>
        <view class="qrcode-header">
          <text class="qrcode-title">微信扫码注册</text>
        </view>
        <view class="qrcode-body">
          <image
            v-if="wxQrcodeUrl"
            class="qrcode-image"
            :src="wxQrcodeUrl"
            mode="aspectFit"
          />
          <view v-else class="qrcode-placeholder">
            <text class="qrcode-placeholder-text">二维码加载中...</text>
          </view>
          <text class="qrcode-tip">请使用微信扫描二维码完成注册</text>
        </view>
        <view class="qrcode-close" @click.stop="closeWxQrcode">
          <text class="close-text">关闭</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useUserStore } from '../../stores/user'
import { validatePhone, validatePassword, validateCode } from '../../utils/validate'
import { useCountdown } from '../../utils/countdown'
import { sendSmsCode, register, wechatRegister } from '../../api/auth'

const userStore = useUserStore()
const phone = ref('')
const code = ref('')
const password = ref('')
const confirmPassword = ref('')
const nickname = ref('')
const showPassword = ref(false)
const agreed = ref(false)
const loading = ref(false)
const wxLoading = ref(false)
const showAgreementPopup = ref(false)
const agreementType = ref<'user' | 'privacy'>('user')
const contentHeight = ref(400)
const showWxQrcode = ref(false)
const wxQrcodeUrl = ref('')
const wxSceneId = ref('')
let wxQrcodeTimer: ReturnType<typeof setInterval> | null = null

const { count, isCounting, start } = useCountdown()

const userAgreementContent = `欢迎使用本应用！

请您仔细阅读以下条款。在使用本应用之前，请您务必审慎阅读、充分理解本协议各条款内容。

一、总则

1.1 本协议是您与本应用之间关于使用本应用服务所订立的协议。

1.2 您在使用本应用服务时，应当遵守中华人民共和国相关法律法规。本协议可由本应用随时更新，更新后的协议条款一旦公布即代替原来的协议条款，恕不再另行通知。

二、账号注册与使用

2.1 您在注册时应提供真实、准确、完整的个人信息，并在信息变更时及时更新。您不得以虚假、冒用的身份信息进行注册。

2.2 您应对您的账号安全负责，妥善保管账号密码。因您保管不善导致的账号被盗用或损失，由您自行承担。

2.3 每个手机号仅限注册一个账号。

三、用户行为规范

3.1 禁止发布违法信息，禁止侵犯他人合法权益的行为。

3.2 您在使用过程中不得从事以下行为：
（1）发布、传送、传播违法违规信息；
（2）利用本应用从事欺诈、传销等非法活动；
（3）干扰本应用的正常运营，破坏应用功能和数据。

四、免责声明

4.1 本应用按"现状"和"可得到"的状态向您提供服务，对服务的及时性、安全性不作任何明示或暗示的保证。

4.2 因不可抗力、计算机病毒或黑客攻击等造成的服务中断，本应用不承担任何责任。

五、其他

5.1 本协议的解释、效力及纠纷的解决，适用于中华人民共和国法律。

5.2 若本协议的任何条款被认定为无效，不影响其他条款的效力。`

const privacyPolicyContent = `本应用尊重并保护所有使用服务用户的个人隐私权。

一、信息收集

1.1 我们收集您的个人信息包括：
- 手机号码：用于账号注册和身份验证；
- 昵称和头像：用于展示您的个人资料；
- 设备信息：用于优化服务体验和安全防护。

1.2 我们会在您使用特定功能时获取相应的权限，包括但不限于：相机、相册、存储等。

二、信息使用

2.1 我们收集的信息将用于：
- 为您提供、维护和改进我们的服务；
- 向您发送服务通知；
- 保障账号安全和防范风险。

2.2 我们不会主动将您的个人信息提供给第三方，除非：
- 获得您的明确授权；
- 法律法规要求；
- 为保护我们或公众的人身财产安全。

三、信息存储与保护

3.1 您的个人信息存储在中国境内，我们采用加密技术保护您的数据安全。

3.2 我们采取合理的技术措施和管理制度保护您的信息安全，防止信息泄露、损毁或丢失。

四、您的权利

4.1 您有权访问、更正、删除您的个人信息。

4.2 您可以通过注销账号来永久删除您的所有数据。

五、隐私政策更新

5.1 我们可能会适时修订本隐私政策，修订后的内容会通过应用内通知或公告方式告知您。

5.2 如您对本隐私政策有任何疑问，可通过应用内反馈渠道联系我们。`

const agreementTitle = computed(() => {
  return agreementType.value === 'user' ? '用户协议' : '隐私政策'
})

const currentAgreementContent = computed(() => {
  return agreementType.value === 'user' ? userAgreementContent : privacyPolicyContent
})

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

const openAgreement = (type: 'user' | 'privacy') => {
  agreementType.value = type
  showAgreementPopup.value = true
  nextTick(() => {
    const info = uni.getSystemInfoSync()
    const rpxRatio = info.windowWidth / 750
    const headerPx = 104 * rpxRatio
    const closePx = 104 * rpxRatio
    const dividerPx = 1
    const maxSheetPx = info.windowHeight * 0.7
    contentHeight.value = Math.floor(maxSheetPx - headerPx - dividerPx - closePx)
  })
}

const closeAgreement = () => {
  showAgreementPopup.value = false
}

const sendCode = async () => {
  if (isCounting.value) return
  if (!validatePhone(phone.value)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }

  try {
    await sendSmsCode(phone.value, 'register')
    uni.showToast({ title: '验证码已发送', icon: 'success' })
    start()
  } catch (err: any) {
    const message = err?.data?.message || err?.message || '发送失败，请稍后重试'
    uni.showToast({ title: message, icon: 'none' })
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
    uni.showToast({ title: '注册成功', icon: 'success' })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/detail/index' })
    }, 1000)
  } catch (err: any) {
    const message = err?.data?.message || err?.message || '注册失败，请重试'
    uni.showToast({ title: message, icon: 'none' })
  } finally {
    loading.value = false
  }
}

const handleWechatRegister = async () => {
  if (wxLoading.value) return

  // #ifdef MP-WEIXIN || APP-PLUS
  wxLoading.value = true
  uni.login({
    provider: 'weixin',
    success: async (loginRes: any) => {
      try {
        const res = await wechatRegister({ code: loginRes.code })
        userStore.setAuth(res.data.token, res.data.user)
        uni.showToast({ title: '注册成功', icon: 'success' })
        setTimeout(() => {
          uni.switchTab({ url: '/pages/detail/index' })
        }, 1000)
      } catch (err: any) {
        const message = err?.data?.message || err?.message || '微信注册失败，请使用手机号注册'
        uni.showToast({ title: message, icon: 'none' })
      } finally {
        wxLoading.value = false
      }
    },
    fail: (err: any) => {
      const isNotInstalled = err?.errCode === -2 || err?.errMsg?.includes('not installed')
      uni.showToast({
        title: isNotInstalled ? '请先安装微信客户端' : '微信授权已取消',
        icon: 'none'
      })
      wxLoading.value = false
    }
  })
  // #endif

  // #ifdef H5
   const ua = navigator.userAgent.toLowerCase()
   const isWechatBrowser = ua.includes('micromessenger')
   if (isWechatBrowser) {
     wxLoading.value = true
     const appId = '' // TODO: 替换为微信公众号 AppID
     const redirectUri = encodeURIComponent(window.location.origin + '/#/pages/login/login')
     const scope = 'snsapi_userinfo'
     window.location.href = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=register#wechat_redirect`
     return
   }
   showWxQrcode.value = true
   loadWechatQrcode()
   // #endif
}

const loadWechatQrcode = async () => {
  try {
    const request = (await import('../../api/request')).default
    const res: any = await request({
      url: '/auth/wechat-qrcode',
      method: 'POST',
      needAuth: false
    })
    wxQrcodeUrl.value = res.data?.qrcodeUrl || ''
    wxSceneId.value = res.data?.sceneId || ''
    wxQrcodeTimer = setInterval(pollQrcodeStatus, 2000)
  } catch {
    wxQrcodeUrl.value = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent('wechat_register_' + Date.now())
    wxSceneId.value = Date.now().toString()
  }
}

const pollQrcodeStatus = async () => {
  if (!wxSceneId.value) return
  try {
    const request = (await import('../../api/request')).default
    const res: any = await request({
      url: `/auth/wechat-qrcode-status?sceneId=${wxSceneId.value}`,
      method: 'GET',
      needAuth: false
    })
    if (res.data?.status === 'confirmed' && res.data?.token) {
      clearWxQrcodeTimer()
      showWxQrcode.value = false
      userStore.setAuth(res.data.token, res.data.user)
      uni.showToast({ title: '注册成功', icon: 'success' })
      setTimeout(() => {
        uni.switchTab({ url: '/pages/detail/index' })
      }, 1000)
    }
  } catch {
    // 继续轮询
  }
}

const clearWxQrcodeTimer = () => {
  if (wxQrcodeTimer) {
    clearInterval(wxQrcodeTimer)
    wxQrcodeTimer = null
  }
}

const closeWxQrcode = () => {
  clearWxQrcodeTimer()
  showWxQrcode.value = false
}

const goBack = () => {
  uni.redirectTo({ url: '/pages/login/login' })
}

const goToLogin = () => {
  uni.redirectTo({ url: '/pages/login/login' })
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  background: var(--color-bg-page, #f5f5f5);
}

.header {
  display: flex;
  align-items: center;
  padding: 40rpx 30rpx;
  position: relative;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60rpx;
  height: 60rpx;
  color: var(--color-text-primary, #333);
}

.back-icon {
  width: 48rpx;
  height: 48rpx;
}

.title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: var(--text-title);
  font-weight: bold;
  color: var(--color-text-primary, #333);
}

.form-area {
  background: var(--color-bg-card, white);
  margin: 40rpx 30rpx;
  border-radius: 24rpx;
  padding: 40rpx;
}

.input-item {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--color-border, #e5e5e5);
  padding: 24rpx 0;
  position: relative;
}

.input {
  flex: 1;
  font-size: var(--text-body);
}

.toggle-pwd {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #999);
  padding: 8rpx;
}

.send-code-btn {
  font-size: var(--text-small);
  color: var(--color-primary, #0D9488);
  padding: 8rpx 16rpx;
  border: 1px solid var(--color-primary, #0D9488);
  border-radius: 8rpx;
}

.send-code-btn.disabled {
  color: var(--color-text-tertiary, #ccc);
  border-color: var(--color-text-tertiary, #ccc);
}

.agreement {
  padding: 32rpx 0;
  font-size: var(--text-small);
  color: var(--color-text-secondary, #666);
}

.checkbox-label {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.link {
  color: var(--color-primary, #0D9488);
}

.register-btn {
  background: var(--color-primary, #0D9488);
  color: var(--color-text-inverse, white);
  text-align: center;
  padding: 28rpx;
  border-radius: 50rpx;
  font-size: var(--text-title);
  font-weight: bold;
  margin-bottom: 40rpx;
}

.register-btn.disabled {
  background: var(--color-text-tertiary, #ccc);
}

.login-link {
  text-align: center;
  font-size: var(--text-small);
  color: var(--color-text-secondary, #666);
  margin-bottom: 30rpx;
}

.divider-or {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}

.divider-line {
  width: 60rpx;
  height: 1px;
  background: var(--color-border, #e5e5e5);
}

.divider-text {
  margin: 0 16rpx;
  font-size: var(--text-small);
  color: var(--color-text-secondary, #999);
}

.wechat-btn {
  background: var(--color-wechat, #07C160);
  color: var(--color-text-inverse, white);
  text-align: center;
  padding: 28rpx;
  border-radius: 50rpx;
  font-size: var(--text-title);
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.wechat-btn.disabled {
  opacity: 0.7;
}

.wechat-icon {
  font-size: var(--text-title);
}

.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-mask, rgba(0, 0, 0, 0.5));
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.popup-sheet {
  width: 100%;
  max-height: 70vh;
  background: var(--color-bg-card, white);
  border-radius: 24rpx 24rpx 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.popup-header {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 104rpx;
  flex-shrink: 0;
}

.popup-title {
  font-size: var(--text-title);
  font-weight: bold;
  color: var(--color-text-primary, #333);
}

.popup-divider {
  height: 1px;
  background: var(--color-border, #e5e5e5);
  flex-shrink: 0;
}

.popup-content {
  padding: 30rpx;
  box-sizing: border-box;
}

.popup-text {
  font-size: var(--text-body);
  color: var(--color-text-primary, #1E293B);
  line-height: 1.8;
  white-space: pre-wrap;
}

.popup-close {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 104rpx;
  flex-shrink: 0;
  border-top: 1px solid var(--color-border-light, #F1F5F9);
  z-index: 1;
}

.close-text {
  font-size: var(--text-body);
  color: var(--color-primary, #0D9488);
  width: 100%;
  text-align: center;
  line-height: 104rpx;
}

.qrcode-sheet {
  width: 100%;
  background: white;
  border-radius: 24rpx 24rpx 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
}

.qrcode-header {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 104rpx;
  flex-shrink: 0;
}

.qrcode-title {
  font-size: var(--text-title);
  font-weight: bold;
  color: var(--color-text-primary, #1E293B);
}

.qrcode-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30rpx 60rpx 50rpx;
}

.qrcode-image {
  width: 360rpx;
  height: 360rpx;
}

.qrcode-placeholder {
  width: 360rpx;
  height: 360rpx;
  background: var(--color-border-light, #F1F5F9);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
}

.qrcode-placeholder-text {
  font-size: var(--text-body);
  color: var(--color-text-secondary, #94A3B8);
}

.qrcode-tip {
  font-size: var(--text-small);
  color: var(--color-text-secondary, #94A3B8);
  margin-top: 30rpx;
}

.qrcode-close {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 104rpx;
  flex-shrink: 0;
  border-top: 1px solid var(--color-border-light, #F1F5F9);
  width: 100%;
}
</style>