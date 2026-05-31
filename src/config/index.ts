/**
 * App-wide configuration constants.
 * v1 is single-currency and single-group; these are the configurable knobs.
 * Values fall back to sensible defaults but can be overridden via Vite env vars.
 */

export const APP_NAME = 'Tally'

/** Single currency for v1 (ISO 4217). */
export const CURRENCY_CODE = import.meta.env.VITE_DEFAULT_CURRENCY ?? 'SGD'

/** Group time zone — drives "days unpaid" and month/year boundaries (§6.7). */
export const TIME_ZONE = import.meta.env.VITE_DEFAULT_TIMEZONE ?? 'Asia/Singapore'

/** The six avatar colors (must mirror --color-person-* tokens in styles/index.css). */
export const PERSON_COLORS = [
  '#9C9CF0',
  '#74E0A2',
  '#F4948B',
  '#E0B35B',
  '#6BC8D6',
  '#D199E8',
] as const

export type PersonColor = (typeof PERSON_COLORS)[number]

/** Shared color palette for category colors and avatar colors. */
export const PALETTE = [
  '#9C9CF0', '#74E0A2', '#F4948B', '#6BC8D6', '#E0B35B', '#D199E8',
  '#7FB5F0', '#F0A6C0', '#8FE0B0', '#E8896B', '#B0A6F0', '#9A9AA2',
] as const
