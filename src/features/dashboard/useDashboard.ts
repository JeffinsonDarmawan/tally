import { useCallback, useEffect, useMemo, useState } from 'react'
import { currentMonthBounds, dateInTimeZone } from '@/lib/balance-engine'
import { TIME_ZONE } from '@/config'
import { fetchDashboardData, type DashboardData } from './api'
import { summarizeDashboard, type DashboardSummary } from './summarize'

type Status = 'loading' | 'ready' | 'error'

/** Fetches the group's ledger and derives the dashboard summary via the engine. */
export function useDashboard(groupId: string | undefined, me: string, memberIds: string[]) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!groupId) return
    setStatus('loading')
    setError(null)
    try {
      setData(await fetchDashboardData(groupId))
      setStatus('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your balances.')
      setStatus('error')
    }
  }, [groupId])

  useEffect(() => {
    void reload()
  }, [reload])

  // Stable member-id key so the summary only recomputes when membership actually changes.
  const memberKey = memberIds.join(',')
  const summary: DashboardSummary | null = useMemo(() => {
    if (!data || !me) return null
    const now = new Date()
    const today = dateInTimeZone(now, TIME_ZONE)
    const bounds = currentMonthBounds(now, TIME_ZONE)
    return summarizeDashboard({
      expenses: data.expenses,
      settlements: data.settlements,
      me,
      memberIds: memberKey ? memberKey.split(',') : [],
      today,
      monthStart: bounds.start,
      monthEndExclusive: bounds.endExclusive,
    })
  }, [data, me, memberKey])

  return { summary, status, error, reload }
}
