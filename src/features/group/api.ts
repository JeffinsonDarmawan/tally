import { supabase } from '@/lib/supabase/client'
import { CURRENCY_CODE, TIME_ZONE } from '@/config'
import type { Group, Profile } from '@/types/database.types'

export async function fetchMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data
}

/** The user's active group (v1 = the first one they belong to) plus its member ids, or null. */
export async function fetchMyGroup(userId: string): Promise<{ group: Group; memberIds: string[] } | null> {
  const { data: memberships, error } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)
  if (error) throw error
  if (!memberships || memberships.length === 0) return null

  const groupId = memberships[0].group_id
  const { data: group, error: gErr } = await supabase.from('groups').select('*').eq('id', groupId).single()
  if (gErr) throw gErr

  const { data: members, error: mErr } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
  if (mErr) throw mErr

  return { group, memberIds: (members ?? []).map((m) => m.user_id) }
}

export async function fetchProfiles(ids: string[]): Promise<Profile[]> {
  if (ids.length === 0) return []
  const { data, error } = await supabase.from('profiles').select('*').in('id', ids)
  if (error) throw error
  return data ?? []
}

/** Create the group, add the caller as a member, and seed default categories. Returns group id. */
export async function createGroup(name: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_group', {
    p_name: name,
    p_currency_code: CURRENCY_CODE,
    p_time_zone: TIME_ZONE,
  })
  if (error) throw error
  return data
}

/** Add a member to the group by their member code (profile id). RLS lets any member add others. */
export async function addMember(groupId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: userId })
  if (error) throw error
}

export async function updateMyProfile(
  userId: string,
  patch: { display_name?: string; avatar_color?: string },
): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').update(patch).eq('id', userId).select().single()
  if (error) throw error
  return data
}
