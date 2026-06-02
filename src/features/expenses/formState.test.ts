import { describe, it, expect } from 'vitest'
import { emptyForm, formToDraft } from './formState'

const MEMBERS = ['me', 'emma', 'leo']

describe('emptyForm', () => {
  it('defaults to all members involved, equal split, me as sole payer', () => {
    const f = emptyForm(MEMBERS, 'me', '2026-06-01')
    expect(f.involved).toEqual(['me', 'emma', 'leo'])
    expect(f.method).toBe('equal')
    expect(f.singlePayerId).toBe('me')
    expect(f.multiPayer).toBe(false)
  })
})

describe('formToDraft', () => {
  it('single payer pays the full total', () => {
    const f = { ...emptyForm(MEMBERS, 'me', '2026-06-01'), total: '90' }
    const d = formToDraft(f)
    expect(d.totalAmount).toBe(90)
    expect(d.payers).toEqual([{ userId: 'me', amount: 90 }])
    expect(d.splitMethod).toBe('equal')
    expect(d.involved).toEqual(['me', 'emma', 'leo'])
  })

  it('multiple payers keeps only positive contributions', () => {
    const f = {
      ...emptyForm(MEMBERS, 'me', '2026-06-01'),
      total: '100',
      multiPayer: true,
      payerAmounts: { emma: '90', leo: '10', me: '0' },
    }
    const d = formToDraft(f)
    expect(d.payers).toEqual([
      { userId: 'emma', amount: 90 },
      { userId: 'leo', amount: 10 },
    ])
  })

  it('by-item derives the total from items + charges', () => {
    const f = {
      ...emptyForm(['a', 'b'], 'a', '2026-06-01'),
      method: 'by_item' as const,
      total: '999', // ignored for by-item
      items: [
        { id: '1', name: 'Pasta', amount: '30', sharers: ['a', 'b'] },
        { id: '2', name: 'Wine', amount: '10', sharers: ['a'] },
      ],
      charges: [{ id: 'c1', label: 'GST', amount: '4', mode: 'proportional' as const }],
    }
    const d = formToDraft(f)
    expect(d.totalAmount).toBe(44)
    expect(d.payers).toEqual([{ userId: 'a', amount: 44 }])
    expect(d.items).toEqual([
      { name: 'Pasta', amount: 30, sharers: ['a', 'b'] },
      { name: 'Wine', amount: 10, sharers: ['a'] },
    ])
    expect(d.extraCharges).toEqual([{ label: 'GST', amount: 4, mode: 'proportional' }])
  })

  it('only includes involved members for weighted/percentage maps', () => {
    const f = {
      ...emptyForm(MEMBERS, 'me', '2026-06-01'),
      involved: ['me', 'emma'],
      method: 'percentage' as const,
      total: '100',
      percentages: { me: '60', emma: '40', leo: '0' },
    }
    const d = formToDraft(f)
    expect(d.percentages).toEqual({ me: 60, emma: 40 })
  })
})
