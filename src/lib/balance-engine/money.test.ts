import { describe, it, expect } from 'vitest'
import { toCents, fromCents, distribute, splitEqual } from './money'

describe('toCents / fromCents', () => {
  it('converts dollars to integer cents without float drift', () => {
    expect(toCents(33.34)).toBe(3334)
    expect(toCents(0.1 + 0.2)).toBe(30) // 0.30000000000000004 → 30
    expect(toCents(100)).toBe(10000)
    expect(toCents(0)).toBe(0)
  })

  it('round-trips cents back to dollars', () => {
    expect(fromCents(3334)).toBe(33.34)
    expect(fromCents(10000)).toBe(100)
    expect(fromCents(5)).toBe(0.05)
  })
})

describe('distribute', () => {
  it('sums exactly to the total', () => {
    const parts = distribute(10000, [1, 1, 1])
    expect(parts.reduce((a, b) => a + b, 0)).toBe(10000)
  })

  it('gives leftover cents to the earliest buckets on ties (deterministic)', () => {
    // $100 split equally 3 ways → 3333.33 each; 1 leftover cent to index 0.
    expect(distribute(10000, [1, 1, 1])).toEqual([3334, 3333, 3333])
  })

  it('distributes proportionally to integer weights (weighted shares)', () => {
    expect(distribute(10000, [2, 1, 1])).toEqual([5000, 2500, 2500])
  })

  it('distributes leftover by largest fractional remainder first', () => {
    // 1000 cents over weights [1,1,1] → 333.33 each, 1 leftover → index 0.
    expect(distribute(1000, [1, 1, 1])).toEqual([334, 333, 333])
    // 100 cents, weights [1,1,1] → 33.33 each, 1 leftover → index 0.
    expect(distribute(100, [1, 1, 1])).toEqual([34, 33, 33])
  })

  it('handles percentage-style weights summing to 100', () => {
    // 999 cents, 33.33% / 33.33% / 33.34% → 333 / 333 / 333 = 999, remainder 0
    expect(distribute(999, [33.33, 33.33, 33.34])).toEqual([333, 333, 333])
  })

  it('falls back to an equal split when all weights are zero', () => {
    expect(distribute(1000, [0, 0, 0])).toEqual([334, 333, 333])
  })

  it('returns an empty array for no buckets', () => {
    expect(distribute(0, [])).toEqual([])
  })
})

describe('splitEqual', () => {
  it('splits a total equally with deterministic leftover', () => {
    expect(splitEqual(10000, 3)).toEqual([3334, 3333, 3333])
    expect(splitEqual(1000, 4)).toEqual([250, 250, 250, 250])
  })
})
