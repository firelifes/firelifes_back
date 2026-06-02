<!--
  App.vue - 应用程序入口页面
  功能：作为整个应用的入口文件，管理应用生命周期和全局配置
  技术：Vue3 + TypeScript + uni-app
-->
<script setup lang="ts">
import { onLaunch, onError } from "@dcloudio/uni-app";
import config from './config/index';
import { storage } from './utils/storage';
import { initTheme } from './theme'

const LOGIN_EXPIRE_MS = 15 * 24 * 60 * 60 * 1000

const setStatusBarHeight = () => {
  if (typeof window !== 'undefined') {
    document.documentElement.style.setProperty('--status-bar-height', '0px');
  }
};

const checkLoginExpiry = () => {
  const token = storage.get(config.tokenKey)
  const user = storage.get(config.userKey)
  if (!token || !user) return

  const loginTimestamp = storage.get('login_timestamp')
  if (!loginTimestamp) {
    storage.remove(config.tokenKey)
    storage.remove(config.userKey)
    return
  }

  if (Date.now() - loginTimestamp > LOGIN_EXPIRE_MS) {
    console.log('[app] 登录已超过15天，清除认证信息')
    storage.remove(config.tokenKey)
    storage.remove(config.userKey)
    storage.remove('login_timestamp')
  } else {
    const remainingDays = Math.ceil((LOGIN_EXPIRE_MS - (Date.now() - loginTimestamp)) / (24 * 60 * 60 * 1000))
    console.log('[app] 登录状态有效，剩余', remainingDays, '天')
  }
}

onLaunch(() => {
  console.log('[app] 应用启动');
  initTheme()
  setStatusBarHeight();
  checkLoginExpiry()

  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('[app] 未处理的Promise拒绝:', event.reason);
      event.preventDefault();
    });
  }
});

// 应用发生错误时触发
onError((err) => {
  console.error('[app] 应用发生错误:', err);
  uni.showToast({
    title: '发生错误，请刷新重试',
    icon: 'none',
    duration: 2000
  });
});
</script>

<style>
/* 全局样式 */
@import url("./styles/category-icons.css");
@import url("./theme/variables.css");
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  background: var(--color-bg-page, #F5F5F5);
  color: var(--color-text-primary, #333);
  -webkit-font-smoothing: antialiased;
}
</style>
