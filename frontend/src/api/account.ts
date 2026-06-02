import request from './request'
import type { Account, AccountRequest } from '../types/account'

// 获取账户列表
export const getAccountList = () => {
  return request<Account[]>({
    url: '/api/accounts',
    method: 'GET'
  })
}

// 获取账户详情
export const getAccountDetail = (id: string) => {
  return request<Account>({
    url: `/api/accounts/${id}`,
    method: 'GET'
  })
}

// 创建账户
export const createAccount = (data: AccountRequest) => {
  return request<Account>({
    url: '/api/accounts',
    method: 'POST',
    data
  })
}

// 更新账户
export const updateAccount = (id: string, data: AccountRequest) => {
  return request<Account>({
    url: `/api/accounts/${id}`,
    method: 'PUT',
    data
  })
}

// 删除账户
export const deleteAccount = (id: string) => {
  return request({
    url: `/api/accounts/${id}`,
    method: 'DELETE'
  })
}
