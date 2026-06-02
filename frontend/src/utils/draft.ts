import { storage } from './storage'

const DRAFT_KEY = 'record_draft'
const DRAFT_EXPIRE = 24 * 60 * 60 * 1000

export interface RecordDraft {
  transactionType: 'income' | 'expense'
  categoryId: number | null
  categoryName: string
  categoryIcon: string
  displayAmount: string
  remark: string
  selectedDate: string
  accountId: number | null
  accountName: string
  accountIcon: string
  fromAccountId: number | null
  fromAccountName: string
  toAccountId: number | null
  toAccountName: string
  savedAt: number
}

const createEmptyDraft = (): RecordDraft => ({
  transactionType: 'expense',
  categoryId: null,
  categoryName: '',
  categoryIcon: '',
  displayAmount: '',
  remark: '',
  selectedDate: new Date().toISOString().split('T')[0],
  accountId: null,
  accountName: '',
  accountIcon: '',
  fromAccountId: null,
  fromAccountName: '',
  toAccountId: null,
  toAccountName: '',
  savedAt: Date.now()
})

export const draft = {
  save(data: Partial<RecordDraft>) {
    const existing = draft.load()
    const merged = { ...(existing || createEmptyDraft()), ...data, savedAt: Date.now() }
    storage.set(DRAFT_KEY, merged)
  },

  load(): RecordDraft | null {
    const data = storage.get(DRAFT_KEY) as RecordDraft | null
    if (!data) return null
    return data
  },

  remove() {
    storage.remove(DRAFT_KEY)
  },

  hasValidDraft(): boolean {
    const data = draft.load()
    if (!data) return false
    if (Date.now() - data.savedAt > DRAFT_EXPIRE) {
      draft.remove()
      return false
    }
    return true
  }
}
