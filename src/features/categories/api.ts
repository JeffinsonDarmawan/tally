import { supabase } from '@/lib/supabase/client'
import type { Category } from '@/types/database.types'

export async function fetchCategories(groupId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('group_id', groupId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createCategory(input: {
  group_id: string
  name: string
  icon: string
  color: string
  sort_order?: number
}): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({ ...input, is_custom: true })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCategory(
  id: string,
  patch: { name?: string; icon?: string; color?: string; sort_order?: number },
): Promise<Category> {
  const { data, error } = await supabase.from('categories').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}
