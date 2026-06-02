/**
 * config/index.ts - 应用程序配置文件
 * 
 * 功能说明：
 * - 统一管理应用的全局配置
 * - 根据不同环境加载对应的 API 地址
 * - 配置存储相关的 Key 值
 * 
 * 环境变量说明：
 * - VITE_API_BASE_URL: API 基础地址（本地/SIT/PROD 不同）
 * - VITE_APP_ENV: 应用环境标识
 * 
 * 技术栈：TypeScript + Vite 环境变量
 */

const config = {
  // API 基础地址，通过环境变量配置
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:7001',
  // 当前应用环境
  appEnv: import.meta.env.VITE_APP_ENV || 'development',
  // 本地存储 Token 的 Key
  tokenKey: 'auth_token',
  // 本地存储用户信息的 Key
  userKey: 'auth_user'
}

export default config
