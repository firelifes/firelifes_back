/**
 * 记账记录 API
 */
import request from './request'

export interface RecordData {
  id: number
  typeId: number
  date: string
  amount: number
  type: 'income' | 'expense'
  remark?: string
  createdAt?: string
}

export interface MonthSummary {
  income: number
  expense: number
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export const recordApi = {
  /**
   * 创建记账记录
   */
  createRecord: (data: {
    typeId: number
    type: 'income' | 'expense'
    amount: number
    remark?: string
    date: string
  }) => {
    return request({
      url: '/record',
      method: 'POST',
      data,
    })
  },

  /**
   * 更新记账记录
   */
  updateRecord: (
    id: number,
    data: {
      typeId?: number
      type?: 'income' | 'expense'
      amount?: number
      remark?: string
      date?: string
    }
  ) => {
    return request({
      url: `/record/${id}`,
      method: 'PUT',
      data,
    })
  },

  /**
   * 获取单条记账记录
   */
  getRecord: (id: number) => {
    return request<RecordData>({
      url: `/record/${id}`,
      method: 'GET',
    })
  },

  /**
   * 获取当前用户所有记账记录
   */
  getAllRecords: () => {
    return request<RecordData[]>({
      url: '/record',
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
      url: '/record/page',
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
      url: '/record/month-summary',
      method: 'GET',
      data: { yearMonth },
    })
  },

  /**
   * 删除记账记录
   */
  deleteRecord: (id: number) => {
    return request({
      url: `/record/${id}`,
      method: 'DELETE',
    })
  },
}