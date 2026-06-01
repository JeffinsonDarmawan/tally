import { useCallback, useEffect, useState } from 'react'
import type { Category } from '@/types/database.types'
import { fetchCategories } from './api'

type Status = 'loading' | 'ready' | 'error'

/** Loads the group's categories, ordered by sort_order then name. */
export function useCategories(groupId: string | undefined) {
  const [categories, setCategories] = useState<Category[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!groupId) return
    setStatus('loading')
    setError(null)
    try {
      setCategories(await fetchCategories(groupId))
      setStatus('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories.')
      setStatus('error')
    }
  }, [groupId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { categories, status, error, reload }
}
