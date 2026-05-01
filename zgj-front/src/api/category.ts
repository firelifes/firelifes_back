/**
 * 分类 API 调用模块
 */
import request from './request'

export interface CategoryIcon {
  id: number
  name: string
  url: string
  iconType: string
}

export interface CategoryItem {
  id: number
  name: string
  iconId: number
  iconUrl: string
  sortOrder: number
  isUserCreated: boolean
  groupId: number
  type: string
}

export interface CategoryGroup {
  id: number
  name: string
  sortOrder: number
  children: CategoryItem[]
}

export interface CategoryResponse {
  expense: CategoryGroup[]
  income: CategoryGroup[]
}

export const categoryApi = {
  /**
   * 获取所有分类（带分组）
   */
  getAllCategories: () => {
    return request<CategoryResponse>({
      url: '/category',
      method: 'GET',
    })
  },

  /**
   * 按类型获取分类（支出/收入）
   */
  getCategoriesByType: (type: 'income' | 'expense') => {
    return request<CategoryGroup[]>({
      url: `/category/${type}`,
      method: 'GET',
    })
  },

  /**
   * 获取用户自定义分类
   */
  getUserCategories: (type: 'income' | 'expense') => {
    return request<CategoryGroup[]>({
      url: `/category/user/${type}`,
      method: 'GET',
    })
  },

  /**
   * 获取用户图标列表
   */
  getUserIcons: () => {
    return request<CategoryIcon[]>({
      url: '/user/icons',
      method: 'GET',
    })
  },
}
