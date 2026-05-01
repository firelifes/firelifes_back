export const storage = {
  set: (key: string, value: any) => {
    uni.setStorageSync(key, JSON.stringify(value))
  },
  get: (key: string) => {
    try {
      const value = uni.getStorageSync(key)
      return value ? JSON.parse(value) : null
    } catch {
      return null
    }
  },
  remove: (key: string) => {
    uni.removeStorageSync(key)
  }
}
