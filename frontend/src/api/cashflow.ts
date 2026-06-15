/**
 * api/cashflow.ts - 现金流 API
 *
 * 功能说明：
 * - 获取现金流总览数据
 * - 自由现金流趋势、现金余额、其他指标
 *
 * API 端点：
 * - GET /api/cashflow/summary - 获取现金流汇总
 *
 * 技术栈：TypeScript + uni-app
 */

import request from './request'

export interface CashflowMonthTrendItem {
  month: string
  freeCashflow: number
  cashBalance: number
}

export interface CashflowSummaryData {
  currentMonthFreeCashflow: number
  totalCashBalance: number
  monthlyTrend: CashflowMonthTrendItem[]
  savingsRate: number
  passiveCashflowRatio: number
  passiveCashflow: number
  nonEssentialExpenseRatio: number
  nonEssentialExpense: number
  debtCoverage: number
  survivalMonths: number
  totalIncome: number
  totalExpense: number
  monthlyDebtRepayment: number
  monthlyEssentialExpense: number
}

export const cashflowApi = {
  /**
   * 获取现金流汇总数据
   */
  getSummary: () => {
    return request<CashflowSummaryData>({
      url: '/api/cashflow/summary',
      method: 'GET',
    })
  },
}
