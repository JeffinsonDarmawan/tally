import { toCents, fromCents, computeShares } from '@/lib/balance-engine'
import type { CentShares, ExtraChargeInput } from '@/lib/balance-engine'
import type { ExtraCharge, SplitMethod } from '@/types/database.types'

export interface DraftPayer {
  userId: string
  amount: number // dollars
}

export interface DraftItem {
  name: string
  amount: number // dollars
  sharers: string[]
}

export interface DraftCharge {
  label: string
  amount: number // dollars
  mode: 'proportional' | 'equal'
}

/** The Add-Expense form state, in display units (dollars). */
export interface ExpenseDraft {
  date: string
  categoryId: string | null
  note: string
  totalAmount: number
  splitMethod: SplitMethod
  involved: string[]
  payers: DraftPayer[]
  uneven?: Record<string, number>
  weights?: Record<string, number>
  percentages?: Record<string, number>
  items?: DraftItem[]
  extraCharges?: DraftCharge[]
  receiptUrl?: string | null
}

export interface BuiltExpense {
  expense: {
    date: string
    category_id: string | null
    note: string | null
    total_amount: number
    split_method: SplitMethod
    extra_charges: ExtraCharge[]
    receipt_url: string | null
  }
  /** Canonical owing side — one row per involved user, sums to total. */
  shares: { user_id: string; amount: number }[]
  /** Canonical paying side — sums to total. */
  payers: { user_id: string; amount_paid: number }[]
  /** Line items (by-item split only). */
  items: DraftItem[]
}

export type BuildResult = ({ ok: true } & BuiltExpense) | { ok: false; errors: string[] }

/** The expense total in cents: derived from items+charges for by-item, entered otherwise. */
export function draftTotalCents(draft: ExpenseDraft): number {
  if (draft.splitMethod === 'by_item') {
    const items = draft.items ?? []
    const charges = draft.extraCharges ?? []
    return (
      items.reduce((s, it) => s + toCents(it.amount), 0) +
      charges.reduce((s, c) => s + toCents(c.amount), 0)
    )
  }
  return toCents(draft.totalAmount)
}

/** Compute the owing side (cents) for a draft, regardless of validity (used for live previews). */
export function computeDraftShares(draft: ExpenseDraft): CentShares {
  const totalCents = draftTotalCents(draft)
  const { involved } = draft
  switch (draft.splitMethod) {
    case 'equal':
      return computeShares({ method: 'equal', totalCents, involved })
    case 'uneven': {
      const amounts: CentShares = {}
      for (const u of involved) amounts[u] = toCents(draft.uneven?.[u] ?? 0)
      return computeShares({ method: 'uneven', amounts })
    }
    case 'shares': {
      const weights: CentShares = {}
      for (const u of involved) weights[u] = draft.weights?.[u] ?? 0
      const sum = Object.values(weights).reduce((a, b) => a + b, 0)
      if (sum <= 0) return Object.fromEntries(involved.map((u) => [u, 0]))
      return computeShares({ method: 'shares', totalCents, weights })
    }
    case 'percentage': {
      const pct: CentShares = {}
      for (const u of involved) pct[u] = draft.percentages?.[u] ?? 0
      const sum = Object.values(pct).reduce((a, b) => a + b, 0)
      if (sum <= 0) return Object.fromEntries(involved.map((u) => [u, 0]))
      return computeShares({ method: 'percentage', totalCents, percentages: pct })
    }
    case 'by_item': {
      const items = (draft.items ?? []).map((it) => ({ amount: toCents(it.amount), sharers: it.sharers }))
      const charges: ExtraChargeInput[] = (draft.extraCharges ?? []).map((c) => ({
        amount: toCents(c.amount),
        mode: c.mode,
      }))
      return computeShares({ method: 'by_item', involved, items, extraCharges: charges })
    }
  }
}

/**
 * Validate a draft and build the canonical DB rows. Enforces the two ledger invariants
 * (Σ shares == total, Σ payers == total) and each split method's own rule. Money is reconciled
 * in integer cents, then stored as dollars.
 */
export function buildExpense(draft: ExpenseDraft): BuildResult {
  const errors: string[] = []
  const { involved } = draft

  if (involved.length === 0) errors.push('Select at least one person involved.')

  const totalCents = draftTotalCents(draft)
  if (totalCents <= 0) errors.push('Enter a total greater than zero.')

  // Method-specific rules.
  switch (draft.splitMethod) {
    case 'uneven': {
      const sum = involved.reduce((s, u) => s + toCents(draft.uneven?.[u] ?? 0), 0)
      if (sum !== totalCents) errors.push('Exact amounts must add up to the total.')
      break
    }
    case 'shares': {
      const sum = involved.reduce((s, u) => s + (draft.weights?.[u] ?? 0), 0)
      if (sum <= 0) errors.push('Assign at least one share.')
      break
    }
    case 'percentage': {
      const sum = involved.reduce((s, u) => s + (draft.percentages?.[u] ?? 0), 0)
      if (Math.round(sum * 100) !== 10000) errors.push('Percentages must add up to 100%.')
      break
    }
    case 'by_item': {
      if ((draft.items ?? []).length === 0) errors.push('Add at least one item.')
      break
    }
  }

  const shareMap = computeDraftShares(draft)

  // Paying side must reconcile to the total.
  const payersSum = draft.payers.reduce((s, p) => s + toCents(p.amount), 0)
  if (payersSum !== totalCents) errors.push('Payer contributions must add up to the total.')

  if (errors.length > 0) return { ok: false, errors }

  return {
    ok: true,
    expense: {
      date: draft.date,
      category_id: draft.categoryId,
      note: draft.note.trim() ? draft.note.trim() : null,
      total_amount: fromCents(totalCents),
      split_method: draft.splitMethod,
      extra_charges: draft.splitMethod === 'by_item' ? (draft.extraCharges ?? []) : [],
      receipt_url: draft.receiptUrl ?? null,
    },
    shares: involved.map((u) => ({ user_id: u, amount: fromCents(shareMap[u] ?? 0) })),
    payers: draft.payers.map((p) => ({ user_id: p.userId, amount_paid: fromCents(toCents(p.amount)) })),
    items: draft.splitMethod === 'by_item' ? (draft.items ?? []) : [],
  }
}

/** Per-involved-user shares in dollars, for live UI previews (no validation). */
export function previewShares(draft: ExpenseDraft): Record<string, number> {
  const shareMap = computeDraftShares(draft)
  return Object.fromEntries(draft.involved.map((u) => [u, fromCents(shareMap[u] ?? 0)]))
}
