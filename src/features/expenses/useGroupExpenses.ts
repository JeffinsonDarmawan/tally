import { useCallback, useEffect, useState } from 'react'
import { fetchGroupExpenses, type ExpenseListItem } from './api'

type Status = 'loading' | 'ready' | 'error'

/** Loads the group's expenses (newest first) with a reload function. */
export function useGroupExpenses(groupId: string | undefined) {
  const [expenses, setExpenses] = useState<ExpenseListItem[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!groupId) return
    setStatus('loading')
    setError(null)
    try {
      setExpenses(await fetchGroupExpenses(groupId))
      setStatus('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses.')
      setStatus('error')
    }
  }, [groupId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { expenses, status, error, reload }
}
