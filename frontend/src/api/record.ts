/**
 * api/record.ts - 记账记录 API
 * 
 * 功能说明：
 * - 记账记录的增删改查
 * - 按年月分页查询记录
 * - 获取月份收支汇总
 * 
 * API 端点：
 * - POST /record - 创建记录
 * - PUT /record/:id - 更新记录
 * - GET /record/:id - 获取单条记录
 * - GET /record - 获取所有记录
 * - GET /record/page - 分页查询
 * - GET /record/month-summary - 月份汇总
 * - DELETE /record/:id - 删除记录
 * 
 * 技术栈：TypeScript + uni-app
 */

import request from './request'

/**
 * 记账记录数据接口
 */
export interface RecordData {
  id: number
  typeId: number
  date: string
  amount: number
  type: RecordType
  accountId?: number
  toAccountId?: number
  remark?: string
  createdAt?: string
}

/**
 * 月份收支汇总接口
 */
export interface MonthSummary {
  income: number
  expense: number
}

/**
 * 分页结果接口
 */
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export type RecordType = 'income' | 'expense' | 'transfer' | 'repayment' | 'adjustment_increase' | 'adjustment_decrease'

export interface CreateRecordAssetData {
  name: string
  category: string
  depreciationMethod: string
  purchasePrice: number
  purchaseDate: string
  expectedLifeMonths: number
  residualValue: number
}

export interface CreateRecordData {
  typeId?: number
  type: RecordType
  amount: number
  accountId?: number
  toAccountId?: number
  remark?: string
  date: string
  depreciatingAsset?: CreateRecordAssetData
}

export const recordApi = {
  /**
   * 创建记账记录
   * @param data 记账数据
   */
  createRecord: (data: CreateRecordData) => {
    return request({
      url: '/api/record',
      method: 'POST',
      data,
    })
  },

  /**
   * 更新记账记录
   * @param id 记录 ID
   * @param data 需要更新的数据
   */
  updateRecord: (
    id: number,
    data: {
      typeId?: number
      type?: RecordType
      amount?: number
      accountId?: number
      toAccountId?: number
      remark?: string
      date?: string
    }
  ) => {
    return request({
      url: `/api/record/${id}`,
      method: 'PUT',
      data,
    })
  },

  /**
   * 获取单条记账记录
   * @param id 记录 ID
   */
  getRecord: (id: number) => {
    return request<RecordData>({
      url: `/api/record/${id}`,
      method: 'GET',
    })
  },

  /**
   * 获取当前用户所有记账记录
   */
  getAllRecords: () => {
    return request<RecordData[]>({
      url: '/api/record',
      method: 'GET',
    })
  },

  /**
   * 按年月分页查询记账记录
   * @param yearMonth 年月（格式：YYYY-MM）
   * @param page 页码
   * @param pageSize 每页条数
   */
  getRecordsByMonth: (yearMonth: string, page: number = 1, pageSize: number = 50) => {
    return request<PageResult<RecordData>>({
      url: '/api/record/page',
      method: 'GET',
      data: { yearMonth, page, pageSize },
    })
  },

  /**
   * 获取指定月份的收支汇总
   * @param yearMonth 年月（格式：YYYY-MM）
   */
  getMonthSummary: (yearMonth: string) => {
    return request<MonthSummary>({
      url: '/api/record/month-summary',
      method: 'GET',
      data: { yearMonth },
    })
  },

  getRecordsByAccount: (accountId: number, page: number = 1, pageSize: number = 50) => {
    return request({
      url: `/api/record/by-account/${accountId}`,
      method: 'GET',
      data: { page, pageSize },
    })
  },

  /**
   * 获取当前净资产
   */
  getNetWorth: () => {
    return request<{
      netWorth: number
      cashBalance: number
      depreciatingAssetValue: number
    }>({
      url: '/api/record/net-worth',
      method: 'GET',
    })
  },

  /**
   * 获取折旧资产列表
   */
  getDepreciatingAssets: () => {
    return request<Array<{
      id: number
      name: string
      category: string
      purchasePrice: number
      currentValue: number
      expectedLifeMonths: number
      usedMonths: number
      status: string
    }>>({
      url: '/api/record/depreciating-assets',
      method: 'GET',
    })
  },

  /**
   * 根据记账记录ID获取关联的折旧资产
   */
  getDepreciatingAssetByRecordId: (recordId: number) => {
    return request<{
      id: number
      recordId: number
      name: string
      category: string
      depreciationMethod: string
      purchasePrice: number
      purchaseDate: string
      expectedLifeMonths: number
      residualValue: number
      currentValue: number
      monthlyDepreciation: number
      usedMonths: number
      status: string
    } | null>({
      url: `/api/record/depreciating-asset/${recordId}`,
      method: 'GET',
    })
  },

  /**
   * 获取年度汇总（自记账以来）
   */
  getYearlySummary: () => {
    return request<{
      totalIncome: number
      totalExpense: number
      totalBalance: number
    }>({
      url: '/api/record/yearly-summary',
      method: 'GET',
    })
  },

  /**
   * 获取各年度账单列表
   */
  getYearlyBills: () => {
    return request<Array<{
      year: number
      income: number
      expense: number
      balance: number
    }>>({
      url: '/api/record/yearly-bills',
      method: 'GET',
    })
  },

  /**
   * 删除记账记录
   * @param id 记录 ID
   */
  deleteRecord: (id: number) => {
    return request({
      url: `/api/record/${id}`,
      method: 'DELETE',
    })
  },

  /**
   * 获取当前用户最近一条记账记录（按 createdAt 倒序）
   */
  getLatestRecord: () => {
    return request<RecordData | null>({
      url: '/api/record/latest',
      method: 'GET',
    })
  },

  /**
   * 获取最近的有数据月份（跳过空月份）
   * @param yearMonth 起始年月（YYYY-MM）
   * @param direction prev=向前查找, next=向后查找
   */
  getNearestMonth: (yearMonth: string, direction: 'prev' | 'next') => {
    return request<string | null>({
      url: '/api/record/nearest-month',
      method: 'GET',
      data: { yearMonth, direction },
    })
  },
}