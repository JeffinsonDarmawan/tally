import { distribute } from './money'
import type { CentShares } from './splits'

/** A directed debt edge within one expense: `from` (debtor) owes `to` (creditor). */
export interface DebtEdge {
  from: string
  to: string
  amountCents: number
}

/**
 * Convert one expense's paying side (`paid`) and owing side (`owed`) into pairwise debt edges
 * (brief §6.1). Each participant's net is `paid − owed`; creditors have net > 0, debtors net < 0.
 * Each debtor's deficit is distributed across creditors in proportion to each creditor's surplus.
 * This reduces exactly to the simple case when there is a single payer.
 *
 * Users are processed in ascending id order so the edges (and any leftover-cent placement) are
 * fully deterministic.
 */
export function expenseEdges(paid: CentShares, owed: CentShares): DebtEdge[] {
  const users = new Set<string>([...Object.keys(paid), ...Object.keys(owed)])
  const net: Record<string, number> = {}
  for (const u of users) net[u] = (paid[u] ?? 0) - (owed[u] ?? 0)

  const creditors = [...users].filter((u) => net[u] > 0).sort()
  const debtors = [...users].filter((u) => net[u] < 0).sort()
  const creditorSurplus = creditors.map((c) => net[c])

  const edges: DebtEdge[] = []
  for (const d of debtors) {
    const deficit = -net[d]
    const alloc = distribute(deficit, creditorSurplus)
    creditors.forEach((c, i) => {
      if (alloc[i] > 0) edges.push({ from: d, to: c, amountCents: alloc[i] })
    })
  }
  return edges
}
