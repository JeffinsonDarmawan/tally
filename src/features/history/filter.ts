/** A history list row (an enriched expense, ready to filter/sort/render). */
export interface HistoryRow {
  id: string
  date: string
  categoryId: string | null
  categoryName: string
  paidBy: string | null
  payerCount: number
  note: string | null
  totalCents: number
  involved: string[]
  myShareCents: number
  unpaid: boolean
}

export interface HistoryFilters {
  search: string
  categoryId: string | null
  memberId: string | null
  status: 'all' | 'outstanding' | 'settled'
  from: string | null
  to: string | null
  minCents: number | null
  maxCents: number | null
}

export interface HistorySort {
  by: 'date' | 'amount'
  dir: 'asc' | 'desc'
}

export const NO_FILTERS: HistoryFilters = {
  search: '',
  categoryId: null,
  memberId: null,
  status: 'all',
  from: null,
  to: null,
  minCents: null,
  maxCents: null,
}

function matches(row: HistoryRow, f: HistoryFilters): boolean {
  if (f.search.trim()) {
    const q = f.search.trim().toLowerCase()
    const hay = `${row.note ?? ''} ${row.categoryName}`.toLowerCase()
    if (!hay.includes(q)) return false
  }
  if (f.categoryId && row.categoryId !== f.categoryId) return false
  if (f.memberId && row.paidBy !== f.memberId && !row.involved.includes(f.memberId)) return false
  if (f.status === 'outstanding' && !row.unpaid) return false
  if (f.status === 'settled' && row.unpaid) return false
  if (f.from && row.date < f.from) return false
  if (f.to && row.date > f.to) return false
  if (f.minCents != null && row.totalCents < f.minCents) return false
  if (f.maxCents != null && row.totalCents > f.maxCents) return false
  return true
}

/** Filter then sort a history list. Pure. */
export function filterAndSort(rows: HistoryRow[], filters: HistoryFilters, sort: HistorySort): HistoryRow[] {
  const filtered = rows.filter((r) => matches(r, filters))
  const sign = sort.dir === 'asc' ? 1 : -1
  return filtered.sort((a, b) => {
    if (sort.by === 'amount') {
      if (a.totalCents !== b.totalCents) return (a.totalCents - b.totalCents) * sign
      return (a.date < b.date ? -1 : a.date > b.date ? 1 : 0) * sign
    }
    // date
    if (a.date !== b.date) return (a.date < b.date ? -1 : 1) * sign
    return (a.totalCents - b.totalCents) * sign
  })
}

/** Whether any filter is active (for showing a "clear" affordance). */
export function hasActiveFilters(f: HistoryFilters): boolean {
  return (
    f.search.trim() !== '' ||
    f.categoryId !== null ||
    f.memberId !== null ||
    f.status !== 'all' ||
    f.from !== null ||
    f.to !== null ||
    f.minCents !== null ||
    f.maxCents !== null
  )
}
