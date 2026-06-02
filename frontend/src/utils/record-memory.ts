/**
 * 记账智能记忆工具
 * 本地存储分类→账户映射，减少连续记账时的重复操作
 *
 * 记忆维度：
 * - 支出/收入：按分类ID记忆上次使用的账户
 * - 转账：分别记忆转出/转入账户
 * - 还债：分别记忆还款/债权账户
 */

const STORAGE_PREFIX = 'record_memory_'

/** 记忆Key类型 */
type MemoryType = 'expense' | 'income' | 'transfer_from' | 'transfer_to' | 'repayment_from' | 'repayment_to'

/**
 * 构建存储Key
 * 支出/收入按分类ID区分，转账/还债按角色区分
 */
function buildKey(type: MemoryType, categoryId?: number): string {
  if (type === 'expense' || type === 'income') {
    return `${STORAGE_PREFIX}${type}_${categoryId || 0}`
  }
  return `${STORAGE_PREFIX}${type}`
}

/**
 * 写入：记账成功后调用
 * @param type 记忆类型
 * @param categoryId 分类ID（支出/收入时必传）
 * @param accountId 账户ID
 */
export function saveAccountMemory(
  type: MemoryType,
  categoryId: number | undefined,
  accountId: string
): void {
  const key = buildKey(type, categoryId)
  try {
    uni.setStorageSync(key, accountId)
  } catch (e) {
    console.warn('记账记忆写入失败:', e)
  }
}

/**
 * 读取：选分类时调用
 * @param type 记忆类型
 * @param categoryId 分类ID（支出/收入时必传）
 * @returns 记忆的账户ID，无记录返回null
 */
export function getAccountMemory(
  type: MemoryType,
  categoryId?: number
): string | null {
  const key = buildKey(type, categoryId)
  try {
    const val = uni.getStorageSync(key)
    return val || null
  } catch (e) {
    console.warn('记账记忆读取失败:', e)
    return null
  }
}

/**
 * 清除某条记忆（记忆的账户已不可用时）
 */
export function clearAccountMemory(
  type: MemoryType,
  categoryId?: number
): void {
  const key = buildKey(type, categoryId)
  try {
    uni.removeStorageSync(key)
  } catch (e) {
    console.warn('记账记忆清除失败:', e)
  }
}

/**
 * 根据记忆查找可用账户
 * 先查记忆，如果记忆的账户在可用列表中则返回该账户，否则清除记忆返回null
 * @param type 记忆类型
 * @param categoryId 分类ID
 * @param availableAccounts 当前可用的账户列表
 * @returns 记忆匹配的账户，或null
 */
export function findAccountByMemory(
  type: MemoryType,
  categoryId: number | undefined,
  availableAccounts: { id: string; isDeleted?: boolean; isVisible?: boolean }[]
): { id: string } | null {
  const memoryId = getAccountMemory(type, categoryId)
  if (!memoryId) return null

  const matched = availableAccounts.find(a => a.id === memoryId)
  if (matched) return matched

  // 记忆的账户不可用，清除记忆
  clearAccountMemory(type, categoryId)
  return null
}
