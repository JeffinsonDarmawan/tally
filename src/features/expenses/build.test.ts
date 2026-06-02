import { describe, it, expect } from 'vitest'
import { buildExpense } from './build'
import type { ExpenseDraft } from './build'

const base: ExpenseDraft = {
  date: '2026-06-01',
  categoryId: 'cat-1',
  note: '',
  totalAmount: 100,
  splitMethod: 'equal',
  involved: ['a', 'b', 'c'],
  payers: [{ userId: 'a', amount: 100 }],
  receiptUrl: null,
}

describe('buildExpense', () => {
  it('builds equal-split shares + a single payer (reconciles to total)', () => {
    const r = buildExpense(base)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.shares).toEqual([
      { user_id: 'a', amount: 33.34 },
      { user_id: 'b', amount: 33.33 },
      { user_id: 'c', amount: 33.33 },
    ])
    expect(r.payers).toEqual([{ user_id: 'a', amount_paid: 100 }])
    expect(r.expense.total_amount).toBe(100)
    expect(r.expense.split_method).toBe('equal')
  })

  it('supports multiple payers that sum to the total', () => {
    const r = buildExpense({
      ...base,
      payers: [
        { userId: 'a', amount: 90 },
        { userId: 'b', amount: 10 },
      ],
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.payers).toEqual([
      { user_id: 'a', amount_paid: 90 },
      { user_id: 'b', amount_paid: 10 },
    ])
  })

  it('rejects payers that do not sum to the total', () => {
    const r = buildExpense({ ...base, payers: [{ userId: 'a', amount: 90 }] })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.join(' ')).toMatch(/payer|paid|contribut/i)
  })

  it('rejects an empty involved list', () => {
    const r = buildExpense({ ...base, involved: [], payers: [{ userId: 'a', amount: 100 }] })
    expect(r.ok).toBe(false)
  })

  it('rejects percentages that do not total 100', () => {
    const r = buildExpense({
      ...base,
      splitMethod: 'percentage',
      percentages: { a: 50, b: 25, c: 20 },
    })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.join(' ')).toMatch(/100|percent/i)
  })

  it('accepts valid percentages and reconciles shares to the total', () => {
    const r = buildExpense({
      ...base,
      splitMethod: 'percentage',
      percentages: { a: 50, b: 25, c: 25 },
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.shares).toEqual([
      { user_id: 'a', amount: 50 },
      { user_id: 'b', amount: 25 },
      { user_id: 'c', amount: 25 },
    ])
  })

  it('rejects uneven amounts that do not reconcile to the total', () => {
    const r = buildExpense({
      ...base,
      splitMethod: 'uneven',
      uneven: { a: 50, b: 25, c: 20 },
    })
    expect(r.ok).toBe(false)
  })

  it('builds a by-item split with tax/tip and emits item rows', () => {
    const r = buildExpense({
      ...base,
      totalAmount: 46,
      splitMethod: 'by_item',
      involved: ['a', 'b'],
      payers: [{ userId: 'a', amount: 46 }],
      items: [
        { name: 'Pasta', amount: 30, sharers: ['a', 'b'] },
        { name: 'Wine', amount: 10, sharers: ['a'] },
      ],
      extraCharges: [
        { label: 'GST', amount: 4, mode: 'proportional' },
        { label: 'Tip', amount: 2, mode: 'equal' },
      ],
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.shares).toEqual([
      { user_id: 'a', amount: 28.5 },
      { user_id: 'b', amount: 17.5 },
    ])
    expect(r.items).toEqual([
      { name: 'Pasta', amount: 30, sharers: ['a', 'b'] },
      { name: 'Wine', amount: 10, sharers: ['a'] },
    ])
    expect(r.expense.extra_charges).toEqual([
      { label: 'GST', amount: 4, mode: 'proportional' },
      { label: 'Tip', amount: 2, mode: 'equal' },
    ])
  })
})
