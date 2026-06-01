import { describe, it, expect } from 'vitest'
import { expenseEdges } from './netting'

describe('expenseEdges — per-expense pairwise debt (§6.1)', () => {
  it('matches the brief worked example (single creditor, two debtors)', () => {
    // $100 split equally 3 ways ($33.33 / $33.33 / $33.34). Emma paid $90, Leo $10, you $0.
    const edges = expenseEdges(
      { emma: 9000, leo: 1000, you: 0 }, // paid
      { emma: 3333, leo: 3333, you: 3334 }, // owed
    )
    expect(edges).toEqual([
      { from: 'leo', to: 'emma', amountCents: 2333 },
      { from: 'you', to: 'emma', amountCents: 3334 },
    ])
  })

  it('reduces to the simple single-payer case (each owes their share to the payer)', () => {
    const edges = expenseEdges({ a: 9000 }, { a: 3000, b: 3000, c: 3000 })
    expect(edges).toEqual([
      { from: 'b', to: 'a', amountCents: 3000 },
      { from: 'c', to: 'a', amountCents: 3000 },
    ])
  })

  it('distributes each debtor deficit across multiple creditors in proportion to surplus', () => {
    // paid a:60 b:40 ; owed 25 each (a,b,c,d). nets a:+35 b:+15 c:-25 d:-25.
    const edges = expenseEdges(
      { a: 6000, b: 4000 },
      { a: 2500, b: 2500, c: 2500, d: 2500 },
    )
    expect(edges).toEqual([
      { from: 'c', to: 'a', amountCents: 1750 },
      { from: 'c', to: 'b', amountCents: 750 },
      { from: 'd', to: 'a', amountCents: 1750 },
      { from: 'd', to: 'b', amountCents: 750 },
    ])
  })

  it('splits one debtor across two partial-payer creditors (3-person multi-payer)', () => {
    // alice paid 60, bob paid 40, charlie 0 ; all owe ~33.33. charlie's deficit splits by surplus.
    const edges = expenseEdges(
      { alice: 6000, bob: 4000 },
      { alice: 3333, bob: 3333, charlie: 3334 },
    )
    expect(edges).toEqual([
      { from: 'charlie', to: 'alice', amountCents: 2667 },
      { from: 'charlie', to: 'bob', amountCents: 667 },
    ])
  })

  it('produces no edges when everyone paid exactly their share', () => {
    expect(expenseEdges({ a: 5000, b: 5000 }, { a: 5000, b: 5000 })).toEqual([])
  })

  it('is deterministic regardless of key insertion order', () => {
    const edges1 = expenseEdges({ emma: 9000, leo: 1000 }, { emma: 3333, leo: 3333, you: 3334 })
    const edges2 = expenseEdges({ leo: 1000, emma: 9000 }, { you: 3334, leo: 3333, emma: 3333 })
    expect(edges1).toEqual(edges2)
    expect(edges1).toEqual([
      { from: 'leo', to: 'emma', amountCents: 2333 },
      { from: 'you', to: 'emma', amountCents: 3334 },
    ])
  })
})
