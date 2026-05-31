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
