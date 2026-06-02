import { describe, it, expect } from 'vitest'
import {
  equalShares,
  unevenShares,
  weightedShares,
  percentageShares,
  byItemShares,
  computeShares,
  sumCents,
} from './splits'

describe('equalShares', () => {
  it('splits a total equally among involved users (deterministic leftover)', () => {
    expect(equalShares(10000, ['a', 'b', 'c'])).toEqual({ a: 3334, b: 3333, c: 3333 })
  })
  it('always sums to the total', () => {
    expect(sumCents(equalShares(10001, ['a', 'b', 'c']))).toBe(10001)
  })
})

describe('unevenShares', () => {
  it('returns the exact per-person amounts as given', () => {
    expect(unevenShares({ a: 3000, b: 7000 })).toEqual({ a: 3000, b: 7000 })
  })
})

describe('weightedShares', () => {
  it('splits in proportion to integer weights (a couple = 2, singles = 1)', () => {
    expect(weightedShares(10000, { a: 2, b: 1, c: 1 })).toEqual({ a: 5000, b: 2500, c: 2500 })
  })
  it('distributes leftover cents deterministically and sums to total', () => {
    const shares = weightedShares(10000, { a: 1, b: 1, c: 1 })
    expect(sumCents(shares)).toBe(10000)
    expect(shares).toEqual({ a: 3334, b: 3333, c: 3333 })
  })
})

describe('percentageShares', () => {
  it('splits by percentage', () => {
    expect(percentageShares(10000, { a: 50, b: 25, c: 25 })).toEqual({ a: 5000, b: 2500, c: 2500 })
  })
  it('handles fractional percentages and still sums to total', () => {
    const shares = percentageShares(10000, { a: 33.33, b: 33.33, c: 33.34 })
    expect(sumCents(shares)).toBe(10000)
  })
})

describe('byItemShares (with tax / tip / service allocation)', () => {
  it('sums per-item shares and auto-allocates extra charges', () => {
    // Item1 $30 shared by a,b ; Item2 $10 by a → subtotals a=2500, b=1500 (Σ items = 4000)
    // GST $4 proportional → a:250, b:150 ; Tip $2 equal → 100 each. Total = 4600.
    const shares = byItemShares(
      ['a', 'b'],
      [
        { amount: 3000, sharers: ['a', 'b'] },
        { amount: 1000, sharers: ['a'] },
      ],
      [
        { amount: 400, mode: 'proportional' },
        { amount: 200, mode: 'equal' },
      ],
    )
    expect(shares).toEqual({ a: 2850, b: 1750 })
    expect(sumCents(shares)).toBe(4600)
  })

  it('works with no extra charges', () => {
    const shares = byItemShares(
      ['a', 'b'],
      [
        { amount: 3000, sharers: ['a', 'b'] },
        { amount: 1000, sharers: ['a'] },
      ],
      [],
    )
    expect(shares).toEqual({ a: 2500, b: 1500 })
  })
})

describe('computeShares (dispatcher)', () => {
  it('routes to the right method and always reconciles to the total', () => {
    expect(computeShares({ method: 'equal', totalCents: 9999, involved: ['a', 'b', 'c'] })).toEqual({
      a: 3333,
      b: 3333,
      c: 3333,
    })
    expect(
      computeShares({ method: 'percentage', totalCents: 10000, percentages: { a: 50, b: 50 } }),
    ).toEqual({ a: 5000, b: 5000 })
  })
})
