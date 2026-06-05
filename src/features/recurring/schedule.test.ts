import { describe, it, expect } from 'vitest'
import { nextOccurrence, nextDuePeriod, type ScheduleTemplate } from './schedule'

function tpl(over: Partial<ScheduleTemplate>): ScheduleTemplate {
  return {
    frequency: 'monthly',
    anchorDay: null,
    startDate: '2026-01-15',
    endDate: null,
    lastPostedPeriod: null,
    active: true,
    ...over,
  }
}

describe('nextOccurrence (the next unposted period, due or not)', () => {
  it('is the first period when nothing has posted yet', () => {
    expect(nextOccurrence(tpl({}))).toBe('2026-01-15')
  })

  it('advances past the last posted period', () => {
    expect(nextOccurrence(tpl({ lastPostedPeriod: '2026-01-15' }))).toBe('2026-02-15')
  })

  it('clamps the anchor day to short months (31st → 28th in Feb)', () => {
    expect(
      nextOccurrence(tpl({ anchorDay: 31, startDate: '2026-01-31', lastPostedPeriod: '2026-01-31' })),
    ).toBe('2026-02-28')
    // and the month after returns to the 31st
    expect(
      nextOccurrence(tpl({ anchorDay: 31, startDate: '2026-01-31', lastPostedPeriod: '2026-02-28' })),
    ).toBe('2026-03-31')
  })

  it('steps weekly and biweekly from the start date', () => {
    expect(nextOccurrence(tpl({ frequency: 'weekly', startDate: '2026-06-01', lastPostedPeriod: '2026-06-01' }))).toBe('2026-06-08')
    expect(nextOccurrence(tpl({ frequency: 'biweekly', startDate: '2026-06-01', lastPostedPeriod: '2026-06-01' }))).toBe('2026-06-15')
  })

  it('clamps a Feb-29 yearly anchor in non-leap years', () => {
    expect(nextOccurrence(tpl({ frequency: 'yearly', startDate: '2024-02-29', lastPostedPeriod: '2024-02-29' }))).toBe('2025-02-28')
  })

  it('returns null once past the end date', () => {
    expect(
      nextOccurrence(tpl({ startDate: '2026-01-15', endDate: '2026-02-28', lastPostedPeriod: '2026-02-15' })),
    ).toBe(null)
  })
})

describe('nextDuePeriod (only when it has actually come due — never posts the future)', () => {
  it('returns the period when it is on or before today', () => {
    expect(nextDuePeriod(tpl({ startDate: '2026-01-15' }), '2026-03-20')).toBe('2026-01-15')
  })

  it('returns null when the next period is still in the future', () => {
    expect(nextDuePeriod(tpl({ startDate: '2026-06-15' }), '2026-06-01')).toBe(null)
  })

  it('catches up one period at a time as each comes due', () => {
    const t = tpl({ frequency: 'weekly', startDate: '2026-06-01', lastPostedPeriod: '2026-06-01' })
    expect(nextDuePeriod(t, '2026-06-10')).toBe('2026-06-08')
    expect(nextDuePeriod({ ...t, lastPostedPeriod: '2026-06-08' }, '2026-06-10')).toBe(null) // 06-15 not due yet
  })

  it('is null for an inactive template', () => {
    expect(nextDuePeriod(tpl({ active: false }), '2026-12-31')).toBe(null)
  })
})
