import { supabase } from '@/lib/supabase/client'
import { logActivity } from '@/features/activity'

/** Recategorize a set of expenses in one go (bulk action). */
export async function bulkRecategorize(ids: string[], categoryId: string | null): Promise<void> {
  if (ids.length === 0) return
  const { error } = await supabase.from('expenses').update({ category_id: categoryId }).in('id', ids)
  if (error) throw error
}

/** Delete a set of expenses (children cascade) and log it so others can see (brief §8). */
export async function bulkDelete(ids: string[], opts: { groupId: string; actor: string }): Promise<void> {
  if (ids.length === 0) return
  const { error } = await supabase.from('expenses').delete().in('id', ids)
  if (error) throw error
  try {
    await logActivity({
      groupId: opts.groupId,
      actor: opts.actor,
      actionType: 'expense.deleted',
      targetType: 'expense',
      summary: `deleted ${ids.length} expense${ids.length === 1 ? '' : 's'}`,
    })
  } catch (err) {
    console.warn('[tally] bulk-delete log failed (non-fatal):', err)
  }
}
