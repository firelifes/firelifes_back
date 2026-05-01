/**
 * 分类 API 调用模块
 */

const BASE_URL = 'http://localhost:7001'

interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
}

interface Category {
  id: string
  name: string
  icon: string
  type: 'income' | 'expense'
  sortOrder: number
}

const mockCategories: { expense: Category[]; income: Category[] } = {
  expense: [
    { id: 'expense_food', name: '餐饮', icon: '🍜', type: 'expense', sortOrder: 1 },
    { id: 'expense_shopping', name: '购物', icon: '🛍️', type: 'expense', sortOrder: 2 },
    { id: 'expense_daily', name: '日用', icon: '🧻', type: 'expense', sortOrder: 3 },
    { id: 'expense_transport', name: '交通', icon: '🚌', type: 'expense', sortOrder: 4 },
    { id: 'expense_snack', name: '零食', icon: '🍰', type: 'expense', sortOrder: 5 },
    { id: 'expense_sport', name: '运动', icon: '🚴', type: 'expense', sortOrder: 6 },
    { id: 'expense_entertainment', name: '娱乐', icon: '🎮', type: 'expense', sortOrder: 7 },
    { id: 'expense_communication', name: '通讯', icon: '📱', type: 'expense', sortOrder: 8 },
    { id: 'expense_clothing', name: '服饰', icon: '👔', type: 'expense', sortOrder: 9 },
    { id: 'expense_housing', name: '住房', icon: '🏠', type: 'expense', sortOrder: 10 },
  ],
  income: [
    { id: 'income_salary', name: '工资', icon: '💼', type: 'income', sortOrder: 1 },
    { id: 'income_bonus', name: '奖金', icon: '🎁', type: 'income', sortOrder: 2 },
    { id: 'income_invest', name: '投资', icon: '📈', type: 'income', sortOrder: 3 },
    { id: 'income_gift_money', name: '礼金', icon: '🧧', type: 'income', sortOrder: 4 },
    { id: 'income_parttime', name: '兼职', icon: '👔', type: 'income', sortOrder: 5 },
    { id: 'income_financial', name: '理财', icon: '💰', type: 'income', sortOrder: 6 },
  ],
}

const mockApi = {
  getAllCategories: () => {
    return new Promise<ApiResponse<{ expense: Category[]; income: Category[] }>>((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: '获取成功',
          data: mockCategories,
        })
      }, 300)
    })
  },
}

export const categoryApi = {
  getAllCategories: () => {
    return mockApi.getAllCategories()
  },
}