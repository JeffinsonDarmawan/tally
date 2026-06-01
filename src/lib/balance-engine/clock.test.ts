import { describe, it, expect } from 'vitest'
import { dateInTimeZone, daysBetween, monthBounds, currentMonthBounds } from './clock'

describe('dateInTimeZone (§6.7)', () => {
  it('resolves an instant to the calendar date in the group time zone', () => {
    // 2026-05-31 20:00 UTC is already 2026-06-01 in Singapore (UTC+8).
    const instant = new Date('2026-05-31T20:00:00Z')
    expect(dateInTimeZone(instant, 'Asia/Singapore')).toBe('2026-06-01')
    expect(dateInTimeZone(instant, 'UTC')).toBe('2026-05-31')
    expect(dateInTimeZone(instant, 'America/New_York')).toBe('2026-05-31') // UTC-4 → 16:00
  })
})

describe('daysBetween', () => {
  it('counts whole calendar days between two dates', () => {
    expect(daysBetween('2026-02-01', '2026-02-10')).toBe(9)
    expect(daysBetween('2026-01-01', '2026-03-01')).toBe(59) // 2026 is not a leap year
    expect(daysBetween('2026-05-30', '2026-05-30')).toBe(0)
  })

  it('is unaffected by daylight-saving transitions (date-only math)', () => {
    // US DST begins 2026-03-08; a plain date diff must still be exactly 7.
    expect(daysBetween('2026-03-05', '2026-03-12')).toBe(7)
  })
})

describe('monthBounds', () => {
  it('returns [first-of-month, first-of-next-month)', () => {
    expect(monthBounds(2026, 2)).toEqual({ start: '2026-02-01', endExclusive: '2026-03-01' })
  })
  it('rolls over the year in December', () => {
    expect(monthBounds(2026, 12)).toEqual({ start: '2026-12-01', endExclusive: '2027-01-01' })
  })
})

describe('currentMonthBounds', () => {
  it('derives the month window from the instant in the group time zone', () => {
    const instant = new Date('2026-05-31T20:00:00Z') // → 2026-06-01 in SGT
    expect(currentMonthBounds(instant, 'Asia/Singapore')).toEqual({
      start: '2026-06-01',
      endExclusive: '2026-07-01',
    })
    expect(currentMonthBounds(instant, 'UTC')).toEqual({
      start: '2026-05-01',
      endExclusive: '2026-06-01',
    })
  })
})
