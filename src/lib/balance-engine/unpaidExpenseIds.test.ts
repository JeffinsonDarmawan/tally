import { describe, it, expect } from 'vitest'
import { unpaidExpenseIds } from './fifo'
import type { DatedExpense } from './fifo'

// Expense A: Emma paid $90, split 3 ways → you & leo each owe Emma $30.
const A: DatedExpense = {
  id: 'a',
  date: '2026-06-01',
  paid: { emma: 9000 },
  owed: { you: 3000, leo: 3000, emma: 3000 },
}
// Expense B: you paid $40, split with Emma → Emma owes you $20.
const B: DatedExpense = {
  id: 'b',
  date: '2026-06-05',
  paid: { you: 4000 },
  owed: { you: 2000, emma: 2000 },
}

describe('unpaidExpenseIds', () => {
  it('flags expenses with a remaining unpaid edge involving me', () => {
    const ids = unpaidExpenseIds('you', [A], [])
    expect([...ids]).toEqual(['a'])
  })

  it('drops to empty once the debt is settled', () => {
    const ids = unpaidExpenseIds('you', [A], [{ from: 'you', to: 'emma', amountCents: 3000 }])
    expect(ids.size).toBe(0)
  })

  it('nets reverse debts so an offset expense is not counted', () => {
    // You owe Emma 3000 (A) but Emma owes you 2000 (B) → net you owe 1000; A stays partly unpaid.
    const ids = unpaidExpenseIds('you', [A, B], [])
    expect([...ids].sort()).toEqual(['a'])
  })

  it('returns nothing when everyone is square', () => {
    const square: DatedExpense = {
      id: 'c',
      date: '2026-06-02',
      paid: { you: 5000, emma: 5000 },
      owed: { you: 5000, emma: 5000 },
    }
    expect(unpaidExpenseIds('you', [square], []).size).toBe(0)
  })
})
