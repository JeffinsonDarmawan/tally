/**
 * Group-time-zone clock helpers (brief §6.7). One configurable group time zone drives
 * "days unpaid" and month boundaries, so every member sees identical figures regardless of
 * where they are. Functions take an explicit instant for testability.
 */

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** The calendar date (YYYY-MM-DD) for an instant, in the given IANA time zone. */
export function dateInTimeZone(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant)

  const map: Record<string, string> = {}
  for (const p of parts) map[p.type] = p.value
  return `${map.year}-${map.month}-${map.day}`
}

const MS_PER_DAY = 86_400_000

function utcMidnight(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

/** Whole calendar days from `from` to `to` (both YYYY-MM-DD). Date-only, so DST-safe. */
export function daysBetween(from: string, to: string): number {
  return Math.round((utcMidnight(to) - utcMidnight(from)) / MS_PER_DAY)
}

export interface MonthBounds {
  /** Inclusive first day of the month (YYYY-MM-DD). */
  start: string
  /** Exclusive first day of the next month — filter with `date >= start && date < endExclusive`. */
  endExclusive: string
}

/** [first-of-month, first-of-next-month) for a 1-indexed month. */
export function monthBounds(year: number, month: number): MonthBounds {
  const nextYear = month === 12 ? year + 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  return {
    start: `${year}-${pad2(month)}-01`,
    endExclusive: `${nextYear}-${pad2(nextMonth)}-01`,
  }
}

/** The month window containing `instant`, evaluated in the group time zone. */
export function currentMonthBounds(instant: Date, timeZone: string): MonthBounds {
  const [year, month] = dateInTimeZone(instant, timeZone).split('-').map(Number)
  return monthBounds(year, month)
}
