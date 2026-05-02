import config from '../config/index'
import { storage } from '../utils/storage'

interface RequestOptions<T = any> {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: any
  needAuth?: boolean
}

interface ResponseData<T = any> {
  success: boolean
  message: string
  data: T
}

const request = <T = any>(options: RequestOptions): Promise<ResponseData<T>> => {
  const { url, method = 'GET', data = {}, header = {}, needAuth = true } = options

  const token = storage.get(config.tokenKey)
  console.log('[request] 准备请求', { url, method, needAuth, token: token ? '有token' : '无token' })
  
  // 如果需要认证但没有token，直接拦截跳转
  if (needAuth && !token) {
    console.log('[request] 没有token，直接跳转到登录页')
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    })
    setTimeout(() => {
      uni.redirectTo({
        url: '/pages/login/index'
      })
    }, 1500)
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
          storage.remove(config.tokenKey)
          storage.remove(config.userKey)
          uni.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none'
          })
          setTimeout(() => {
            uni.redirectTo({
              url: '/pages/login/index'
            })
          }, 1500)
          reject(res)
          return
        }

        const result = res.data as ResponseData<T>
        
        // 处理业务返回的未登录错误
        if (!result.success && (
          result.message?.includes('未登录') || 
          result.message?.includes('令牌') || 
          result.message?.includes('登录已过期')
        )) {
          console.log('[request] 业务返回未登录，清除token')
          storage.remove(config.tokenKey)
          storage.remove(config.userKey)
          uni.showToast({
            title: '请重新登录',
            icon: 'none'
          })
          setTimeout(() => {
            uni.redirectTo({
              url: '/pages/login/index'
            })
          }, 1500)
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
