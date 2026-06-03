import { supabase } from '@/lib/supabase/client'
import { fromCents } from '@/lib/balance-engine'
import { formatMoney } from '@/lib/utils/format'
import type { Json } from '@/types/database.types'
import { logActivity } from '@/features/activity'
import { notifyUsers } from '@/features/notifications'

/** Record a repayment, then (best-effort) log it and notify the other party (brief §11). */
export async function createSettlement(input: {
  groupId: string
  actor: string
  from: string
  to: string
  amountCents: number
  date: string
  note?: string
  fromName: string
  toName: string
}): Promise<void> {
  const amount = fromCents(input.amountCents)
  const { error } = await supabase.from('settlements').insert({
    group_id: input.groupId,
    from_user: input.from,
    to_user: input.to,
    amount,
    date: input.date,
    note: input.note?.trim() ? input.note.trim() : null,
  })
  if (error) throw error

  try {
    await logActivity({
      groupId: input.groupId,
      actor: input.actor,
      actionType: 'settlement.created',
      targetType: 'settlement',
      summary: `${input.fromName} paid ${input.toName} ${formatMoney(amount)}`,
      metadata: { amount } as unknown as Json,
    })
    const other = input.actor === input.from ? input.to : input.from
    await notifyUsers(
      [other].filter((u) => u !== input.actor),
      'settled_with_you',
      `${input.fromName} settled ${formatMoney(amount)} with ${input.toName}`,
      '/',
    )
  } catch (err) {
    console.warn('[tally] settlement activity/notify failed (non-fatal):', err)
  }
}

/** Send a gentle payment reminder: notify the debtor + log it. The shareable text is drafted UI-side. */
export async function sendReminder(input: {
  groupId: string
  actor: string
  debtor: string
  message: string
}): Promise<void> {
  await notifyUsers([input.debtor].filter((u) => u !== input.actor), 'reminder', input.message, '/')
  try {
    await logActivity({
      groupId: input.groupId,
      actor: input.actor,
      actionType: 'reminder.sent',
      targetType: 'profile',
      targetId: input.debtor,
      summary: 'sent a payment reminder',
    })
  } catch (err) {
    console.warn('[tally] reminder log failed (non-fatal):', err)
  }
}
