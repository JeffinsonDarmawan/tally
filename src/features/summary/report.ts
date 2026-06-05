import type { EnrichedExpense } from '@/features/dashboard'

export type PeriodMode = 'month' | 'year'
export interface Period {
  mode: PeriodMode
  year: number
  month: number // 1-12 (ignored for year mode)
}

export interface CategorySlice {
  categoryId: string | null
  cents: number
  pct: number
}
export interface PayerSlice {
  userId: string
  cents: number
  pct: number
}
export interface TimelineBucket {
  label: string
  key: string
  cents: number
}
export interface TopExpense {
  id: string
  date: string
  categoryId: string | null
  note: string | null
  totalCents: number
}

export interface Report {
  totalCents: number
  count: number
  /** My net for the period: Σ (what I paid − what I owed). */
  myNetCents: number
  byCategory: CategorySlice[]
  whoPaid: PayerSlice[]
  timeline: TimelineBucket[]
  topExpenses: TopExpense[]
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const pad = (n: number) => String(n).padStart(2, '0')
const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate()
const pct = (cents: number, total: number) => (total > 0 ? Math.round((cents / total) * 1000) / 10 : 0)

/** The [start, endExclusive) date window for a period. */
export function periodBounds(p: Period): { start: string; endExclusive: string } {
  if (p.mode === 'year') {
    return { start: `${p.year}-01-01`, endExclusive: `${p.year + 1}-01-01` }
  }
  const ny = p.month === 12 ? p.year + 1 : p.year
  const nm = p.month === 12 ? 1 : p.month + 1
  return { start: `${p.year}-${pad(p.month)}-01`, endExclusive: `${ny}-${pad(nm)}-01` }
}

/** Build the visual report for a month or year (brief §9). Pure. */
export function summarizeReport(all: EnrichedExpense[], me: string, p: Period): Report {
  const { start, endExclusive } = periodBounds(p)
  const exps = all.filter((e) => e.date >= start && e.date < endExclusive)

  const totalCents = exps.reduce((s, e) => s + e.totalCents, 0)
  const count = exps.length
  const myNetCents = exps.reduce((s, e) => s + (e.paid[me] ?? 0) - (e.owed[me] ?? 0), 0)

  const catMap = new Map<string | null, number>()
  for (const e of exps) catMap.set(e.categoryId, (catMap.get(e.categoryId) ?? 0) + e.totalCents)
  const byCategory = [...catMap.entries()]
    .map(([categoryId, cents]) => ({ categoryId, cents, pct: pct(cents, totalCents) }))
    .sort((a, b) => b.cents - a.cents)

  const payMap = new Map<string, number>()
  for (const e of exps) for (const [u, c] of Object.entries(e.paid)) payMap.set(u, (payMap.get(u) ?? 0) + c)
  const paidTotal = [...payMap.values()].reduce((s, c) => s + c, 0)
  const whoPaid = [...payMap.entries()]
    .map(([userId, cents]) => ({ userId, cents, pct: pct(cents, paidTotal) }))
    .sort((a, b) => b.cents - a.cents)

  let timeline: TimelineBucket[]
  if (p.mode === 'month') {
    const byDay = new Map<number, number>()
    for (const e of exps) {
      const day = Number(e.date.slice(8, 10))
      byDay.set(day, (byDay.get(day) ?? 0) + e.totalCents)
    }
    timeline = Array.from({ length: daysInMonth(p.year, p.month) }, (_, i) => {
      const day = i + 1
      return { label: String(day), key: `${p.year}-${pad(p.month)}-${pad(day)}`, cents: byDay.get(day) ?? 0 }
    })
  } else {
    const byMonth = new Map<number, number>()
    for (const e of exps) {
      const m = Number(e.date.slice(5, 7))
      byMonth.set(m, (byMonth.get(m) ?? 0) + e.totalCents)
    }
    timeline = MONTHS.map((label, i) => ({ label, key: `${p.year}-${pad(i + 1)}`, cents: byMonth.get(i + 1) ?? 0 }))
  }

  const topExpenses = [...exps]
    .sort((a, b) => b.totalCents - a.totalCents)
    .slice(0, 5)
    .map((e) => ({ id: e.id, date: e.date, categoryId: e.categoryId, note: e.note, totalCents: e.totalCents }))

  return { totalCents, count, myNetCents, byCategory, whoPaid, timeline, topExpenses }
}
