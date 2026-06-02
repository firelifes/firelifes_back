import request from './request'

export interface Ad {
  id: number
  imageUrl: string
  linkUrl?: string
  duration: number
}

export const getSplashAd = () => {
  return request({
    url: '/api/ads/splash',
    method: 'GET',
    needAuth: false
  })
}
