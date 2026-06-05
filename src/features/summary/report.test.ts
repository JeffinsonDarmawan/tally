import { describe, it, expect } from 'vitest'
import { summarizeReport, periodBounds, type Period } from './report'
import type { EnrichedExpense } from '@/features/dashboard'

function exp(over: Partial<EnrichedExpense> & { id: string; date: string; totalCents: number }): EnrichedExpense {
  return {
    categoryId: null,
    paidBy: null,
    payerCount: 1,
    note: null,
    paid: {},
    owed: {},
    ...over,
  }
}

const E1 = exp({ id: 'e1', date: '2026-06-03', categoryId: 'food', totalCents: 4500, paid: { me: 4500 }, owed: { me: 2250, emma: 2250 } })
const E2 = exp({ id: 'e2', date: '2026-06-20', categoryId: 'rent', totalCents: 120000, paid: { emma: 120000 }, owed: { me: 40000, emma: 40000, leo: 40000 } })
const E3 = exp({ id: 'e3', date: '2026-05-15', categoryId: 'food', totalCents: 3000, paid: { me: 3000 }, owed: { me: 3000 } })

const JUNE: Period = { mode: 'month', year: 2026, month: 6 }

describe('periodBounds', () => {
  it('computes month and year windows', () => {
    expect(periodBounds(JUNE)).toEqual({ start: '2026-06-01', endExclusive: '2026-07-01' })
    expect(periodBounds({ mode: 'month', year: 2026, month: 12 })).toEqual({ start: '2026-12-01', endExclusive: '2027-01-01' })
    expect(periodBounds({ mode: 'year', year: 2026, month: 1 })).toEqual({ start: '2026-01-01', endExclusive: '2027-01-01' })
  })
})

describe('summarizeReport', () => {
  it('restricts to the period and totals spend + count + my net', () => {
    const r = summarizeReport([E1, E2, E3], 'me', JUNE)
    expect(r.totalCents).toBe(124500)
    expect(r.count).toBe(2) // E3 is May, excluded
    expect(r.myNetCents).toBe(2250 - 40000) // E1 +2250, E2 -40000
  })

  it('breaks down by category, descending with percentages', () => {
    const r = summarizeReport([E1, E2, E3], 'me', JUNE)
    expect(r.byCategory).toEqual([
      { categoryId: 'rent', cents: 120000, pct: 96.4 },
      { categoryId: 'food', cents: 4500, pct: 3.6 },
    ])
  })

  it('aggregates who paid', () => {
    const r = summarizeReport([E1, E2, E3], 'me', JUNE)
    expect(r.whoPaid).toEqual([
      { userId: 'emma', cents: 120000, pct: 96.4 },
      { userId: 'me', cents: 4500, pct: 3.6 },
    ])
  })

  it('builds a daily timeline for a month', () => {
    const r = summarizeReport([E1, E2, E3], 'me', JUNE)
    expect(r.timeline).toHaveLength(30)
    expect(r.timeline.find((b) => b.label === '3')?.cents).toBe(4500)
    expect(r.timeline.find((b) => b.label === '20')?.cents).toBe(120000)
  })

  it('builds a monthly timeline for a year', () => {
    const r = summarizeReport([E1, E2, E3], 'me', { mode: 'year', year: 2026, month: 1 })
    expect(r.timeline).toHaveLength(12)
    expect(r.timeline.find((b) => b.label === 'May')?.cents).toBe(3000)
    expect(r.timeline.find((b) => b.label === 'Jun')?.cents).toBe(124500)
  })

  it('lists the top expenses by amount', () => {
    const r = summarizeReport([E1, E2, E3], 'me', JUNE)
    expect(r.topExpenses.map((e) => e.id)).toEqual(['e2', 'e1'])
  })
})
