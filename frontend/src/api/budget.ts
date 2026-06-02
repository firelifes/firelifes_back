/**
 * api/budget.ts - 预算 API
 *
 * 预算体系：
 * - 年度总预算：用户设定年度总支出上限，从年度视角管控消费
 * - 年度分类预算：为每个支出分类设定年度金额，自动拆解为月度预算
 * - 月度总预算：自动分解或手动设定的月度总支出上限（软参考）
 * - 月度分类预算：每月各分类的具体预算金额
 *
 * API 端点：
 * - POST /api/budgets - 创建预算
 * - POST /api/budgets/yearly/batch - 批量创建年度预算（自动拆解12个月）
 * - PUT /api/budgets/:id - 更新预算
 * - GET /api/budgets/list - 获取月度预算列表
 * - GET /api/budgets/annual-summary - 获取年度预算汇总
 * - GET /api/budgets/overview/current - 获取当前预算概览
 * - DELETE /api/budgets/:id - 删除预算
 * - POST /api/budgets/copy-month - 复制上月预算
 */

import request from './request'

export interface BudgetItem {
  id: number
  userId: number
  budgetType: string
  name: string
  typeId: number | null
  categoryGroupId: number | null
  periodType: string
  year: number
  month: number
  amount: number
  isBase: boolean
  spent: number
  alertThreshold: number
  alertEnabled: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface BudgetDetail {
  id: number
  name: string
  typeId: number | null
  amount: number
  spent: number
  remainingAmount: number
  usedPercentage: number
  alertStatus: 'healthy' | 'normal' | 'warning' | 'danger'
}

export interface BudgetOverview {
  year: number
  month: number
  daysInMonth: number
  currentDay: number
  totalBudget: number
  totalUsed: number
  totalRemaining: number
  usedPercentage: number
  dailyAverage: number
  projectedMonthEnd: number
  budgets: BudgetDetail[]
}

export interface AnnualBudgetMonth {
  month: number
  budgetId: number | null
  amount: number
  spent: number
}

export interface AnnualBudgetItem {
  typeId: number | null
  yearlyAmount: number
  monthlyAmount: number
  totalSpent: number
  months: AnnualBudgetMonth[]
}

export interface AnnualBudgetSummary {
  year: number
  totalYearlyBudget: number
  totalYearlySpent: number
  items: AnnualBudgetItem[]
}

export const budgetApi = {
  createBudget: (data: {
    name: string
    typeId?: number
    categoryGroupId?: number
    year: number
    month: number
    amount: number
    alertThreshold?: number
  }) => {
    return request<BudgetItem>({
      url: '/api/budgets',
      method: 'POST',
      data,
    })
  },

  createYearlyBatch: (data: {
    year: number
    budgets: Array<{
      typeId?: number
      yearlyAmount: number
      alertThreshold?: number
    }>
  }) => {
    return request<BudgetItem[]>({
      url: '/api/budgets/yearly/batch',
      method: 'POST',
      data,
    })
  },

  updateBudget: (id: number, data: {
    name?: string
    amount?: number
    alertThreshold?: number
  }) => {
    return request<BudgetItem>({
      url: `/api/budgets/${id}`,
      method: 'PUT',
      data,
    })
  },

  deleteBudget: (id: number) => {
    return request({
      url: `/api/budgets/${id}`,
      method: 'DELETE',
    })
  },

  getBudgets: (year: number, month: number) => {
    return request<{ totalBudget: number; totalUsed: number; totalRemaining: number; budgets: BudgetItem[] }>({
      url: '/api/budgets/list',
      method: 'POST',
      data: { year, month },
    })
  },

  getAnnualSummary: (year?: number) => {
    const query = year !== undefined ? `?year=${year}` : ''
    return request<AnnualBudgetSummary>({
      url: `/api/budgets/annual-summary${query}`,
      method: 'GET',
    })
  },

  getCurrentOverview: () => {
    return request<BudgetOverview>({
      url: '/api/budgets/overview/current',
      method: 'GET',
    })
  },

  copyMonth: (year: number, month: number) => {
    return request<BudgetItem[]>({
      url: '/api/budgets/copy-month',
      method: 'POST',
      data: { year, month },
    })
  },
}
