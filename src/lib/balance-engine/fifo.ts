import { expenseEdges } from './netting'
import { computeBalances } from './balances'
import { daysBetween } from './clock'
import type { ExpenseSides, SettlementInput } from './balances'

/** A dated chunk of debt (one expense's directed edge). */
export interface DatedDebt {
  date: string // ISO date (YYYY-MM-DD)
  amountCents: number
}

/** An expense plus the date it occurred. */
export interface DatedExpense extends ExpenseSides {
  date: string
}

/**
 * Apply a repayment amount to a list of dated debt chunks **oldest-first** (brief §6.4).
 * Fully-covered chunks drop out; a partially-covered chunk keeps its remaining amount.
 * The returned chunks (oldest-first) are the "unpaid" items.
 */
export function fifoUnpaid(items: DatedDebt[], reductionCents: number): DatedDebt[] {
  const sorted = [...items].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  let remaining = Math.max(0, reductionCents)
  const out: DatedDebt[] = []
  for (const item of sorted) {
    if (remaining >= item.amountCents) {
      remaining -= item.amountCents
    } else {
      out.push({ date: item.date, amountCents: item.amountCents - remaining })
      remaining = 0
    }
  }
  return out
}

export type UnpaidDirection = 'you_owe' | 'they_owe' | 'settled'

export interface PairUnpaid {
  direction: UnpaidDirection
  /** Unpaid dated chunks, oldest-first; empty when settled. */
  items: DatedDebt[]
  /** Total still outstanding (cents) — equals |net(me, friend)|. */
  totalCents: number
}

/** All directed debt edges `from → to` across expenses, as dated chunks. */
function directedEdges(expenses: DatedExpense[], from: string, to: string): DatedDebt[] {
  const items: DatedDebt[] = []
  for (const e of expenses) {
    for (const edge of expenseEdges(e.paid, e.owed)) {
      if (edge.from === from && edge.to === to) {
        items.push({ date: e.date, amountCents: edge.amountCents })
      }
    }
  }
  return items
}

/**
 * Unpaid debt chunks between `me` and `friend`, in the net direction. Repayments (and any
 * reverse debt) are applied oldest-first, so `totalCents` stays consistent with `net()` and the
 * oldest remaining chunk's date drives "days unpaid".
 */
export function pairUnpaid(
  me: string,
  friend: string,
  expenses: DatedExpense[],
  settlements: SettlementInput[],
): PairUnpaid {
  const { net } = computeBalances(expenses, settlements)
  const n = net(me, friend)
  if (n === 0) return { direction: 'settled', items: [], totalCents: 0 }

  const debtor = n > 0 ? me : friend
  const creditor = n > 0 ? friend : me
  const outstanding = Math.abs(n)

  const edges = directedEdges(expenses, debtor, creditor)
  const gross = edges.reduce((sum, e) => sum + e.amountCents, 0)
  const items = fifoUnpaid(edges, Math.max(0, gross - outstanding))

  return {
    direction: n > 0 ? 'you_owe' : 'they_owe',
    items,
    totalCents: items.reduce((sum, e) => sum + e.amountCents, 0),
  }
}

/**
 * Days since the oldest unpaid chunk, measured to `today` (both in the group time zone).
 * Returns null when nothing is unpaid. Items are oldest-first, so the first one is the oldest.
 */
export function daysUnpaid(items: DatedDebt[], today: string): number | null {
  if (items.length === 0) return null
  return daysBetween(items[0].date, today)
}
