import { CURRENCY_CODE } from '@/config'

/**
 * Format a money amount in the group's single currency.
 * Always 2 decimal places; the UI pairs this with tabular figures (.num).
 */
export function formatMoney(
  amount: number,
  options: { currency?: string; signDisplay?: 'auto' | 'never' | 'always' } = {},
): string {
  const { currency = CURRENCY_CODE, signDisplay = 'auto' } = options
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency,
    signDisplay,
  }).format(amount)
}

/** Absolute money value, no sign — for "you owe / you're owed" rows where the label carries meaning. */
export function formatMoneyAbs(amount: number, currency?: string): string {
  return formatMoney(Math.abs(amount), { currency, signDisplay: 'never' })
}

/** The currency's symbol (e.g. "$") for prefixing inputs. Falls back to the code. */
export function currencySymbol(currency: string = CURRENCY_CODE): string {
  const parts = new Intl.NumberFormat('en-SG', { style: 'currency', currency }).formatToParts(0)
  return parts.find((p) => p.type === 'currency')?.value ?? currency
}

/** Parse a user-typed money string to a number; NaN/blank → 0. */
export function parseMoney(input: string): number {
  const n = Number.parseFloat(input.replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : 0
}

/** Short, friendly date from an ISO date string (e.g. "1 Jun"). */
export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })
}
