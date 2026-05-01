import request from './request'

export interface User {
  id: number
  username: string
  phone: string
  nickname?: string
  avatarUrl?: string
}

export interface AuthResponse {
  token: string
  user: User
}

export const sendSmsCode = (phone: string, type: 'register' | 'login' | 'reset-password' = 'login') => {
  return request({
    url: '/auth/send-sms',
    method: 'POST',
    data: { phone, type },
    needAuth: false
  })
}

export const register = (data: {
  phone: string
  code: string
  password: string
  nickname?: string
}) => {
  return request({
    url: '/auth/register',
    method: 'POST',
    data,
    needAuth: false
  })
}

export const login = (data: {
  phone: string
  password?: string
  code?: string
  wechatCode?: string
  wechatInfo?: any
}) => {
  return request({
    url: '/auth/login',
    method: 'POST',
    data,
    needAuth: false
  })
}

export const getUserInfo = () => {
  return request({
    url: '/auth/me',
    method: 'GET'
  })
}

export const logout = () => {
  return request({
    url: '/auth/logout',
    method: 'POST'
  })
}
