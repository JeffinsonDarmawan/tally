import { describe, it, expect } from 'vitest'
import { distribute } from './money'
import { equalShares, computeShares } from './splits'
import { expenseEdges } from './netting'
import { dashboardTotals } from './balances'
import { simplifyDebts, groupBalances } from './simplify'

/** Boundary cases that can occur with a real 5-person group. */
describe('engine edge cases', () => {
  it('distributes around a zero weight without giving that person a share', () => {
    expect(distribute(10000, [1, 0, 1])).toEqual([5000, 0, 5000])
  })

  it('stays exact for very large totals', () => {
    const parts = distribute(100_000_000, [1, 1, 1]) // $1,000,000 split three ways
    expect(parts.reduce((a, b) => a + b, 0)).toBe(100_000_000)
    expect(parts).toEqual([33_333_334, 33_333_333, 33_333_333])
  })

  it('gives the whole total to a single involved person', () => {
    expect(equalShares(9999, ['a'])).toEqual({ a: 9999 })
    expect(computeShares({ method: 'percentage', totalCents: 5000, percentages: { a: 100 } })).toEqual({ a: 5000 })
  })

  it('creates no debt when one person both paid and owed everything', () => {
    expect(expenseEdges({ me: 5000 }, { me: 5000 })).toEqual([])
  })

  it('handles a group of one (no friends) with all-zero totals', () => {
    const totals = dashboardTotals('me', [], [{ paid: { me: 1000 }, owed: { me: 1000 } }], [])
    expect(totals.overallNetCents).toBe(0)
    expect(totals.totalIOweCents).toBe(0)
    expect(totals.totalImOwedCents).toBe(0)
    expect(totals.perFriend).toEqual([])
  })

  it('simplifies a balanced group to no transfers', () => {
    expect(simplifyDebts({ a: 0, b: 0, c: 0 })).toEqual([])
  })

  it('resolves a 3-person debt cycle to nothing owed', () => {
    // A owes B 10, B owes C 10, C owes A 10 → everyone nets to zero.
    const expenses: { paid: Record<string, number>; owed: Record<string, number> }[] = [
      { paid: { b: 1000 }, owed: { a: 1000 } },
      { paid: { c: 1000 }, owed: { b: 1000 } },
      { paid: { a: 1000 }, owed: { c: 1000 } },
    ]
    const balances = groupBalances(['a', 'b', 'c'], expenses, [])
    expect(Object.values(balances).every((v) => v === 0)).toBe(true)
    expect(simplifyDebts(balances)).toEqual([])
  })
})
