<!--
  App.vue - 应用程序入口页面
  功能：作为整个应用的入口文件，管理应用生命周期和全局配置
  技术：Vue3 + TypeScript + uni-app
-->
<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { useI18n } from 'vue-i18n';
import config from './config/index';
import { storage } from './utils/storage';

const { t } = useI18n();

// 应用启动时触发
onLaunch(() => {
  console.log('[app] 应用启动', t('app.launch'));
  const token = storage.get(config.tokenKey);
  const user = storage.get(config.userKey);
  console.log('[app] 初始状态', { token: token ? '有' : '无', user: user ? user.phone : '无' });
});

// 应用显示时触发
onShow(() => {
  console.log('[app] 应用显示', t('app.show'));
});

// 应用隐藏时触发
onHide(() => {
  console.log('[app] 应用隐藏', t('app.hide'));
});
</script>

<style>
/* 全局样式 */
@import url("./static/iconfont/iconfont.css");
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  background: #F5F5F5;
  color: #333;
  -webkit-font-smoothing: antialiased;
}
</style>
