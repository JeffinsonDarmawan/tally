import { describe, it, expect } from 'vitest'
import { fifoUnpaid, pairUnpaid, daysUnpaid } from './fifo'
import type { DatedExpense } from './fifo'
import type { SettlementInput } from './balances'

describe('fifoUnpaid — apply repayments oldest-first (§6.4)', () => {
  const items = [
    { date: '2026-01-01', amountCents: 1000 },
    { date: '2026-02-01', amountCents: 2000 },
    { date: '2026-03-01', amountCents: 500 },
  ]

  it('leaves all items unpaid when nothing is repaid', () => {
    expect(fifoUnpaid(items, 0)).toEqual(items)
  })

  it('fully covers the oldest item first', () => {
    expect(fifoUnpaid(items, 1000)).toEqual([
      { date: '2026-02-01', amountCents: 2000 },
      { date: '2026-03-01', amountCents: 500 },
    ])
  })

  it('partially covers an item, leaving the remainder unpaid', () => {
    expect(fifoUnpaid(items, 1500)).toEqual([
      { date: '2026-02-01', amountCents: 1500 },
      { date: '2026-03-01', amountCents: 500 },
    ])
  })

  it('returns nothing when the full total is covered', () => {
    expect(fifoUnpaid(items, 3500)).toEqual([])
    expect(fifoUnpaid(items, 99999)).toEqual([])
  })

  it('sorts oldest-first before applying, regardless of input order', () => {
    const shuffled = [items[2], items[0], items[1]]
    expect(fifoUnpaid(shuffled, 1000)).toEqual([
      { date: '2026-02-01', amountCents: 2000 },
      { date: '2026-03-01', amountCents: 500 },
    ])
  })
})

describe('pairUnpaid — directed unpaid items between two people', () => {
  const expenses: DatedExpense[] = [
    { date: '2026-01-01', paid: { emma: 6000 }, owed: { emma: 3000, you: 3000 } }, // you→emma 3000
    { date: '2026-02-01', paid: { emma: 4000 }, owed: { emma: 2000, you: 2000 } }, // you→emma 2000
  ]

  it('returns all directed edges as unpaid when nothing is settled', () => {
    const res = pairUnpaid('you', 'emma', expenses, [])
    expect(res.direction).toBe('you_owe')
    expect(res.totalCents).toBe(5000)
    expect(res.items).toEqual([
      { date: '2026-01-01', amountCents: 3000 },
      { date: '2026-02-01', amountCents: 2000 },
    ])
  })

  it('applies a settlement oldest-first and stays consistent with net()', () => {
    const settlements: SettlementInput[] = [{ from: 'you', to: 'emma', amountCents: 3500 }]
    const res = pairUnpaid('you', 'emma', expenses, settlements)
    expect(res.direction).toBe('you_owe')
    expect(res.totalCents).toBe(1500) // 5000 − 3500
    expect(res.items).toEqual([{ date: '2026-02-01', amountCents: 1500 }])
  })

  it('reports the other direction symmetrically', () => {
    const res = pairUnpaid('emma', 'you', expenses, [])
    expect(res.direction).toBe('they_owe')
    expect(res.totalCents).toBe(5000)
    expect(res.items).toEqual([
      { date: '2026-01-01', amountCents: 3000 },
      { date: '2026-02-01', amountCents: 2000 },
    ])
  })

  it('reports settled when the pair nets to zero', () => {
    const settlements: SettlementInput[] = [{ from: 'you', to: 'emma', amountCents: 5000 }]
    const res = pairUnpaid('you', 'emma', expenses, settlements)
    expect(res.direction).toBe('settled')
    expect(res.totalCents).toBe(0)
    expect(res.items).toEqual([])
  })
})

describe('daysUnpaid', () => {
  it('measures days from the oldest unpaid item to today', () => {
    const items = [
      { date: '2026-02-01', amountCents: 1500 },
      { date: '2026-03-01', amountCents: 500 },
    ]
    expect(daysUnpaid(items, '2026-02-10')).toBe(9)
  })

  it('returns null when there is nothing unpaid', () => {
    expect(daysUnpaid([], '2026-02-10')).toBeNull()
  })
})
