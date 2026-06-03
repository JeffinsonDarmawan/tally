import { describe, it, expect } from 'vitest'
import { settleDefault, reminderMessage } from './settle'

describe('settleDefault', () => {
  it('when I owe the friend, defaults to me paying them the outstanding', () => {
    expect(settleDefault(3334, 'me', 'emma')).toEqual({
      from: 'me',
      to: 'emma',
      amountCents: 3334,
      kind: 'you_pay',
    })
  })

  it('when the friend owes me, defaults to recording their repayment to me', () => {
    expect(settleDefault(-2000, 'me', 'leo')).toEqual({
      from: 'leo',
      to: 'me',
      amountCents: 2000,
      kind: 'they_pay',
    })
  })

  it('reports settled when the pair nets to zero', () => {
    expect(settleDefault(0, 'me', 'sam')).toEqual({
      from: 'me',
      to: 'sam',
      amountCents: 0,
      kind: 'settled',
    })
  })
})

describe('reminderMessage', () => {
  it('drafts a friendly nudge with name, amount and days', () => {
    const msg = reminderMessage({ name: 'Sam', amount: '$12.50', days: 9 })
    expect(msg).toContain('Sam')
    expect(msg).toContain('$12.50')
    expect(msg).toContain('9 days')
  })

  it('handles a single day and no day count gracefully', () => {
    expect(reminderMessage({ name: 'Sam', amount: '$5.00', days: 1 })).toContain('1 day')
    expect(reminderMessage({ name: 'Sam', amount: '$5.00', days: null })).toContain('Sam')
  })
})
