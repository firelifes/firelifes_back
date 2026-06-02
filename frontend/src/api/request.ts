/**
 * api/request.ts - 网络请求封装
 * 
 * 功能说明：
 * - 封装 uni.request 为 Promise 风格的请求方法
 * - 自动添加 Authorization Token 到请求头
 * - 统一处理 401 未认证错误（自动跳转登录页）
 * - 统一处理网络错误和业务错误提示
 * - 支持配置是否需要认证
 * 
 * 拦截机制：
 * - 请求前：检查 Token 状态
 * - 响应后：处理业务状态码
 * - 错误时：统一错误提示
 * 
 * 技术栈：uni-app + TypeScript
 */

import config from '../config/index'
import { storage } from '../utils/storage'

/**
 * 请求配置接口
 */
interface RequestOptions<T = any> {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: any
  needAuth?: boolean
}

/**
 * 响应数据接口
 */
interface ResponseData<T = any> {
  success: boolean
  message: string
  data: T
}

let isHandling401 = false

const handle401Error = () => {
  if (isHandling401) {
    console.log('[request] 401已处理中，跳过重复触发')
    return
  }
  isHandling401 = true
  console.log('[request] 处理401错误，清除认证信息并跳转登录页')

  storage.remove(config.tokenKey)
  storage.remove(config.userKey)
  storage.remove('login_timestamp')

  uni.showToast({
    title: '登录已过期，请重新登录',
    icon: 'none',
    duration: 2000
  })

  setTimeout(() => {
    uni.reLaunch({
      url: '/pages/login/login'
    })
    isHandling401 = false
  }, 800)
}

/**
 * 统一请求方法
 * @param options 请求配置
 * @returns Promise<ResponseData<T>>
 */
const request = <T = any>(options: RequestOptions): Promise<ResponseData<T>> => {
  const { url, method = 'GET', data = {}, header = {}, needAuth = true } = options

  const token = storage.get(config.tokenKey)
  console.log('[request] 准备请求', { url, method, needAuth, token: token ? '有token' : '无token' })
  
  // 如果需要认证但没有token，直接拦截跳转
  if (needAuth && !token) {
    console.log('[request] 没有token，直接跳转到登录页')
    handle401Error()
    return Promise.reject({ success: false, message: '请先登录' })
  }
  
  if (needAuth && token) {
    header['Authorization'] = `Bearer ${token}`
    console.log('[request] 添加了Authorization header')
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: `${config.apiBaseUrl}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...header
      },
      success: (res: any) => {
        console.log('[request] 响应成功', { statusCode: res.statusCode, data: res.data })
        
        // 处理401未认证
        if (res.statusCode === 401) {
          handle401Error()
          reject(res)
          return
        }

        const result = res.data as ResponseData<T>
        
        // 处理业务返回的未登录错误
        if (!result.success && (
          result.message?.includes('未登录') || 
          result.message?.includes('令牌') || 
          result.message?.includes('登录已过期') ||
          result.message?.includes('token') ||
          result.message?.includes('Token')
        )) {
          console.log('[request] 业务返回未登录，清除token')
          handle401Error()
          reject(result)
          return
        }
        
        if (result.success) {
          resolve(result)
        } else {
          console.log('[request] 业务失败', result.message)
          uni.showToast({
            title: result.message || '请求失败',
            icon: 'none'
          })
          reject(result)
        }
      },
      fail: (err) => {
        console.error('[request] 请求失败', err)
        uni.showToast({
          title: '网络错误，请检查后端服务',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

export default request
