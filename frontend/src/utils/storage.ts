/**
 * utils/storage.ts - 本地存储工具
 * 
 * 功能说明：
 * - 封装 uni-app 的本地存储 API
 * - 自动处理 JSON 序列化和反序列化
 * - 提供 set、get、remove 三个核心方法
 * - 异常处理，防止 JSON 解析错误导致应用崩溃
 * 
 * 使用场景：
 * - 存储用户认证信息（Token + 用户信息）
 * - 存储应用配置
 * - 存储临时数据
 * 
 * 技术栈：uni-app + TypeScript
 */

export const storage = {
  /**
   * 设置存储
   * @param key 存储键名
   * @param value 存储值（会自动 JSON 序列化）
   */
  set: (key: string, value: any) => {
    uni.setStorageSync(key, JSON.stringify(value))
  },

  /**
   * 获取存储
   * @param key 存储键名
   * @returns 解析后的对象或 null
   */
  get: (key: string) => {
    try {
      const value = uni.getStorageSync(key)
      return value ? JSON.parse(value) : null
    } catch {
      return null
    }
  },

  /**
   * 删除存储
   * @param key 存储键名
   */
  remove: (key: string) => {
    uni.removeStorageSync(key)
  }
}
