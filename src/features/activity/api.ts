import { supabase } from '@/lib/supabase/client'
import type { Json } from '@/types/database.types'

export interface ActivityRow {
  id: string
  group_id: string
  actor: string
  action_type: string
  target_type: string | null
  target_id: string | null
  summary: string
  metadata: Json
  created_at: string
}

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

/** The group's activity feed, newest first. */
export async function fetchActivity(groupId: string, limit = 50): Promise<ActivityRow[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}
