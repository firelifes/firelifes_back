/**
 * 记账记录 API
 */
import request from './request'

export interface RecordData {
  id: string
  typeId: string
  date: string
  amount: number
  type: 'income' | 'expense'
  remark?: string
  createdAt?: string
}

export const recordApi = {
  /**
   * 创建记账记录
   */
  createRecord: (data: {
    typeId: string
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
    id: string,
    data: {
      typeId?: string
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
  getRecord: (id: string) => {
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
   * 删除记账记录
   */
  deleteRecord: (id: string) => {
    return request({
      url: `/record/${id}`,
      method: 'DELETE',
    })
  },
}