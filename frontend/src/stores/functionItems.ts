/**
 * stores/functionItems.ts - 功能入口排序状态管理
 *
 * 功能说明：
 * - 定义全部功能入口及默认排序
 * - 持久化用户自定义排序到 localStorage
 * - 提供排序后的功能列表供 FunctionBar 和功能页使用
 *
 * 技术栈：Pinia + Vue3 + TypeScript
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface FunctionItem {
  key: string
  icon: string
  text: string
  bg?: string
  color?: string
  desc?: string
}

const DEFAULT_ITEMS: FunctionItem[] = [
  { key: 'bill', icon: 'icon-zhangdan', text: '账单' },
  { key: 'cashflow', icon: 'icon-xianjinliu', text: '现金流' },
  { key: 'asset', icon: 'icon-zichan', text: '资产管家' },
  { key: 'fire', icon: 'icon-tongji1', text: 'FIRE进度' },
  { key: 'cashback', icon: 'icon-gouwuche', text: '购物返现' },
]

const STORAGE_KEY = 'function_items_order'

function loadOrder(): string[] {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (raw && Array.isArray(raw)) return raw as string[]
  } catch {
    // ignore
  }
  return []
}

function saveOrder(order: string[]) {
  try {
    uni.setStorageSync(STORAGE_KEY, order)
  } catch {
    // ignore
  }
}

export const useFunctionItemsStore = defineStore('functionItems', () => {
  const customOrder = ref<string[]>(loadOrder())

  const sortedItems = computed<FunctionItem[]>(() => {
    if (customOrder.value.length === 0) return [...DEFAULT_ITEMS]

    const orderMap = new Map(customOrder.value.map((key, i) => [key, i]))
    return [...DEFAULT_ITEMS].sort((a, b) => {
      const ai = orderMap.get(a.key) ?? 999
      const bi = orderMap.get(b.key) ?? 999
      return ai - bi
    })
  })

  const topItems = computed<FunctionItem[]>(() => {
    return sortedItems.value.slice(0, 4)
  })

  function reorder(newOrder: string[]) {
    customOrder.value = newOrder
    saveOrder(newOrder)
  }

  return {
    sortedItems,
    topItems,
    reorder,
  }
})