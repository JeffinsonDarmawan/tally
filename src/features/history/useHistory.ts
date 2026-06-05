import { useCallback, useEffect, useState } from 'react'
import { fetchDashboardData, type DashboardData } from '@/features/dashboard'

type Status = 'loading' | 'ready' | 'error'

/** Loads the enriched ledger (expenses with both sides + settlements) for the History page. */
export function useHistory(groupId: string | undefined) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [status, setStatus] = useState<Status>('loading')

  const reload = useCallback(async () => {
    if (!groupId) return
    setStatus('loading')
    try {
      setData(await fetchDashboardData(groupId))
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [groupId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, status, reload }
}
