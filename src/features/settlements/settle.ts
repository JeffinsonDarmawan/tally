export type SettleKind = 'you_pay' | 'they_pay' | 'settled'

export interface SettleDefault {
  from: string
  to: string
  amountCents: number
  kind: SettleKind
}

/**
 * Default settlement for a friend, from `net(me, friend)`:
 *   net > 0 ⇒ I owe them → I pay them the outstanding (you_pay)
 *   net < 0 ⇒ they owe me → record their repayment to me (they_pay)
 *   net = 0 ⇒ settled
 */
export function settleDefault(netCents: number, me: string, friend: string): SettleDefault {
  if (netCents > 0) return { from: me, to: friend, amountCents: netCents, kind: 'you_pay' }
  if (netCents < 0) return { from: friend, to: me, amountCents: -netCents, kind: 'they_pay' }
  return { from: me, to: friend, amountCents: 0, kind: 'settled' }
}

/** A gentle, copy-pasteable reminder message for an outstanding debt (brief §11). */
export function reminderMessage({
  name,
  amount,
  days,
}: {
  name: string
  amount: string
  days: number | null
}): string {
  const since = days != null ? ` for ${days} ${days === 1 ? 'day' : 'days'}` : ''
  return `Hi ${name} 👋 gentle nudge — you've owed me ${amount}${since}. Whenever you get a chance, no rush! 🙂`
}
