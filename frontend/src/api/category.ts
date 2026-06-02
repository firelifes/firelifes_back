/**
 * api/category.ts - 分类 API
 * 
 * 功能说明：
 * - 获取所有分类（带分组）
 * - 按类型获取分类（支出/收入）
 * - 获取用户自定义分类
 * - 获取分类图标列表
 * - 分类大类管理（增删改查）
 * 
 * API 端点：
 * - GET /category - 获取所有分类
 * - GET /category/:type - 按类型获取
 * - GET /category/user/:type - 用户自定义分类
 * - GET /user/icons - 获取图标列表
 * - GET /category/user/groups/all - 获取用户分类大类
 * - POST /category/user/groups - 创建分类大类
 * - PUT /category/user/groups/:id - 更新分类大类
 * - DELETE /category/user/groups/:id - 删除分类大类
 * 
 * 技术栈：TypeScript + uni-app
 */

import request from './request'

/**
 * 分类图标接口
 */
export interface CategoryIcon {
  id: number
  name: string
  url: string
  iconType: string
}

/**
 * 分类项接口
 */
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

/**
 * 分类分组接口
 */
export interface CategoryGroup {
  id: number
  name: string
  sortOrder: number
  children: CategoryItem[]
}

/**
 * 分类响应接口
 */
export interface CategoryResponse {
  expense: CategoryGroup[]
  income: CategoryGroup[]
}

/**
 * 用户分类大类接口
 */
export interface UserCategoryGroup {
  id: number
  name: string
  type?: 'expense' | 'income'
  sortOrder: number
  isEnabled: boolean
  isUserCreated: boolean
  childrenCount?: number
  createdAt: string
  updatedAt: string
}

/**
 * 用户图标接口
 */
export interface UserIcon {
  id: number
  userId: number
  name: string
  url: string
  iconType: 'emoji' | 'image'
  sortOrder: number
  isEnabled: boolean
  createdAt: string
  updatedAt: string
}

/**
 * 用户子分类接口
 */
export interface UserCategory {
  id: number
  userId: number
  name: string
  iconId: number
  icon?: { id: number; url: string }
  type: 'income' | 'expense'
  groupId: number
  sortOrder: number
  isEnabled: boolean
  isUserCreated: boolean
  createdAt: string
  updatedAt: string
}

export const categoryApi = {
  /**
   * 获取所有分类（带分组）
   */
  getAllCategories: () => {
    return request<CategoryResponse>({
      url: '/api/category',
      method: 'GET',
    })
  },

  /**
   * 按类型获取分类（支出/收入）
   * @param type 分类类型：income-收入 expense-支出
   */
  getCategoriesByType: (type: 'income' | 'expense') => {
    return request<CategoryGroup[]>({
      url: `/api/category/${type}`,
      method: 'GET',
    })
  },

  /**
   * 获取用户自定义分类
   * @param type 分类类型：income-收入 expense-支出
   */
  getUserCategories: (type: 'income' | 'expense') => {
    return request<CategoryGroup[]>({
      url: `/api/category/user/${type}`,
      method: 'GET',
    })
  },

  /**
   * 获取用户图标列表
   */
  getUserIcons: () => {
    return request<UserIcon[]>({
      url: '/api/user/icons',
      method: 'GET',
    })
  },

  /**
   * 获取用户分类大类列表
   */
  getUserGroups: () => {
    return request<UserCategoryGroup[]>({
      url: '/api/category/user/groups/all',
      method: 'GET',
    })
  },

  /**
   * 创建分类大类
   */
  createUserGroup: (data: { name: string; type?: 'income' | 'expense' }) => {
    return request<UserCategoryGroup>({
      url: '/api/category/user/groups',
      method: 'POST',
      data,
    })
  },

  /**
   * 更新分类大类
   */
  updateUserGroup: (id: number, data: { name: string; type?: 'income' | 'expense' }) => {
    return request<UserCategoryGroup>({
      url: `/api/category/user/groups/${id}`,
      method: 'PUT',
      data,
    })
  },

  /**
   * 切换分类大类启用/禁用状态
   */
  toggleUserGroup: (id: number) => {
    return request<UserCategoryGroup>({
      url: `/api/category/user/groups/${id}/toggle`,
      method: 'POST',
    })
  },

  /**
   * 删除分类大类
   */
  deleteUserGroup: (id: number) => {
    return request({
      url: `/api/category/user/groups/${id}`,
      method: 'DELETE',
    })
  },

  /**
   * 重新排序分类大类
   */
  reorderGroups: (orderedIds: number[]) => {
    return request({
      url: '/api/category/user/groups/reorder',
      method: 'POST',
      data: { orderedIds },
    })
  },

  /**
   * 获取指定大类下的子分类列表
   */
  getCategoriesByGroup: (groupId: number) => {
    return request<UserCategory[]>({
      url: `/api/category/group/${groupId}`,
      method: 'GET',
    })
  },

  /**
   * 创建子分类
   */
  createCategory: (data: { name: string; groupId: number; iconId: number; type: 'income' | 'expense' }) => {
    return request<UserCategory>({
      url: '/api/category/user',
      method: 'POST',
      data,
    })
  },

  /**
   * 更新子分类
   */
  updateCategory: (id: number, data: { name: string; iconId: number }) => {
    return request<UserCategory>({
      url: `/api/category/user/${id}`,
      method: 'PUT',
      data,
    })
  },

  /**
   * 切换子分类启用/禁用状态
   */
  toggleCategory: (id: number) => {
    return request<UserCategory>({
      url: `/api/category/user/${id}/toggle`,
      method: 'POST',
    })
  },

  /**
   * 删除子分类
   */
  deleteCategory: (id: number) => {
    return request({
      url: `/api/category/user/${id}`,
      method: 'DELETE',
    })
  },

  /**
   * 重新排序子分类
   */
  reorderCategories: (groupId: number, orderedIds: number[]) => {
    return request({
      url: `/api/category/group/${groupId}/reorder`,
      method: 'POST',
      data: { orderedIds },
    })
  },
}
