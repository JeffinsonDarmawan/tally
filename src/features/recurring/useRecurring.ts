import { useCallback, useEffect, useMemo, useState } from 'react'
import { dateInTimeZone } from '@/lib/balance-engine'
import { TIME_ZONE } from '@/config'
import { fetchTemplates, type RecurringTemplate } from './api'
import { nextDuePeriod, type ScheduleTemplate } from './schedule'

type Status = 'loading' | 'ready' | 'error'

export interface PendingInstance {
  template: RecurringTemplate
  period: string
}

export function toSchedule(t: RecurringTemplate): ScheduleTemplate {
  return {
    frequency: t.frequency,
    anchorDay: t.anchorDay,
    startDate: t.startDate,
    endDate: t.endDate,
    lastPostedPeriod: t.lastPostedPeriod,
    active: t.active,
  }
}

/** Loads templates and derives the currently-due (pending) instances — never future ones. */
export function useRecurring(groupId: string | undefined) {
  const [templates, setTemplates] = useState<RecurringTemplate[]>([])
  const [status, setStatus] = useState<Status>('loading')

  const reload = useCallback(async () => {
    if (!groupId) return
    setStatus('loading')
    try {
      setTemplates(await fetchTemplates(groupId))
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [groupId])

  useEffect(() => {
    void reload()
  }, [reload])

  const today = dateInTimeZone(new Date(), TIME_ZONE)

  const pending: PendingInstance[] = useMemo(
    () =>
      templates
        .map((template) => {
          const period = nextDuePeriod(toSchedule(template), today)
          return period ? { template, period } : null
        })
        .filter((p): p is PendingInstance => p !== null),
    [templates, today],
  )

  return { templates, pending, status, reload, today }
}
