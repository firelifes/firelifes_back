/**
 * main.ts - 应用程序入口文件
 * 
 * 功能说明：
 * - 创建 Vue 应用实例
 * - 配置并挂载 Pinia 状态管理
 * - 配置并挂载 i18n 国际化
 * - 为整个应用提供基础框架支持
 * 
 * 技术栈：Vue3 + TypeScript + Pinia + vue-i18n + uni-app
 */

import { createSSRApp } from "vue";
import { createPinia } from 'pinia';
import App from "./App.vue";
import i18n from './locale';

export function createApp() {
  const app = createSSRApp(App);
  const pinia = createPinia();
  app.use(i18n);
  app.use(pinia);
  return {
    app,
    pinia,
  };
}
