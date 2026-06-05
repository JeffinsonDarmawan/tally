import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { toCents } from '@/lib/balance-engine'
import { buildExpense, type ExpenseDraft } from './build'

const RUNS = { numRuns: 400 }
const POOL = ['a', 'b', 'c', 'd', 'e'] as const
const genInvolved = fc.uniqueArray(fc.constantFrom(...POOL), { minLength: 1, maxLength: 5 })
const genCents = fc.integer({ min: 1, max: 10_000_00 })
const genW5 = fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 5, maxLength: 5 })

function draft(over: Partial<ExpenseDraft>): ExpenseDraft {
  return {
    date: '2026-06-01',
    categoryId: null,
    note: '',
    totalAmount: 0,
    splitMethod: 'equal',
    involved: [],
    payers: [],
    ...over,
  }
}

const sumCents = (xs: { amount: number }[]) => xs.reduce((s, x) => s + toCents(x.amount), 0)

describe('buildExpense — the two ledger invariants always hold for valid drafts', () => {
  it('equal split: Σ shares == Σ payers == total', () => {
    fc.assert(
      fc.property(genCents, genInvolved, fc.constantFrom(...POOL), (cents, involved, payer) => {
        const total = cents / 100
        const r = buildExpense(draft({ totalAmount: total, splitMethod: 'equal', involved, payers: [{ userId: payer, amount: total }] }))
        expect(r.ok).toBe(true)
        if (r.ok) {
          expect(sumCents(r.shares.map((s) => ({ amount: s.amount })))).toBe(cents)
          expect(r.payers.reduce((s, p) => s + toCents(p.amount_paid), 0)).toBe(cents)
          expect(r.shares.length).toBe(involved.length)
        }
      }),
      RUNS,
    )
  })

  it('weighted split: Σ shares == total', () => {
    fc.assert(
      fc.property(genCents, genInvolved, genW5, fc.constantFrom(...POOL), (cents, involved, w5, payer) => {
        const weights = Object.fromEntries(involved.map((u, i) => [u, w5[i]]))
        fc.pre(involved.reduce((s, u) => s + weights[u], 0) > 0)
        const total = cents / 100
        const r = buildExpense(draft({ totalAmount: total, splitMethod: 'shares', involved, weights, payers: [{ userId: payer, amount: total }] }))
        expect(r.ok).toBe(true)
        if (r.ok) expect(sumCents(r.shares.map((s) => ({ amount: s.amount })))).toBe(cents)
      }),
      RUNS,
    )
  })

  it('multiple payers that sum to the total are accepted; mismatched payers are rejected', () => {
    fc.assert(
      fc.property(genCents, fc.integer({ min: 0, max: 1 }), genInvolved, (cents, p1cents, involved) => {
        const a = Math.min(p1cents * cents, cents) // 0 or full — simplest valid two-payer split
        const b = cents - a
        const total = cents / 100
        const r = buildExpense(
          draft({
            totalAmount: total,
            splitMethod: 'equal',
            involved,
            payers: [
              { userId: 'a', amount: a / 100 },
              { userId: 'b', amount: b / 100 },
            ],
          }),
        )
        // a + b == cents, so payers reconcile and the build succeeds.
        expect(r.ok).toBe(true)
      }),
      RUNS,
    )
  })

  it('rejects payers that do not add up to the total', () => {
    fc.assert(
      fc.property(genCents, genInvolved, (cents, involved) => {
        const total = cents / 100
        const r = buildExpense(draft({ totalAmount: total, splitMethod: 'equal', involved, payers: [{ userId: 'a', amount: (cents + 100) / 100 }] }))
        expect(r.ok).toBe(false)
      }),
      RUNS,
    )
  })
})
