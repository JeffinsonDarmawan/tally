import { computeBalances } from './balances'
import type { ExpenseSides, SettlementInput } from './balances'

/** A single simplified transfer: `from` pays `to` this amount (cents). */
export interface Transfer {
  from: string
  to: string
  amountCents: number
}

/**
 * Minimal set of transfers that zeroes out the group, given each person's net balance
 * (positive = owed to them, negative = they owe). Greedy min-cash-flow: repeatedly match the
 * largest creditor with the largest debtor (brief §6.6). Ties break by id for determinism.
 *
 * Presentation-only — it does NOT alter stored balances; it's a view over the same net() values.
 */
export function simplifyDebts(balances: Record<string, number>): Transfer[] {
  const bal = new Map<string, number>()
  for (const [u, v] of Object.entries(balances)) if (v !== 0) bal.set(u, v)

  const transfers: Transfer[] = []
  while (bal.size > 0) {
    let creditor: string | null = null
    let maxC = 0
    let debtor: string | null = null
    let maxD = 0

    for (const [u, v] of bal) {
      if (v > 0 && (creditor === null || v > maxC || (v === maxC && u < creditor))) {
        creditor = u
        maxC = v
      } else if (v < 0 && (debtor === null || -v > maxD || (-v === maxD && u < debtor))) {
        debtor = u
        maxD = -v
      }
    }
    if (creditor === null || debtor === null) break // unbalanced input — stop safely

    const amount = Math.min(maxC, maxD)
    transfers.push({ from: debtor, to: creditor, amountCents: amount })

    const newCreditor = maxC - amount
    const newDebtor = maxD - amount
    if (newCreditor === 0) bal.delete(creditor)
    else bal.set(creditor, newCreditor)
    if (newDebtor === 0) bal.delete(debtor)
    else bal.set(debtor, -newDebtor)
  }
  return transfers
}

/**
 * Each member's net balance across the group (positive = the group owes them).
 * Feeds `simplifyDebts`; consistent with `net()` (brief §6.6).
 */
export function groupBalances(
  members: string[],
  expenses: ExpenseSides[],
  settlements: SettlementInput[],
): Record<string, number> {
  const { net } = computeBalances(expenses, settlements)
  const out: Record<string, number> = {}
  for (const u of members) {
    let bal = 0
    for (const v of members) if (v !== u) bal += net(v, u)
    out[u] = bal
  }
  return out
}
