import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { summarizeReport, periodBounds, type Period } from './report'
import type { EnrichedExpense } from '@/features/dashboard'

const RUNS = { numRuns: 400 }
const POOL = ['a', 'b', 'c', 'd', 'e'] as const

function iso(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const genEnriched: fc.Arbitrary<EnrichedExpense> = fc
  .record({
    id: fc.string({ minLength: 1, maxLength: 8 }),
    month: fc.integer({ min: 1, max: 12 }),
    day: fc.integer({ min: 1, max: 28 }),
    categoryId: fc.option(fc.constantFrom('food', 'rent', 'fun'), { nil: null }),
    totalCents: fc.integer({ min: 1, max: 1_000_00 }),
    payers: fc.uniqueArray(fc.constantFrom(...POOL), { minLength: 1, maxLength: 3 }),
    payCents: fc.array(fc.integer({ min: 1, max: 500_00 }), { minLength: 3, maxLength: 3 }),
  })
  .map(({ id, month, day, categoryId, totalCents, payers, payCents }) => ({
    id,
    date: iso(2026, month, day),
    categoryId,
    paidBy: payers[0],
    payerCount: payers.length,
    note: null,
    totalCents,
    paid: Object.fromEntries(payers.map((u, i) => [u, payCents[i]])),
    owed: {},
  }))

const genExpenses = fc.array(genEnriched, { maxLength: 12 })
const genPeriod: fc.Arbitrary<Period> = fc.record({
  mode: fc.constantFrom('month' as const, 'year' as const),
  year: fc.constant(2026),
  month: fc.integer({ min: 1, max: 12 }),
})

describe('summarizeReport invariants', () => {
  it('category, timeline, and who-paid totals all reconcile to the period', () => {
    fc.assert(
      fc.property(genExpenses, genPeriod, (expenses, period) => {
        const { start, endExclusive } = periodBounds(period)
        const inPeriod = expenses.filter((e) => e.date >= start && e.date < endExclusive)
        const r = summarizeReport(expenses, 'a', period)

        expect(r.count).toBe(inPeriod.length)
        const totalCents = inPeriod.reduce((s, e) => s + e.totalCents, 0)
        expect(r.totalCents).toBe(totalCents)
        expect(r.byCategory.reduce((s, c) => s + c.cents, 0)).toBe(totalCents)
        expect(r.timeline.reduce((s, b) => s + b.cents, 0)).toBe(totalCents)

        const paidTotal = inPeriod.reduce((s, e) => s + Object.values(e.paid).reduce((a, b) => a + b, 0), 0)
        expect(r.whoPaid.reduce((s, p) => s + p.cents, 0)).toBe(paidTotal)
      }),
      RUNS,
    )
  })

  it('breakdowns are sorted descending with sane percentages', () => {
    fc.assert(
      fc.property(genExpenses, genPeriod, (expenses, period) => {
        const r = summarizeReport(expenses, 'a', period)
        for (let i = 1; i < r.byCategory.length; i++) expect(r.byCategory[i - 1].cents >= r.byCategory[i].cents).toBe(true)
        for (let i = 1; i < r.whoPaid.length; i++) expect(r.whoPaid[i - 1].cents >= r.whoPaid[i].cents).toBe(true)
        for (const c of r.byCategory) expect(c.pct >= 0 && c.pct <= 100).toBe(true)
        expect(r.topExpenses.length).toBeLessThanOrEqual(5)
        expect(r.timeline.length).toBe(period.mode === 'year' ? 12 : new Date(Date.UTC(2026, period.month, 0)).getUTCDate())
      }),
      RUNS,
    )
  })
})
