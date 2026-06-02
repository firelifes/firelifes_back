import { recordApi, type RecordData } from '../api/record'

const DAYS = 30
const TOP_N = 8
const MONTH_PAGE_SIZE = 100

export interface CategoryFrequency {
  typeId: number
  count: number
  lastUsedAt: string
}

function formatMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

async function fetchMonthRecords(yearMonth: string): Promise<RecordData[]> {
  const res = await recordApi.getRecordsByMonth(yearMonth, 1, MONTH_PAGE_SIZE)
  if (!res.success || !res.data) return []
  return res.data.list || res.data || []
}

export async function getFrequentCategoryIds(type: 'income' | 'expense'): Promise<CategoryFrequency[]> {
  try {
    const now = new Date()
    const currentMonth = formatMonth(now.getFullYear(), now.getMonth() + 1)
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevMonth = formatMonth(prevDate.getFullYear(), prevDate.getMonth() + 1)

    const [currentRecords, prevRecords] = await Promise.all([
      fetchMonthRecords(currentMonth),
      fetchMonthRecords(prevMonth),
    ])

    const allRecords = [...currentRecords, ...prevRecords]

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - DAYS)
    const cutoffStr = cutoff.toISOString().split('T')[0]

    const freqMap = new Map<number, { count: number; lastUsedAt: string }>()

    for (const record of allRecords) {
      if (record.date < cutoffStr) continue
      if (record.type !== type) continue

      const existing = freqMap.get(record.typeId)
      if (existing) {
        existing.count++
        if (record.date > existing.lastUsedAt) {
          existing.lastUsedAt = record.date
        }
      } else {
        freqMap.set(record.typeId, { count: 1, lastUsedAt: record.date })
      }
    }

    const sorted = Array.from(freqMap.entries())
      .map(([typeId, data]) => ({
        typeId,
        count: data.count,
        lastUsedAt: data.lastUsedAt
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count
        return b.lastUsedAt.localeCompare(a.lastUsedAt)
      })

    return sorted.slice(0, TOP_N)
  } catch {
    return []
  }
}
