/**
 * api/auth.ts - 用户认证 API
 * 
 * 功能说明：
 * - 发送短信验证码（注册/登录/重置密码）
 * - 用户注册
 * - 用户登录（密码/验证码/微信）
 * - 获取用户信息
 * - 用户退出登录
 * 
 * API 端点：
 * - /auth/send-sms - 发送短信
 * - /auth/register - 用户注册
 * - /auth/login - 用户登录
 * - /auth/me - 获取当前用户信息
 * - /auth/logout - 退出登录
 * 
 * 技术栈：TypeScript + uni-app
 */

import request from './request'

/**
 * 用户信息接口
 */
export interface User {
  id: number
  username: string
  phone: string
  nickname?: string
  avatarUrl?: string
}

/**
 * 认证响应接口
 */
export interface AuthResponse {
  token: string
  user: User
}

/**
 * 发送短信验证码
 * @param phone 手机号
 * @param type 验证码类型：register-注册 login-登录 reset-password-重置密码
 */
export const sendSmsCode = (phone: string, type: 'register' | 'login' | 'reset-password' = 'login') => {
  return request({
    url: '/api/auth/send-sms',
    method: 'POST',
    data: { phone, type },
    needAuth: false
  })
}

/**
 * 用户注册
 * @param data 注册数据（手机号、验证码、密码、昵称）
 */
export const register = (data: {
  phone: string
  code: string
  password: string
  nickname?: string
}) => {
  return request({
    url: '/api/auth/register',
    method: 'POST',
    data,
    needAuth: false
  })
}

/**
 * 用户登录
 * @param data 登录数据（支持密码、验证码、微信登录）
 */
export const login = (data: {
  phone: string
  password?: string
  code?: string
  wechatCode?: string
  wechatInfo?: any
}) => {
  return request({
    url: '/api/auth/login',
    method: 'POST',
    data,
    needAuth: false
  })
}

/**
 * 微信注册
 * @param data 微信注册数据（授权code）
 */
export const wechatRegister = (data: {
  code: string
  phone?: string
}) => {
  return request({
    url: '/api/auth/wechat-register',
    method: 'POST',
    data,
    needAuth: false
  })
}

/**
 * 获取当前登录用户信息
 */
export const getUserInfo = () => {
  return request({
    url: '/api/auth/me',
    method: 'GET'
  })
}

/**
 * 重置密码（成功后自动登录）
 * @param data 重置数据（手机号、验证码、新密码）
 */
export const resetPassword = (data: {
  phone: string
  code: string
  password: string
}) => {
  return request({
    url: '/api/auth/reset-password',
    method: 'POST',
    data,
    needAuth: false
  })
}

/**
 * 用户退出登录
 */
export const logout = () => {
  return request({
    url: '/api/auth/logout',
    method: 'POST'
  })
}
