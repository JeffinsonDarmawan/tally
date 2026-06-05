import { supabase } from '@/lib/supabase/client'

export interface AppNotification {
  id: string
  user_id: string
  type: string
  message: string
  link: string | null
  read: boolean
  created_at: string
}

/** Create in-app notifications for recipients (RLS allows notifying group members). */
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

/** The current user's notifications, newest first. */
export async function fetchNotifications(userId: string, limit = 50): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

/** Mark all of the user's unread notifications as read. */
export async function markAllRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
  if (error) throw error
}
