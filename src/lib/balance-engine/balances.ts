import { expenseEdges } from './netting'
import type { CentShares } from './splits'

/** One expense reduced to its two canonical sides (cents). */
export interface ExpenseSides {
  paid: CentShares
  owed: CentShares
}

/** A repayment: `from` paid `to` this amount (cents). */
export interface SettlementInput {
  from: string
  to: string
  amountCents: number
}

/** owe[debtor][creditor] = total cents the debtor owes the creditor across all expenses. */
export type OweMap = Record<string, Record<string, number>>

/** Aggregate every expense's pairwise edges into a single owe map (brief §6.1). */
export function aggregateOwe(expenses: ExpenseSides[]): OweMap {
  const owe: OweMap = {}
  for (const e of expenses) {
    for (const edge of expenseEdges(e.paid, e.owed)) {
      owe[edge.from] ??= {}
      owe[edge.from][edge.to] = (owe[edge.from][edge.to] ?? 0) + edge.amountCents
    }
  }
  return owe
}

function oweAmount(owe: OweMap, a: string, b: string): number {
  return owe[a]?.[b] ?? 0
}

function settledAmount(settlements: SettlementInput[], a: string, b: string): number {
  let sum = 0
  for (const s of settlements) if (s.from === a && s.to === b) sum += s.amountCents
  return sum
}

export interface Balances {
  owe: OweMap
  /** net(a, b) > 0 ⇒ a owes b ; < 0 ⇒ b owes a |net| ; 0 ⇒ settled (brief §6.2). */
  net: (a: string, b: string) => number
}

/**
 * Net balances from expenses + settlements:
 *   net(a,b) = (owe(a,b) − owe(b,a)) − settled(a→b) + settled(b→a)
 * Overpayment naturally flips the sign into a credit.
 */
export function computeBalances(expenses: ExpenseSides[], settlements: SettlementInput[]): Balances {
  const owe = aggregateOwe(expenses)
  const net = (a: string, b: string): number => {
    const rawNet = oweAmount(owe, a, b) - oweAmount(owe, b, a)
    return rawNet - settledAmount(settlements, a, b) + settledAmount(settlements, b, a)
  }
  return { owe, net }
}

export interface FriendNet {
  friend: string
  /** net(me, friend): > 0 ⇒ I owe them ; < 0 ⇒ they owe me. */
  netCents: number
}

export interface DashboardTotals {
  perFriend: FriendNet[]
  totalIOweCents: number
  totalImOwedCents: number
  /** > 0 ⇒ you're owed overall ; < 0 ⇒ you owe overall. */
  overallNetCents: number
}

/** Per-friend nets and owed/owe totals from `me`'s perspective (brief §6.3). */
export function dashboardTotals(
  me: string,
  friends: string[],
  expenses: ExpenseSides[],
  settlements: SettlementInput[],
): DashboardTotals {
  const { net } = computeBalances(expenses, settlements)
  const perFriend: FriendNet[] = friends.map((f) => ({ friend: f, netCents: net(me, f) }))

  let totalIOweCents = 0
  let totalImOwedCents = 0
  for (const { netCents } of perFriend) {
    if (netCents > 0) totalIOweCents += netCents
    else if (netCents < 0) totalImOwedCents += -netCents
  }

  return {
    perFriend,
    totalIOweCents,
    totalImOwedCents,
    overallNetCents: totalImOwedCents - totalIOweCents,
  }
}
