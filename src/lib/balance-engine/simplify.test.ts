import { describe, it, expect } from 'vitest'
import { simplifyDebts, groupBalances } from './simplify'
import type { ExpenseSides } from './balances'

describe('simplifyDebts — minimal transfers (§6.6)', () => {
  it('handles a single debtor/creditor pair', () => {
    expect(simplifyDebts({ a: -3000, b: 3000 })).toEqual([{ from: 'a', to: 'b', amountCents: 3000 }])
  })

  it('collapses a transitive chain into one transfer (A→B→C becomes A→C)', () => {
    // A owes B 10, B owes C 10 ⇒ balances A:-10, B:0, C:+10 ⇒ a single A→C transfer.
    expect(simplifyDebts({ a: -1000, b: 0, c: 1000 })).toEqual([
      { from: 'a', to: 'c', amountCents: 1000 },
    ])
  })

  it('greedily matches the largest debtor with the largest creditor', () => {
    expect(simplifyDebts({ emma: 5667, leo: -2333, you: -3334 })).toEqual([
      { from: 'you', to: 'emma', amountCents: 3334 },
      { from: 'leo', to: 'emma', amountCents: 2333 },
    ])
  })

  it('breaks ties deterministically by id', () => {
    expect(simplifyDebts({ a: -500, b: -500, c: 1000 })).toEqual([
      { from: 'a', to: 'c', amountCents: 500 },
      { from: 'b', to: 'c', amountCents: 500 },
    ])
  })

  it('returns no transfers when everyone is settled', () => {
    expect(simplifyDebts({ a: 0, b: 0 })).toEqual([])
    expect(simplifyDebts({})).toEqual([])
  })

  it('never moves more in total than the sum of debts', () => {
    const transfers = simplifyDebts({ a: -700, b: -300, c: 1000 })
    const moved = transfers.reduce((s, t) => s + t.amountCents, 0)
    expect(moved).toBe(1000)
  })
})

describe('groupBalances', () => {
  it('computes each member net balance (positive = owed to them)', () => {
    const worked: ExpenseSides = {
      paid: { emma: 9000, leo: 1000, you: 0 },
      owed: { emma: 3333, leo: 3333, you: 3334 },
    }
    expect(groupBalances(['emma', 'leo', 'you'], [worked], [])).toEqual({
      emma: 5667,
      leo: -2333,
      you: -3334,
    })
  })
})
