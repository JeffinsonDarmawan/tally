import { describe, it, expect } from 'vitest'
import { summarizeDashboard, type EnrichedExpense } from './summarize'

// The brief §6.1 worked example as one June expense.
const EXPENSE: EnrichedExpense = {
  id: 'e1',
  date: '2026-06-10',
  categoryId: 'cat',
  paidBy: 'emma',
  payerCount: 3,
  note: null,
  totalCents: 10000,
  paid: { emma: 9000, leo: 1000, you: 0 },
  owed: { emma: 3333, leo: 3333, you: 3334 },
}

const input = {
  expenses: [EXPENSE],
  settlements: [],
  me: 'you',
  memberIds: ['emma', 'leo', 'you'],
  today: '2026-06-15',
  monthStart: '2026-06-01',
  monthEndExclusive: '2026-07-01',
}

describe('summarizeDashboard', () => {
  it('computes hero totals from my perspective', () => {
    const s = summarizeDashboard(input)
    expect(s.overallNetCents).toBe(-3334) // you owe overall
    expect(s.totalOweCents).toBe(3334)
    expect(s.totalOwedCents).toBe(0)
  })

  it('gives per-friend net, direction, days-unpaid and unpaid count', () => {
    const s = summarizeDashboard(input)
    const emma = s.perFriend.find((f) => f.friendId === 'emma')!
    const leo = s.perFriend.find((f) => f.friendId === 'leo')!
    expect(emma).toMatchObject({ netCents: 3334, direction: 'you_owe', daysUnpaid: 5, unpaidCount: 1 })
    expect(leo).toMatchObject({ netCents: 0, direction: 'settled', daysUnpaid: null, unpaidCount: 0 })
  })

  it('totals the unpaid count and oldest days across friends', () => {
    const s = summarizeDashboard(input)
    expect(s.unpaidCount).toBe(1)
    expect(s.oldestDaysUnpaid).toBe(5)
  })

  it('produces the minimal simplified transfers for the whole group', () => {
    const s = summarizeDashboard(input)
    expect(s.simplified).toEqual([
      { from: 'you', to: 'emma', amountCents: 3334 },
      { from: 'leo', to: 'emma', amountCents: 2333 },
    ])
  })

  it('lists this-month activity involving me, with my share', () => {
    const s = summarizeDashboard(input)
    expect(s.monthActivity).toEqual([
      {
        expenseId: 'e1',
        date: '2026-06-10',
        categoryId: 'cat',
        paidBy: 'emma',
        payerCount: 3,
        totalCents: 10000,
        myShareCents: 3334,
        myPaidCents: 0,
      },
    ])
  })

  it('excludes expenses outside the current month', () => {
    const may: EnrichedExpense = { ...EXPENSE, id: 'e0', date: '2026-05-30' }
    const s = summarizeDashboard({ ...input, expenses: [EXPENSE, may] })
    expect(s.monthActivity.map((a) => a.expenseId)).toEqual(['e1'])
  })

  it('applies a settlement so a paid-off friend nets to zero', () => {
    const s = summarizeDashboard({
      ...input,
      settlements: [{ from: 'you', to: 'emma', amountCents: 3334 }],
    })
    const emma = s.perFriend.find((f) => f.friendId === 'emma')!
    expect(emma.direction).toBe('settled')
    expect(s.overallNetCents).toBe(0)
  })
})
