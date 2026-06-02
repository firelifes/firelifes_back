/**
 * stores/user.ts - 用户状态管理
 * 
 * 功能说明：
 * - 管理用户登录状态（Token + 用户信息）
 * - 提供认证信息的持久化存储
 * - 提供用户信息的更新、清除等操作
 * - 判断用户是否已登录
 * 
 * Pinia Store：
 * - State: token, user
 * - Actions: setAuth, clearAuth, updateUser, isLoggedIn
 * 
 * 技术栈：Pinia + Vue3 + TypeScript
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import config from '../config/index'
import { storage } from '../utils/storage'
import type { User } from '../api/auth'
import { getUserConfig, updateUserConfig } from '../api/user-config'
import { applyConfigTheme, getThemeSnapshot, getThemeState } from '../theme'

export const useUserStore = defineStore('user', () => {
  const LOGIN_EXPIRE_DAYS = 15
  const LOGIN_EXPIRE_MS = LOGIN_EXPIRE_DAYS * 24 * 60 * 60 * 1000

  // 当前用户的认证 Token
  const token = ref<string | null>(storage.get(config.tokenKey))
  // 当前用户的信息
  const user = ref<User | null>(storage.get(config.userKey))
  // 用户配置（主题等偏好）
  const userConfig = ref<Record<string, any> | null>(null)

  const fetchUserConfig = async () => {
    try {
      const res = await getUserConfig()
      if (res.success && res.data) {
        userConfig.value = res.data
        if (res.data.theme) {
          applyConfigTheme(res.data)
        } else {
          migrateLocalTheme()
        }
      } else {
        migrateLocalTheme()
      }
    } catch {
      migrateLocalTheme()
    }
  }

  const syncThemeToServer = async () => {
    try {
      const snapshot = getThemeSnapshot()
      await updateUserConfig(snapshot)
      if (userConfig.value) {
        userConfig.value.theme = snapshot.theme
      } else {
        userConfig.value = { theme: snapshot.theme }
      }
    } catch {
      // 静默失败，本地已生效，下次登录重试
    }
  }

  const migrateLocalTheme = async () => {
    const state = getThemeState()
    if (state.mode === 'custom' || state.presetName !== 'teal') {
      try {
        const snapshot = getThemeSnapshot()
        await updateUserConfig(snapshot)
        userConfig.value = { theme: snapshot.theme }
      } catch {
        // 静默失败
      }
    }
  }

  /**
   * 设置用户认证信息（登录时调用）
   * @param newToken 认证 Token
   * @param newUser 用户信息
   */
  const setAuth = (newToken: string, newUser: User) => {
    token.value = newToken
    user.value = newUser
    storage.set(config.tokenKey, newToken)
    storage.set(config.userKey, newUser)
    storage.set('login_timestamp', Date.now())
    fetchUserConfig()
  }

  /**
   * 清除用户认证信息（退出登录时调用）
   */
  const clearAuth = () => {
    token.value = null
    user.value = null
    userConfig.value = null
    storage.remove(config.tokenKey)
    storage.remove(config.userKey)
    storage.remove('login_timestamp')
  }

  /**
   * 更新部分用户信息
   * @param newUser 需要更新的用户信息字段
   */
  const updateUser = (newUser: Partial<User>) => {
    if (user.value) {
      user.value = { ...user.value, ...newUser }
      storage.set(config.userKey, user.value)
    }
  }

  /**
   * 判断用户是否已登录
   * @returns 已登录返回 true，否则返回 false
   */
  const isLoggedIn = () => {
    return !!token.value && !!user.value
  }

  const isLoginExpired = () => {
    if (!token.value || !user.value) return true
    const loginTimestamp = storage.get('login_timestamp')
    if (!loginTimestamp) return true
    return Date.now() - loginTimestamp > LOGIN_EXPIRE_MS
  }

  return {
    token,
    user,
    userConfig,
    setAuth,
    clearAuth,
    updateUser,
    isLoggedIn,
    isLoginExpired,
    fetchUserConfig,
    syncThemeToServer,
    LOGIN_EXPIRE_DAYS
  }
})
