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

// 获取隐式账户列表（应收账款/应付账款）
export const getImplicitAccounts = () => {
  return request<Account[]>({
    url: '/api/accounts/implicit',
    method: 'GET'
  })
}

// 创建/获取隐式账户（应收/应付）
export const createImplicitAccount = (type: 'receivable' | 'payable', counterparty: string) => {
  return request<{
    accountId: string
    name: string
    type: 'receivable' | 'payable'
    isNew: boolean
  }>({
    url: '/api/accounts/implicit',
    method: 'POST',
    data: { type, counterparty }
  })
}

// 获取借贷对方列表
export const getCounterparties = () => {
  return request<string[]>({
    url: '/api/accounts/counterparties',
    method: 'GET'
  })
}
