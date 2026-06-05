import { useEffect, useState } from 'react'
import {
  IconBell,
  IconBellRinging,
  IconReceipt2,
  IconArrowsExchange,
  IconRepeat,
} from '@tabler/icons-react'
import { Avatar, EmptyState, Modal, SegmentedControl } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { formatTimestamp } from '@/lib/utils/format'
import { useAuth } from '@/features/auth'
import { useGroup } from '@/features/group'
import { fetchActivity, type ActivityRow } from '@/features/activity'
import { useNotifications } from './useNotifications'
import type { AppNotification } from './api'

const NOTIF_ICON: Record<string, typeof IconBell> = {
  added_to_expense: IconReceipt2,
  settled_with_you: IconArrowsExchange,
  recurring_due: IconRepeat,
  reminder: IconBellRinging,
}

export function NotificationBell({ className }: { className?: string }) {
  const { user } = useAuth()
  const { group, membersById } = useGroup()
  const me = user?.id ?? ''
  const { notifications, unreadCount, status, markRead, reload } = useNotifications(me)

  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'inbox' | 'activity'>('inbox')
  const [activity, setActivity] = useState<ActivityRow[]>([])
  const [activityStatus, setActivityStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')

  useEffect(() => {
    if (!open) return
    void reload()
    void markRead()
    if (group) {
      setActivityStatus('loading')
      fetchActivity(group.id)
        .then((rows) => {
          setActivity(rows)
          setActivityStatus('ready')
        })
        .catch(() => setActivityStatus('error'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        className={cn(
          'relative grid size-9 place-items-center rounded-xl text-subtle transition-colors hover:bg-elevated hover:text-ink',
          className,
        )}
      >
        <IconBell className="size-5" stroke={2} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-[var(--color-base)]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Inbox">
        <div className="space-y-4">
          <SegmentedControl
            fullWidth
            size="sm"
            aria-label="Inbox view"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'inbox', label: 'Notifications' },
              { value: 'activity', label: 'Activity' },
            ]}
          />

          {tab === 'inbox' ? (
            status !== 'ready' ? (
              <p className="py-8 text-center text-sm text-faint">Loading…</p>
            ) : notifications.length === 0 ? (
              <EmptyState
                icon={<IconBell className="size-7" stroke={1.75} />}
                title="No notifications"
                description="You're all caught up."
              />
            ) : (
              <ul className="-mx-1">
                {notifications.map((n) => (
                  <NotificationItem key={n.id} n={n} />
                ))}
              </ul>
            )
          ) : activityStatus === 'loading' || activityStatus === 'idle' ? (
            <p className="py-8 text-center text-sm text-faint">Loading…</p>
          ) : activity.length === 0 ? (
            <EmptyState
              icon={<IconReceipt2 className="size-7" stroke={1.75} />}
              title="No activity yet"
              description="Group actions — expenses, settlements, reminders — show up here."
            />
          ) : (
            <ul className="-mx-1">
              {activity.map((a) => {
                const actor = membersById[a.actor]
                return (
                  <li key={a.id} className="flex items-start gap-3 px-1 py-2.5">
                    {actor ? (
                      <Avatar name={actor.display_name} color={actor.avatar_color} size="sm" />
                    ) : (
                      <span className="squircle size-8 bg-elevated" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink">
                        <span className="font-medium">{actor?.display_name ?? 'Someone'}</span>{' '}
                        {a.summary}
                      </p>
                      <p className="text-xs text-faint">{formatTimestamp(a.created_at)}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </Modal>
    </>
  )
}

function NotificationItem({ n }: { n: AppNotification }) {
  const Icon = NOTIF_ICON[n.type] ?? IconBell
  return (
    <li className="flex items-start gap-3 px-1 py-2.5">
      <span
        className={cn(
          'squircle mt-0.5 grid size-8 shrink-0 place-items-center',
          n.read ? 'bg-elevated text-faint' : 'bg-accent/15 text-accent',
        )}
      >
        <Icon className="size-4" stroke={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm', n.read ? 'text-subtle' : 'text-ink')}>{n.message}</p>
        <p className="text-xs text-faint">{formatTimestamp(n.created_at)}</p>
      </div>
      {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" />}
    </li>
  )
}
