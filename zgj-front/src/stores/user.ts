import { defineStore } from 'pinia'
import { ref } from 'vue'
import config from '../config/index'
import { storage } from '../utils/storage'
import type { User } from '../api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(storage.get(config.tokenKey))
  const user = ref<User | null>(storage.get(config.userKey))

  const setAuth = (newToken: string, newUser: User) => {
    token.value = newToken
    user.value = newUser
    storage.set(config.tokenKey, newToken)
    storage.set(config.userKey, newUser)
  }

  const clearAuth = () => {
    token.value = null
    user.value = null
    storage.remove(config.tokenKey)
    storage.remove(config.userKey)
  }

  const updateUser = (newUser: Partial<User>) => {
    if (user.value) {
      user.value = { ...user.value, ...newUser }
      storage.set(config.userKey, user.value)
    }
  }

  const isLoggedIn = () => {
    return !!token.value && !!user.value
  }

  return {
    token,
    user,
    setAuth,
    clearAuth,
    updateUser,
    isLoggedIn
  }
})
