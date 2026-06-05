import { useCallback, useEffect, useState } from 'react'
import { fetchNotifications, markAllRead, type AppNotification } from './api'

type Status = 'loading' | 'ready' | 'error'

/** Loads the current user's notifications with an unread count + mark-read. */
export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [status, setStatus] = useState<Status>('loading')

  const reload = useCallback(async () => {
    if (!userId) return
    setStatus('loading')
    try {
      setNotifications(await fetchNotifications(userId))
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [userId])

  useEffect(() => {
    void reload()
  }, [reload])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markRead = useCallback(async () => {
    if (!userId || unreadCount === 0) return
    setNotifications((ns) => ns.map((n) => ({ ...n, read: true })))
    try {
      await markAllRead(userId)
    } catch {
      void reload()
    }
  }, [userId, unreadCount, reload])

  return { notifications, unreadCount, status, reload, markRead }
}
