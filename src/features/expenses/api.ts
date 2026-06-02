import { supabase } from '@/lib/supabase/client'
import type { Json, SplitMethod } from '@/types/database.types'
import type { BuiltExpense, DraftCharge, DraftItem, DraftPayer, ExpenseDraft } from './build'
import { logActivity, notifyUsers } from './activity'

/** A row for the expense list (history). */
export interface ExpenseListItem {
  id: string
  date: string
  total_amount: number
  category_id: string | null
  paid_by: string | null
  note: string | null
  split_method: SplitMethod
}

/** The group's expenses, newest first. */
export async function fetchGroupExpenses(groupId: string): Promise<ExpenseListItem[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('id, date, total_amount, category_id, paid_by, note, split_method')
    .eq('group_id', groupId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

/** The split inputs snapshot stored on the expense for faithful editing. */
interface SplitConfig {
  involved?: string[]
  payers?: DraftPayer[]
  uneven?: Record<string, number> | null
  weights?: Record<string, number> | null
  percentages?: Record<string, number> | null
  items?: DraftItem[] | null
  extraCharges?: DraftCharge[] | null
}

function splitConfigFrom(draft: ExpenseDraft): Json {
  const cfg: SplitConfig = {
    involved: draft.involved,
    payers: draft.payers,
    uneven: draft.uneven ?? null,
    weights: draft.weights ?? null,
    percentages: draft.percentages ?? null,
    items: draft.items ?? null,
    extraCharges: draft.extraCharges ?? null,
  }
  return cfg as unknown as Json
}

/** Insert the canonical children for an expense: shares, payers, and (by-item) items + item shares. */
async function insertChildren(expenseId: string, built: BuiltExpense): Promise<void> {
  const { error: sErr } = await supabase
    .from('expense_shares')
    .insert(built.shares.map((s) => ({ expense_id: expenseId, user_id: s.user_id, amount: s.amount })))
  if (sErr) throw sErr

  const { error: pErr } = await supabase
    .from('expense_payers')
    .insert(built.payers.map((p) => ({ expense_id: expenseId, user_id: p.user_id, amount_paid: p.amount_paid })))
  if (pErr) throw pErr

  for (const item of built.items) {
    const { data: row, error: iErr } = await supabase
      .from('expense_items')
      .insert({ expense_id: expenseId, name: item.name, amount: item.amount })
      .select('id')
      .single()
    if (iErr) throw iErr
    if (item.sharers.length > 0) {
      const { error: isErr } = await supabase
        .from('expense_item_shares')
        .insert(item.sharers.map((u) => ({ item_id: row.id, user_id: u })))
      if (isErr) throw isErr
    }
  }
}

async function bestEffortLog(
  action: 'expense.created' | 'expense.edited',
  groupId: string,
  actor: string,
  expenseId: string,
  draft: ExpenseDraft,
  built: BuiltExpense,
): Promise<void> {
  const verb = action === 'expense.created' ? 'added' : 'edited'
  try {
    await logActivity({
      groupId,
      actor,
      actionType: action,
      targetType: 'expense',
      targetId: expenseId,
      summary: `${verb} an expense (${built.expense.total_amount})`,
      metadata: { total: built.expense.total_amount } as unknown as Json,
    })
    await notifyUsers(
      draft.involved.filter((u) => u !== actor),
      'added_to_expense',
      `You were ${verb === 'added' ? 'added to' : 'updated on'} an expense`,
      '/',
    )
  } catch (err) {
    // Logging/notifying must never fail the save itself.
    console.warn('[tally] activity/notify failed (non-fatal):', err)
  }
}

/** Create an expense + its canonical children. Cleans up the expense if a child insert fails. */
export async function createExpense(
  groupId: string,
  userId: string,
  draft: ExpenseDraft,
  built: BuiltExpense,
): Promise<string> {
  const { data: exp, error } = await supabase
    .from('expenses')
    .insert({
      group_id: groupId,
      paid_by: built.payers[0]?.user_id ?? userId,
      date: built.expense.date,
      category_id: built.expense.category_id,
      total_amount: built.expense.total_amount,
      split_method: built.expense.split_method,
      split_config: splitConfigFrom(draft),
      extra_charges: built.expense.extra_charges as unknown as Json,
      note: built.expense.note,
      receipt_url: built.expense.receipt_url,
      created_by: userId,
    })
    .select('id')
    .single()
  if (error) throw error

  try {
    await insertChildren(exp.id, built)
  } catch (childErr) {
    await supabase.from('expenses').delete().eq('id', exp.id) // cascade-cleans any partial children
    throw childErr
  }

  await bestEffortLog('expense.created', groupId, userId, exp.id, draft, built)
  return exp.id
}

/** Update an expense by replacing its row + all canonical children. */
export async function updateExpense(
  expenseId: string,
  groupId: string,
  userId: string,
  draft: ExpenseDraft,
  built: BuiltExpense,
): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .update({
      paid_by: built.payers[0]?.user_id ?? userId,
      date: built.expense.date,
      category_id: built.expense.category_id,
      total_amount: built.expense.total_amount,
      split_method: built.expense.split_method,
      split_config: splitConfigFrom(draft),
      extra_charges: built.expense.extra_charges as unknown as Json,
      note: built.expense.note,
      receipt_url: built.expense.receipt_url,
    })
    .eq('id', expenseId)
  if (error) throw error

  // Replace children (deleting items cascades to expense_item_shares).
  await supabase.from('expense_shares').delete().eq('expense_id', expenseId)
  await supabase.from('expense_payers').delete().eq('expense_id', expenseId)
  await supabase.from('expense_items').delete().eq('expense_id', expenseId)
  await insertChildren(expenseId, built)

  await bestEffortLog('expense.edited', groupId, userId, expenseId, draft, built)
}

/** Delete an expense (children cascade) and log it so others can see (brief §8). */
export async function deleteExpense(
  expenseId: string,
  opts: { groupId: string; actor: string; notify: string[]; summary: string },
): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId)
  if (error) throw error
  try {
    await logActivity({
      groupId: opts.groupId,
      actor: opts.actor,
      actionType: 'expense.deleted',
      targetType: 'expense',
      targetId: expenseId,
      summary: opts.summary,
    })
    await notifyUsers(
      opts.notify.filter((u) => u !== opts.actor),
      'added_to_expense',
      'An expense you were part of was deleted',
      '/',
    )
  } catch (err) {
    console.warn('[tally] activity/notify failed (non-fatal):', err)
  }
}

/** Reconstruct an editable draft for an existing expense (from its split_config snapshot). */
export async function fetchExpenseForEdit(expenseId: string): Promise<ExpenseDraft> {
  const { data, error } = await supabase.from('expenses').select('*').eq('id', expenseId).single()
  if (error) throw error
  const cfg = (data.split_config ?? {}) as SplitConfig
  return {
    date: data.date,
    categoryId: data.category_id,
    note: data.note ?? '',
    totalAmount: data.total_amount,
    splitMethod: data.split_method,
    involved: cfg.involved ?? [],
    payers: cfg.payers ?? [],
    uneven: cfg.uneven ?? undefined,
    weights: cfg.weights ?? undefined,
    percentages: cfg.percentages ?? undefined,
    items: cfg.items ?? undefined,
    extraCharges: cfg.extraCharges ?? undefined,
    receiptUrl: data.receipt_url,
  }
}
