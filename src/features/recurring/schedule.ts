/**
 * Pure recurrence scheduling (brief §10). Periods are anchored at the start date and stepped by
 * frequency. The golden rule: NEVER surface a period that hasn't come due — future periods must not
 * post (which would inflate balances). Anchor days are clamped to short months (e.g. 31st → 28/29).
 */

export type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly'

export interface ScheduleTemplate {
  frequency: Frequency
  anchorDay: number | null
  startDate: string
  endDate: string | null
  lastPostedPeriod: string | null
  active: boolean
}

function daysInMonth(year: number, month: number): number {
  // month is 1-12; day 0 of the next month is the last day of this month.
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function ymd(y: number, m: number, d: number): string {
  return `${y}-${pad(m)}-${pad(d)}`
}

function parse(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map(Number)
  return { y, m, d }
}

function addDays(iso: string, n: number): string {
  const dt = new Date(`${iso}T00:00:00Z`)
  dt.setUTCDate(dt.getUTCDate() + n)
  return ymd(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate())
}

/** The k-th candidate period date (k = 0, 1, 2, …), anchored at the start date. */
function nthPeriod(t: ScheduleTemplate, k: number): string {
  const start = parse(t.startDate)
  switch (t.frequency) {
    case 'weekly':
      return addDays(t.startDate, 7 * k)
    case 'biweekly':
      return addDays(t.startDate, 14 * k)
    case 'monthly': {
      const anchor = t.anchorDay ?? start.d
      const totalMonths = start.m - 1 + k
      const y = start.y + Math.floor(totalMonths / 12)
      const m = (totalMonths % 12) + 1
      return ymd(y, m, Math.min(anchor, daysInMonth(y, m)))
    }
    case 'yearly': {
      const y = start.y + k
      return ymd(y, start.m, Math.min(start.d, daysInMonth(y, start.m)))
    }
  }
}

const CAP = 2400 // safety bound on the period search (≈ 200 years monthly)

/**
 * The next unposted period — the first valid period strictly after `lastPostedPeriod`
 * (or the first valid period if none posted), or null if the template has ended.
 */
export function nextOccurrence(t: ScheduleTemplate): string | null {
  const last = t.lastPostedPeriod
  for (let k = 0; k < CAP; k++) {
    const p = nthPeriod(t, k)
    if (p < t.startDate) continue
    if (t.endDate && p > t.endDate) return null
    if (last === null || p > last) return p
  }
  return null
}

/** The next period ONLY if it has come due (≤ today). Never returns a future period (§10). */
export function nextDuePeriod(t: ScheduleTemplate, today: string): string | null {
  if (!t.active) return null
  const p = nextOccurrence(t)
  if (!p) return null
  return p <= today ? p : null
}
