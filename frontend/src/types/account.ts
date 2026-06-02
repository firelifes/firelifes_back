// 账户类型枚举
export type AccountType = 'cash' | 'investment' | 'fixed_asset' | 'depreciable_asset' | 'liability' | 'credit_card';

// 还款方式类型
export type RepaymentMethod = 'equal_principal_interest' | 'equal_principal' | 'interest_first' | 'flexible';

// 信用卡还款方式
export type CreditCardPaymentType = 'full' | 'minimum' | 'custom';

// 信用卡专用字段
export interface CreditCardFields {
  billingDay: number;
  dueDay: number;
  creditLimit?: number;
  minPaymentRate?: number;
  dailyInterestRate?: number;
}

// 信用卡还款计算结果
export interface CreditCardRepaymentResult {
  billAmount: number;
  minPayment: number;
  repaymentAmount: number;
  unpaidAmount: number;
  dailyInterest: number;
  newBalance: number;
  paymentType: CreditCardPaymentType;
}

// 账户数据结构
export interface Account {
  id: string;
  userId: string;
  name: string;
  icon: string;
  type: AccountType;
  balance: number;
  description?: string;
  isDefaultExpense: boolean;
  isDefaultIncome: boolean;
  // 负债类账户专用字段
  originalPrincipal?: number;
  annualInterestRate?: number;
  repaymentMethod?: RepaymentMethod;
  totalMonths?: number;
  remainingMonths?: number;
  repaymentDay?: number;
  linkedAssetAccountId?: string;
  lastRepaymentDate?: string;
  // 信用卡专用字段
  creditCardFields?: CreditCardFields;
  order: number;
  isVisible: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// 创建/编辑账户的请求参数
export interface AccountRequest {
  name: string;
  icon: string;
  type: AccountType;
  balance: number;
  description?: string;
  isDefaultExpense: boolean;
  isDefaultIncome: boolean;
  // 负债类账户专用字段
  originalPrincipal?: number;
  annualInterestRate?: number;
  repaymentMethod?: RepaymentMethod;
  totalMonths?: number;
  remainingMonths?: number;
  repaymentDay?: number;
  linkedAssetAccountId?: string;
  // 信用卡专用字段
  creditCardFields?: CreditCardFields;
}

// 默认账户配置
export const DEFAULT_ACCOUNTS: Omit<Account, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '现金',
    icon: 'account-icon-wallet',
    type: 'cash',
    balance: 0,
    description: '日常现金备用',
    order: 1,
    isDefaultExpense: true,
    isDefaultIncome: true,
    isVisible: true,
    isDeleted: false
  },
  {
    name: '折旧资产',
    icon: 'account-icon-mobile',
    type: 'depreciable_asset',
    balance: 0,
    description: '手机、电脑等折旧物品',
    order: 2,
    isDefaultExpense: false,
    isDefaultIncome: false,
    isVisible: true,
    isDeleted: false
  },
  {
    name: '固定资产',
    icon: 'account-icon-house',
    type: 'fixed_asset',
    balance: 0,
    description: '房产、车位等高价值物品',
    order: 3,
    isDefaultExpense: false,
    isDefaultIncome: false,
    isVisible: true,
    isDeleted: false
  }
]

// 账户类型选项
export const ACCOUNT_TYPE_OPTIONS = [
  { value: 'cash' as AccountType, label: '现金类' },
  { value: 'investment' as AccountType, label: '投资类' },
  { value: 'fixed_asset' as AccountType, label: '固定资产类' },
  { value: 'depreciable_asset' as AccountType, label: '折旧资产类' },
  { value: 'liability' as AccountType, label: '负债类' },
  { value: 'credit_card' as AccountType, label: '信用卡类' },
]

// 预设图标 (SVG 图标类名，与 category-icons.css 中的 .account-icon-* 对应)
export const ACCOUNT_ICONS = [
  'account-icon-wallet',
  'account-icon-bank',
  'account-icon-piggy',
  'account-icon-trending',
  'account-icon-house',
  'account-icon-car',
  'account-icon-credit-card',
  'account-icon-mobile',
  'account-icon-laptop',
  'account-icon-game',
  'account-icon-camera',
  'account-icon-music',
  'account-icon-book',
  'account-icon-gift',
  'account-icon-coins',
  'account-icon-scan',
  'account-icon-shield',
  'account-icon-loan',
  'account-icon-visa-card',
  'account-icon-card-chip',
]

// 获取账户类型的余额颜色
export const getBalanceColor = (type: AccountType, balance?: number): string => {
  if (balance !== undefined && balance < 0) {
    return '#FA3534'
  }
  if (type === 'liability' || type === 'credit_card') {
    return '#FA3534'
  }
  return '#19BE6B'
}

// 计算信用卡免息期
export const calculateInterestFreePeriod = (billingDay: number, dueDay: number): { min: number; max: number } => {
  const min = dueDay > billingDay
    ? dueDay - billingDay
    : dueDay + 30 - billingDay
  const max = min + 30
  return { min, max }
}

/**
 * Emoji → SVG图标类名映射表
 * 用于兼容旧用户数据库中仍为emoji的icon字段
 * 调用后端迁移接口后可移除此兼容逻辑
 */
const EMOJI_TO_SVG_MAP: Record<string, string> = {
  '💵': 'account-icon-wallet',
  '💰': 'account-icon-wallet',
  '🏦': 'account-icon-bank',
  '💚': 'account-icon-piggy',
  '📈': 'account-icon-trending',
  '🏠': 'account-icon-house',
  '🚗': 'account-icon-car',
  '💳': 'account-icon-credit-card',
  '📱': 'account-icon-mobile',
  '💻': 'account-icon-laptop',
  '🎮': 'account-icon-game',
  '📷': 'account-icon-camera',
  '🎵': 'account-icon-music',
  '📚': 'account-icon-book',
  '🎁': 'account-icon-gift',
  '💼': 'account-icon-briefcase',
  '🔧': 'account-icon-wrench',
  '✈️': 'account-icon-plane',
  '🏖️': 'account-icon-umbrella',
  '🎓': 'account-icon-graduation',
  '🏥': 'account-icon-hospital',
}

/** 按账户类型给默认SVG图标（兜底） */
const DEFAULT_ICON_BY_TYPE: Record<AccountType, string> = {
  cash: 'account-icon-wallet',
  investment: 'account-icon-trending',
  fixed_asset: 'account-icon-house',
  depreciable_asset: 'account-icon-mobile',
  liability: 'account-icon-loan',
  credit_card: 'account-icon-credit-card',
}

/**
 * 获取账户图标的CSS类名（兼容emoji）
 * 如果icon已经是SVG类名则直接返回，如果是emoji则映射为SVG类名
 */
export const getAccountIconClass = (icon: string, type?: AccountType): string => {
  if (icon.startsWith('account-icon-') || icon.startsWith('login-icon-')) {
    return icon
  }
  // emoji → SVG映射
  if (EMOJI_TO_SVG_MAP[icon]) {
    return EMOJI_TO_SVG_MAP[icon]
  }
  // 兜底：按类型给默认图标
  if (type && DEFAULT_ICON_BY_TYPE[type]) {
    return DEFAULT_ICON_BY_TYPE[type]
  }
  return 'account-icon-wallet'
}
