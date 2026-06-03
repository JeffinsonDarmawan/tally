import { supabase } from '@/lib/supabase/client'
import { toCents } from '@/lib/balance-engine'
import type { CentShares, SettlementInput } from '@/lib/balance-engine'
import type { EnrichedExpense } from './summarize'

export interface DashboardData {
  expenses: EnrichedExpense[]
  settlements: SettlementInput[]
}

/** Fetch the group's expenses (with both ledger sides) + settlements, ready for the engine. */
export async function fetchDashboardData(groupId: string): Promise<DashboardData> {
  const { data: exps, error } = await supabase
    .from('expenses')
    .select('id, date, category_id, paid_by, note, total_amount')
    .eq('group_id', groupId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error

  const ids = (exps ?? []).map((e) => e.id)
  const sharesByExpense = new Map<string, CentShares>()
  const payersByExpense = new Map<string, CentShares>()
  const payerCount = new Map<string, number>()

  if (ids.length > 0) {
    const { data: shares, error: sErr } = await supabase
      .from('expense_shares')
      .select('expense_id, user_id, amount')
      .in('expense_id', ids)
    if (sErr) throw sErr
    for (const r of shares ?? []) {
      const m = sharesByExpense.get(r.expense_id) ?? {}
      m[r.user_id] = toCents(r.amount)
      sharesByExpense.set(r.expense_id, m)
    }

    const { data: payers, error: pErr } = await supabase
      .from('expense_payers')
      .select('expense_id, user_id, amount_paid')
      .in('expense_id', ids)
    if (pErr) throw pErr
    for (const r of payers ?? []) {
      const m = payersByExpense.get(r.expense_id) ?? {}
      m[r.user_id] = toCents(r.amount_paid)
      payersByExpense.set(r.expense_id, m)
      payerCount.set(r.expense_id, (payerCount.get(r.expense_id) ?? 0) + 1)
    }
  }

  const expenses: EnrichedExpense[] = (exps ?? []).map((e) => ({
    id: e.id,
    date: e.date,
    categoryId: e.category_id,
    paidBy: e.paid_by,
    payerCount: payerCount.get(e.id) ?? 0,
    note: e.note,
    totalCents: toCents(e.total_amount),
    paid: payersByExpense.get(e.id) ?? {},
    owed: sharesByExpense.get(e.id) ?? {},
  }))

  const { data: setRows, error: setErr } = await supabase
    .from('settlements')
    .select('from_user, to_user, amount')
    .eq('group_id', groupId)
  if (setErr) throw setErr
  const settlements: SettlementInput[] = (setRows ?? []).map((r) => ({
    from: r.from_user,
    to: r.to_user,
    amountCents: toCents(r.amount),
  }))

  return { expenses, settlements }
}
