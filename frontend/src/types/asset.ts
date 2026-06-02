export type DepreciatingCategory =
  | 'phone'
  | 'computer'
  | 'camera'
  | 'appliance'
  | 'footwear'
  | 'furniture'
  | 'bag'
  | 'sports'
  | 'other'

export type DepreciationMethod = 'straight-line' | 'double-declining-balance'

export const CATEGORY_LABELS: Record<DepreciatingCategory, string> = {
  phone: '手机',
  computer: '电脑',
  camera: '相机',
  appliance: '家电',
  footwear: '鞋服',
  furniture: '家具',
  bag: '包袋',
  sports: '运动',
  other: '其他',
}

export const METHOD_LABELS: Record<DepreciationMethod, string> = {
  'straight-line': '直线法',
  'double-declining-balance': '双倍余额递减法',
}

export interface CategoryDefaults {
  defaultDepreciationMethod: DepreciationMethod
  defaultLifeMonths: number
  residualRate: number
}

export const CATEGORY_DEFAULTS: Record<DepreciatingCategory, CategoryDefaults> = {
  phone: { defaultDepreciationMethod: 'double-declining-balance', defaultLifeMonths: 36, residualRate: 0.1 },
  computer: { defaultDepreciationMethod: 'double-declining-balance', defaultLifeMonths: 48, residualRate: 0.1 },
  camera: { defaultDepreciationMethod: 'straight-line', defaultLifeMonths: 60, residualRate: 0.15 },
  appliance: { defaultDepreciationMethod: 'straight-line', defaultLifeMonths: 60, residualRate: 0.1 },
  footwear: { defaultDepreciationMethod: 'straight-line', defaultLifeMonths: 24, residualRate: 0.1 },
  furniture: { defaultDepreciationMethod: 'straight-line', defaultLifeMonths: 120, residualRate: 0.15 },
  bag: { defaultDepreciationMethod: 'straight-line', defaultLifeMonths: 36, residualRate: 0.15 },
  sports: { defaultDepreciationMethod: 'straight-line', defaultLifeMonths: 36, residualRate: 0.05 },
  other: { defaultDepreciationMethod: 'straight-line', defaultLifeMonths: 24, residualRate: 0.1 },
}

export function calculateMonthlyDepreciation(
  purchasePrice: number,
  residualValue: number,
  lifeMonths: number,
  method: DepreciationMethod
): number {
  if (method === 'straight-line') {
    return (purchasePrice - residualValue) / lifeMonths
  }
  return purchasePrice * (2 / lifeMonths)
}

export interface DepreciatingAssetData {
  name: string
  category: DepreciatingCategory
  depreciationMethod: DepreciationMethod
  purchasePrice: number
  purchaseDate: string
  expectedLifeMonths: number
  residualValue: number
}
