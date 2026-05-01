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
  if (needAuth && token) {
    header['Authorization'] = `Bearer ${token}`
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
        const result = res.data as ResponseData<T>
        if (result.success) {
          resolve(result)
        } else {
          uni.showToast({
            title: result.message || '请求失败',
            icon: 'none'
          })
          reject(result)
        }
      },
      fail: (err) => {
        console.error('请求失败:', err);
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
