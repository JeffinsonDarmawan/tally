import { dashboardTotals, pairUnpaid, daysUnpaid, groupBalances, simplifyDebts } from '@/lib/balance-engine'
import type {
  CentShares,
  DatedExpense,
  ExpenseSides,
  SettlementInput,
  Transfer,
  UnpaidDirection,
} from '@/lib/balance-engine'

/** An expense enriched with its two ledger sides (cents) for the dashboard. */
export interface EnrichedExpense {
  id: string
  date: string
  categoryId: string | null
  paidBy: string | null
  payerCount: number
  note: string | null
  totalCents: number
  paid: CentShares
  owed: CentShares
}

export interface FriendBalance {
  friendId: string
  /** net(me, friend): > 0 I owe them ; < 0 they owe me ; 0 settled. */
  netCents: number
  direction: UnpaidDirection
  daysUnpaid: number | null
  unpaidCount: number
}

export interface ActivityItem {
  expenseId: string
  date: string
  categoryId: string | null
  paidBy: string | null
  payerCount: number
  totalCents: number
  /** What I owe on this expense. */
  myShareCents: number
  /** What I paid on this expense (so the row can show if I fronted money). */
  myPaidCents: number
}

export interface DashboardSummary {
  /** > 0 you're owed overall ; < 0 you owe overall. */
  overallNetCents: number
  totalOwedCents: number
  totalOweCents: number
  perFriend: FriendBalance[]
  unpaidCount: number
  oldestDaysUnpaid: number | null
  /** Minimal transfers that zero the whole group (the "simplify debts" view). */
  simplified: Transfer[]
  monthActivity: ActivityItem[]
}

export interface SummarizeInput {
  expenses: EnrichedExpense[]
  settlements: SettlementInput[]
  me: string
  memberIds: string[]
  /** Today's date (YYYY-MM-DD) in the group time zone. */
  today: string
  /** Current month window in the group time zone. */
  monthStart: string
  monthEndExclusive: string
}

/** Turn fetched rows into everything the dashboard renders (all via the pure engine). */
export function summarizeDashboard(input: SummarizeInput): DashboardSummary {
  const { expenses, settlements, me, memberIds, today, monthStart, monthEndExclusive } = input
  const friendIds = memberIds.filter((id) => id !== me)

  const sides: ExpenseSides[] = expenses.map((e) => ({ paid: e.paid, owed: e.owed }))
  const dated: DatedExpense[] = expenses.map((e) => ({ date: e.date, paid: e.paid, owed: e.owed }))

  const totals = dashboardTotals(me, friendIds, sides, settlements)
  const netByFriend = new Map(totals.perFriend.map((p) => [p.friend, p.netCents]))

  const perFriend: FriendBalance[] = friendIds.map((friendId) => {
    const pu = pairUnpaid(me, friendId, dated, settlements)
    return {
      friendId,
      netCents: netByFriend.get(friendId) ?? 0,
      direction: pu.direction,
      daysUnpaid: daysUnpaid(pu.items, today),
      unpaidCount: pu.items.length,
    }
  })

  const unpaidCount = perFriend.reduce((s, f) => s + f.unpaidCount, 0)
  const daysList = perFriend.map((f) => f.daysUnpaid).filter((d): d is number => d !== null)
  const oldestDaysUnpaid = daysList.length ? Math.max(...daysList) : null

  const simplified = simplifyDebts(groupBalances(memberIds, sides, settlements))

  const monthActivity: ActivityItem[] = expenses
    .filter((e) => e.date >= monthStart && e.date < monthEndExclusive)
    .filter((e) => e.owed[me] !== undefined || e.paid[me] !== undefined)
    .map((e) => ({
      expenseId: e.id,
      date: e.date,
      categoryId: e.categoryId,
      paidBy: e.paidBy,
      payerCount: e.payerCount,
      totalCents: e.totalCents,
      myShareCents: e.owed[me] ?? 0,
      myPaidCents: e.paid[me] ?? 0,
    }))

  return {
    overallNetCents: totals.overallNetCents,
    totalOwedCents: totals.totalImOwedCents,
    totalOweCents: totals.totalIOweCents,
    perFriend,
    unpaidCount,
    oldestDaysUnpaid,
    simplified,
    monthActivity,
  }
}
