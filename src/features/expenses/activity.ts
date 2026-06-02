import { supabase } from '@/lib/supabase/client'
import type { Json } from '@/types/database.types'

/** Append a row to the transparency feed (brief §5). actor must be the current user (RLS). */
export async function logActivity(input: {
  groupId: string
  actor: string
  actionType: string
  targetType?: string | null
  targetId?: string | null
  summary: string
  metadata?: Json
}): Promise<void> {
  const { error } = await supabase.from('activity_log').insert({
    group_id: input.groupId,
    actor: input.actor,
    action_type: input.actionType,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    summary: input.summary,
    metadata: input.metadata ?? {},
  })
  if (error) throw error
}

/** Create in-app notifications for a set of recipients (RLS allows notifying group members). */
export async function notifyUsers(
  userIds: string[],
  type: string,
  message: string,
  link?: string | null,
): Promise<void> {
  if (userIds.length === 0) return
  const { error } = await supabase
    .from('notifications')
    .insert(userIds.map((user_id) => ({ user_id, type, message, link: link ?? null })))
  if (error) throw error
}
