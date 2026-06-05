import { describe, it, expect } from 'vitest'
import { filterAndSort, type HistoryRow, type HistoryFilters, type HistorySort } from './filter'

const rows: HistoryRow[] = [
  { id: '1', date: '2026-06-01', categoryId: 'food', categoryName: 'Food & drink', paidBy: 'me', payerCount: 1, note: 'Dinner', totalCents: 4500, involved: ['me', 'emma'], myShareCents: 2250, unpaid: true },
  { id: '2', date: '2026-06-10', categoryId: 'rent', categoryName: 'Rent', paidBy: 'emma', payerCount: 1, note: null, totalCents: 120000, involved: ['me', 'emma', 'leo'], myShareCents: 40000, unpaid: false },
  { id: '3', date: '2026-05-20', categoryId: 'food', categoryName: 'Food & drink', paidBy: 'leo', payerCount: 2, note: 'Lunch', totalCents: 3000, involved: ['leo'], myShareCents: 0, unpaid: true },
]

const NO_FILTERS: HistoryFilters = {
  search: '',
  categoryId: null,
  memberId: null,
  status: 'all',
  from: null,
  to: null,
  minCents: null,
  maxCents: null,
}
const DATE_DESC: HistorySort = { by: 'date', dir: 'desc' }

const ids = (rs: HistoryRow[]) => rs.map((r) => r.id)

describe('filterAndSort', () => {
  it('sorts by date descending by default', () => {
    expect(ids(filterAndSort(rows, NO_FILTERS, DATE_DESC))).toEqual(['2', '1', '3'])
  })

  it('sorts by amount ascending', () => {
    expect(ids(filterAndSort(rows, NO_FILTERS, { by: 'amount', dir: 'asc' }))).toEqual(['3', '1', '2'])
  })

  it('searches note and category name (case-insensitive)', () => {
    expect(ids(filterAndSort(rows, { ...NO_FILTERS, search: 'lunch' }, DATE_DESC))).toEqual(['3'])
    expect(ids(filterAndSort(rows, { ...NO_FILTERS, search: 'rent' }, DATE_DESC))).toEqual(['2'])
  })

  it('filters by category', () => {
    expect(ids(filterAndSort(rows, { ...NO_FILTERS, categoryId: 'food' }, DATE_DESC))).toEqual(['1', '3'])
  })

  it('filters by member (involved or payer)', () => {
    // leo paid #3 and is involved in #2 and #3
    expect(ids(filterAndSort(rows, { ...NO_FILTERS, memberId: 'leo' }, DATE_DESC))).toEqual(['2', '3'])
  })

  it('filters by paid/unpaid status', () => {
    expect(ids(filterAndSort(rows, { ...NO_FILTERS, status: 'outstanding' }, DATE_DESC))).toEqual(['1', '3'])
    expect(ids(filterAndSort(rows, { ...NO_FILTERS, status: 'settled' }, DATE_DESC))).toEqual(['2'])
  })

  it('filters by date range', () => {
    expect(ids(filterAndSort(rows, { ...NO_FILTERS, from: '2026-06-01', to: '2026-06-30' }, DATE_DESC))).toEqual(['2', '1'])
  })

  it('filters by amount range (cents)', () => {
    expect(ids(filterAndSort(rows, { ...NO_FILTERS, minCents: 4000, maxCents: 50000 }, DATE_DESC))).toEqual(['1'])
  })
})
