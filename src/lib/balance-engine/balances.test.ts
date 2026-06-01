import { describe, it, expect } from 'vitest'
import { aggregateOwe, computeBalances, dashboardTotals } from './balances'
import type { ExpenseSides, SettlementInput } from './balances'

// The brief's worked example as a single expense.
const WORKED: ExpenseSides = {
  paid: { emma: 9000, leo: 1000, you: 0 },
  owed: { emma: 3333, leo: 3333, you: 3334 },
}

describe('aggregateOwe', () => {
  it('sums per-expense edges into an owe[debtor][creditor] map', () => {
    expect(aggregateOwe([WORKED])).toEqual({
      leo: { emma: 2333 },
      you: { emma: 3334 },
    })
  })
})

describe('computeBalances — net(a,b) (§6.2)', () => {
  it('net(a,b) > 0 means a owes b; symmetric and signed', () => {
    const { net } = computeBalances([WORKED], [])
    expect(net('you', 'emma')).toBe(3334) // you owe emma
    expect(net('emma', 'you')).toBe(-3334) // mirror
    expect(net('you', 'leo')).toBe(0)
  })

  it('applies settlements (a paying b reduces what a owes b)', () => {
    const settlements: SettlementInput[] = [{ from: 'you', to: 'emma', amountCents: 2000 }]
    const { net } = computeBalances([WORKED], settlements)
    expect(net('you', 'emma')).toBe(1334)
  })

  it('overpayment flips the balance into a credit', () => {
    const settlements: SettlementInput[] = [{ from: 'you', to: 'emma', amountCents: 4000 }]
    const { net } = computeBalances([WORKED], settlements)
    expect(net('you', 'emma')).toBe(-666) // emma now owes you $6.66
  })
})

describe('dashboardTotals (§6.3)', () => {
  it('computes per-friend net + totals from my perspective (debtor side)', () => {
    const t = dashboardTotals('you', ['emma', 'leo'], [WORKED], [])
    expect(t.perFriend).toEqual([
      { friend: 'emma', netCents: 3334 },
      { friend: 'leo', netCents: 0 },
    ])
    expect(t.totalIOweCents).toBe(3334)
    expect(t.totalImOwedCents).toBe(0)
    expect(t.overallNetCents).toBe(-3334) // negative ⇒ you owe overall
  })

  it('is symmetric from the creditor perspective', () => {
    const t = dashboardTotals('emma', ['leo', 'you'], [WORKED], [])
    expect(t.totalImOwedCents).toBe(5667)
    expect(t.totalIOweCents).toBe(0)
    expect(t.overallNetCents).toBe(5667) // positive ⇒ you're owed overall
  })
})
