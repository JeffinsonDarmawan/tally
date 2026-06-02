import { parseMoney } from '@/lib/utils/format'
import type { SplitMethod } from '@/types/database.types'
import type { ExpenseDraft } from './build'

export interface ItemRow {
  id: string
  name: string
  amount: string
  sharers: string[]
}

export interface ChargeRow {
  id: string
  label: string
  amount: string
  mode: 'proportional' | 'equal'
}

/** The Add-Expense wizard's working state (all amounts are raw input strings). */
export interface FormState {
  date: string
  categoryId: string | null
  note: string
  total: string
  receiptUrl: string | null
  multiPayer: boolean
  singlePayerId: string
  payerAmounts: Record<string, string>
  involved: string[]
  method: SplitMethod
  uneven: Record<string, string>
  weights: Record<string, string>
  percentages: Record<string, string>
  items: ItemRow[]
  charges: ChargeRow[]
}

export function emptyForm(memberIds: string[], me: string, today: string): FormState {
  return {
    date: today,
    categoryId: null,
    note: '',
    total: '',
    receiptUrl: null,
    multiPayer: false,
    singlePayerId: me,
    payerAmounts: {},
    involved: [...memberIds],
    method: 'equal',
    uneven: {},
    weights: Object.fromEntries(memberIds.map((id) => [id, '1'])),
    percentages: {},
    items: [],
    charges: [],
  }
}

/** Sum of items + charges (dollars), for the derived by-item total. */
export function itemsChargesTotal(form: FormState): number {
  const items = form.items.reduce((s, it) => s + parseMoney(it.amount), 0)
  const charges = form.charges.reduce((s, c) => s + parseMoney(c.amount), 0)
  return Math.round((items + charges) * 100) / 100
}

/** The effective expense total: derived from items for by-item, entered otherwise. */
export function effectiveTotal(form: FormState): number {
  return form.method === 'by_item' ? itemsChargesTotal(form) : parseMoney(form.total)
}

/** Convert the wizard state into an ExpenseDraft for `buildExpense`. */
export function formToDraft(form: FormState): ExpenseDraft {
  const total = effectiveTotal(form)

  const payers = form.multiPayer
    ? Object.entries(form.payerAmounts)
        .map(([userId, a]) => ({ userId, amount: parseMoney(a) }))
        .filter((p) => p.amount > 0)
    : [{ userId: form.singlePayerId, amount: total }]

  const pickInvolved = (map: Record<string, string>, parse: (s: string) => number) => {
    const out: Record<string, number> = {}
    for (const u of form.involved) out[u] = parse(map[u] ?? '0')
    return out
  }

  const draft: ExpenseDraft = {
    date: form.date,
    categoryId: form.categoryId,
    note: form.note,
    totalAmount: total,
    splitMethod: form.method,
    involved: form.involved,
    payers,
    receiptUrl: form.receiptUrl,
  }

  if (form.method === 'uneven') draft.uneven = pickInvolved(form.uneven, parseMoney)
  if (form.method === 'shares') {
    draft.weights = pickInvolved(form.weights, (s) => Math.max(0, Math.floor(parseMoney(s))))
  }
  if (form.method === 'percentage') draft.percentages = pickInvolved(form.percentages, parseMoney)
  if (form.method === 'by_item') {
    draft.items = form.items.map((it) => ({
      name: it.name,
      amount: parseMoney(it.amount),
      sharers: it.sharers,
    }))
    draft.extraCharges = form.charges.map((c) => ({
      label: c.label,
      amount: parseMoney(c.amount),
      mode: c.mode,
    }))
  }
  return draft
}

function strMap(map?: Record<string, number> | null): Record<string, string> {
  if (!map) return {}
  return Object.fromEntries(Object.entries(map).map(([k, v]) => [k, String(v)]))
}

/** Rebuild the wizard state from a saved draft (for editing). */
export function draftToForm(draft: ExpenseDraft, me: string): FormState {
  return {
    date: draft.date,
    categoryId: draft.categoryId,
    note: draft.note,
    total: draft.totalAmount ? String(draft.totalAmount) : '',
    receiptUrl: draft.receiptUrl ?? null,
    multiPayer: draft.payers.length > 1,
    singlePayerId: draft.payers[0]?.userId ?? me,
    payerAmounts: Object.fromEntries(draft.payers.map((p) => [p.userId, String(p.amount)])),
    involved: draft.involved,
    method: draft.splitMethod,
    uneven: strMap(draft.uneven),
    weights:
      draft.weights && Object.keys(draft.weights).length
        ? strMap(draft.weights)
        : Object.fromEntries(draft.involved.map((id) => [id, '1'])),
    percentages: strMap(draft.percentages),
    items: (draft.items ?? []).map((it, i) => ({
      id: `item-${i}`,
      name: it.name,
      amount: String(it.amount),
      sharers: it.sharers,
    })),
    charges: (draft.extraCharges ?? []).map((c, i) => ({
      id: `charge-${i}`,
      label: c.label,
      amount: String(c.amount),
      mode: c.mode,
    })),
  }
}
