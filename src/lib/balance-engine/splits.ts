import { distribute, splitEqual } from './money'

/** Owed amount per user, in integer cents. */
export type CentShares = Record<string, number>

export interface ItemInput {
  /** Item cost in cents. */
  amount: number
  /** Users who share this item equally. */
  sharers: string[]
}

export interface ExtraChargeInput {
  /** Charge amount in cents (e.g. GST, service, tip). */
  amount: number
  /** 'proportional' to each person's item subtotal, or split 'equal' among involved. */
  mode: 'proportional' | 'equal'
}

export type ExpenseSplitInput =
  | { method: 'equal'; totalCents: number; involved: string[] }
  | { method: 'uneven'; amounts: CentShares }
  | { method: 'shares'; totalCents: number; weights: CentShares }
  | { method: 'percentage'; totalCents: number; percentages: CentShares }
  | { method: 'by_item'; involved: string[]; items: ItemInput[]; extraCharges?: ExtraChargeInput[] }

/** Sum all share amounts (cents). */
export function sumCents(shares: CentShares): number {
  return Object.values(shares).reduce((a, b) => a + b, 0)
}

/** Map an ordered list of users + a parallel cents array into a CentShares record. */
function toShares(users: string[], parts: number[]): CentShares {
  const out: CentShares = {}
  users.forEach((u, i) => {
    out[u] = parts[i]
  })
  return out
}

/** EQUAL: split the total equally among involved members. */
export function equalShares(totalCents: number, involved: string[]): CentShares {
  return toShares(involved, splitEqual(totalCents, involved.length))
}

/** UNEVEN / exact: the exact amount each person owes (cents). */
export function unevenShares(amounts: CentShares): CentShares {
  return { ...amounts }
}

/** SHARES (weighted): split the total in proportion to integer weights. */
export function weightedShares(totalCents: number, weights: CentShares): CentShares {
  const users = Object.keys(weights)
  return toShares(
    users,
    distribute(
      totalCents,
      users.map((u) => weights[u]),
    ),
  )
}

/** PERCENTAGE: split the total by each person's percentage (should sum to 100). */
export function percentageShares(totalCents: number, percentages: CentShares): CentShares {
  const users = Object.keys(percentages)
  return toShares(
    users,
    distribute(
      totalCents,
      users.map((u) => percentages[u]),
    ),
  )
}

/**
 * BY ITEMS: each item is split equally among its sharers; a person's base share is the sum
 * across items. Extra charges (tax / tip / service) are then auto-allocated — proportional to
 * each person's item subtotal, or split equally among involved — so the result reconciles to
 * Σ items + Σ charges (brief §8).
 */
export function byItemShares(
  involved: string[],
  items: ItemInput[],
  extraCharges: ExtraChargeInput[] = [],
): CentShares {
  const subtotals: CentShares = {}
  for (const u of involved) subtotals[u] = 0

  for (const item of items) {
    const parts = splitEqual(item.amount, item.sharers.length)
    item.sharers.forEach((u, i) => {
      subtotals[u] = (subtotals[u] ?? 0) + parts[i]
    })
  }

  const out: CentShares = { ...subtotals }
  for (const charge of extraCharges) {
    const weights =
      charge.mode === 'equal' ? involved.map(() => 1) : involved.map((u) => subtotals[u] ?? 0)
    const alloc = distribute(charge.amount, weights)
    involved.forEach((u, i) => {
      out[u] = (out[u] ?? 0) + alloc[i]
    })
  }
  return out
}

/** Dispatch a split input to the right method. Result always reconciles to the expense total. */
export function computeShares(input: ExpenseSplitInput): CentShares {
  switch (input.method) {
    case 'equal':
      return equalShares(input.totalCents, input.involved)
    case 'uneven':
      return unevenShares(input.amounts)
    case 'shares':
      return weightedShares(input.totalCents, input.weights)
    case 'percentage':
      return percentageShares(input.totalCents, input.percentages)
    case 'by_item':
      return byItemShares(input.involved, input.items, input.extraCharges ?? [])
  }
}
