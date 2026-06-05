import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconArrowDownRight, IconArrowUpRight, IconClockExclamation, IconArrowRight } from '@tabler/icons-react'
import {
  Avatar,
  Button,
  Card,
  CategoryTile,
  EmptyState,
  ErrorState,
  ListDivider,
  ListRow,
  LoadingRows,
  SectionHeader,
  SegmentedControl,
  StatCard,
} from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { fromCents } from '@/lib/balance-engine'
import { formatDate, formatMoney, formatMoneyAbs } from '@/lib/utils/format'
import { useAuth } from '@/features/auth'
import { useGroup } from '@/features/group'
import { useCategories } from '@/features/categories'
import { useExpenseSheet } from '@/features/expenses'
import { useSettleSheet } from '@/features/settlements'
import { PendingRecurring, useRecurring } from '@/features/recurring'
import { useDashboard } from './useDashboard'
import type { ActivityItem, FriendBalance } from './summarize'

export function OverviewPage() {
  const { user } = useAuth()
  const { group, members, membersById } = useGroup()
  const me = user?.id ?? ''
  const memberIds = useMemo(() => members.map((m) => m.id), [members])
  const { categories } = useCategories(group?.id)
  const categoriesById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories])

  const { summary, status, error, reload } = useDashboard(group?.id, me, memberIds)
  const { pending, reload: reloadRecurring } = useRecurring(group?.id)
  const { openAdd, openEdit } = useExpenseSheet()
  const { openSettle } = useSettleSheet()
  const navigate = useNavigate()
  const [view, setView] = useState<'detailed' | 'simplified'>('detailed')

  if (status === 'loading' || !summary) {
    return (
      <div className="space-y-6">
        <div className="px-1 pt-2">
          <div className="h-3 w-20 animate-pulse rounded bg-elevated" />
          <div className="mt-3 h-12 w-44 animate-pulse rounded bg-elevated" />
        </div>
        <Card flush>
          <LoadingRows rows={4} />
        </Card>
      </div>
    )
  }

  if (status === 'error') {
    return <ErrorState description={error ?? undefined} onRetry={() => void reload()} />
  }

  const net = summary.overallNetCents
  const friendCount = Math.max(0, memberIds.length - 1)
  const heroColor = net > 0 ? 'text-owed' : net < 0 ? 'text-owe' : 'text-ink'
  const heroLabel =
    net > 0 ? "You're owed overall" : net < 0 ? 'You owe overall' : "You're all settled up"

  const sortedFriends = [...summary.perFriend].sort((a, b) => {
    const settledA = a.direction === 'settled' ? 1 : 0
    const settledB = b.direction === 'settled' ? 1 : 0
    if (settledA !== settledB) return settledA - settledB
    return Math.abs(b.netCents) - Math.abs(a.netCents)
  })

  return (
    <div className="space-y-6">
      {/* Net balance hero */}
      <header className="reveal px-1 pt-2">
        <p className="micro-label">Net balance</p>
        <div className={cn('figure-hero mt-2 text-6xl', heroColor)}>
          {formatMoney(fromCents(net), { signDisplay: net === 0 ? 'auto' : 'always' })}
        </div>
        <p className="mt-2 text-sm text-subtle">
          {heroLabel}
          {friendCount > 0 && ` · across ${friendCount} friend${friendCount === 1 ? '' : 's'}`}
        </p>
      </header>

      {/* Tinted stat cards */}
      <div className="reveal grid grid-cols-2 gap-3" style={{ animationDelay: '60ms' }}>
        <StatCard
          tone="owed"
          label="You're owed"
          value={formatMoneyAbs(fromCents(summary.totalOwedCents))}
          icon={<IconArrowDownRight className="size-4" stroke={2.5} />}
        />
        <StatCard
          tone="owe"
          label="You owe"
          value={formatMoneyAbs(fromCents(summary.totalOweCents))}
          icon={<IconArrowUpRight className="size-4" stroke={2.5} />}
        />
      </div>

      <StatCard
        className="reveal"
        style={{ animationDelay: '120ms' }}
        tone="neutral"
        label="Unpaid transactions"
        value={<span className="num">{summary.unpaidCount}</span>}
        hint={
          summary.oldestDaysUnpaid != null
            ? `Oldest is ${summary.oldestDaysUnpaid} day${summary.oldestDaysUnpaid === 1 ? '' : 's'} old`
            : 'Nothing outstanding'
        }
        icon={<IconClockExclamation className="size-4" stroke={2} />}
        onClick={() => navigate('/history')}
      />

      {/* Per-friend balances / simplified settle-up */}
      <section className="reveal" style={{ animationDelay: '160ms' }}>
        <SectionHeader
          action={
            friendCount > 0 ? (
              <SegmentedControl
                size="sm"
                aria-label="Balance view"
                value={view}
                onChange={setView}
                options={[
                  { value: 'detailed', label: 'Detailed' },
                  { value: 'simplified', label: 'Simplified' },
                ]}
              />
            ) : undefined
          }
        >
          Balances
        </SectionHeader>

        {view === 'detailed' ? (
          <Card flush>
            {sortedFriends.length === 0 ? (
              <EmptyState title="No friends yet" description="Add the others in Settings → Members." />
            ) : (
              sortedFriends.map((f, i) => {
                const member = membersById[f.friendId]
                if (!member) return null
                return (
                  <div key={f.friendId}>
                    {i > 0 && <ListDivider />}
                    <FriendRow
                      balance={f}
                      name={member.display_name}
                      color={member.avatar_color}
                      onClick={() =>
                        openSettle(
                          { friendId: f.friendId, netCents: f.netCents, daysUnpaid: f.daysUnpaid },
                          reload,
                        )
                      }
                    />
                  </div>
                )
              })
            )}
          </Card>
        ) : (
          <Card flush>
            {summary.simplified.length === 0 ? (
              <EmptyState title="All settled up" description="No transfers needed — everyone's even." />
            ) : (
              summary.simplified.map((t, i) => {
                const from = membersById[t.from]
                const to = membersById[t.to]
                if (!from || !to) return null
                const mine = t.from === me || t.to === me
                return (
                  <div key={`${t.from}-${t.to}-${i}`}>
                    {i > 0 && <ListDivider />}
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Avatar name={from.display_name} color={from.avatar_color} size="sm" />
                      <IconArrowRight className="size-4 text-faint" stroke={2} />
                      <Avatar name={to.display_name} color={to.avatar_color} size="sm" />
                      <span className={cn('flex-1 truncate text-sm', mine ? 'text-ink' : 'text-subtle')}>
                        {from.display_name} pays {to.display_name}
                      </span>
                      <span className="num text-[15px] font-semibold tabular-nums text-ink">
                        {formatMoney(fromCents(t.amountCents))}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </Card>
        )}
      </section>

      {/* Pending recurring prompts */}
      <PendingRecurring
        pending={pending}
        onChanged={() => {
          void reloadRecurring()
          void reload()
        }}
      />

      {/* This month's activity */}
      <section className="reveal" style={{ animationDelay: '200ms' }}>
        <SectionHeader>This month</SectionHeader>
        <Card flush>
          {summary.monthActivity.length === 0 ? (
            <EmptyState
              title="No activity this month"
              description="Add an expense and it’ll show up here."
              action={
                <Button size="sm" onClick={() => openAdd(reload)}>
                  Add expense
                </Button>
              }
            />
          ) : (
            summary.monthActivity.map((a, i) => (
              <div key={a.expenseId}>
                {i > 0 && <ListDivider />}
                <ActivityRow
                  item={a}
                  categoryName={a.categoryId ? categoriesById[a.categoryId]?.name : undefined}
                  categoryIcon={a.categoryId ? categoriesById[a.categoryId]?.icon : undefined}
                  categoryColor={a.categoryId ? categoriesById[a.categoryId]?.color : undefined}
                  payerName={a.paidBy ? membersById[a.paidBy]?.display_name : undefined}
                  onClick={() => openEdit(a.expenseId, reload)}
                />
              </div>
            ))
          )}
        </Card>
      </section>
    </div>
  )
}

function FriendRow({
  balance,
  name,
  color,
  onClick,
}: {
  balance: FriendBalance
  name: string
  color: string
  onClick: () => void
}) {
  const settled = balance.direction === 'settled'
  const theyOwe = balance.direction === 'they_owe'
  const subtitle = settled
    ? 'All settled up'
    : `${theyOwe ? 'owes you' : 'you owe'}${balance.daysUnpaid != null ? ` · ${balance.daysUnpaid}d unpaid` : ''}`
  return (
    <ListRow
      onClick={onClick}
      chevron
      leading={<Avatar name={name} color={color} />}
      title={name}
      subtitle={subtitle}
      trailing={
        <span
          className={cn(
            'num text-[15px] font-semibold tabular-nums',
            settled ? 'text-faint' : theyOwe ? 'text-owed' : 'text-owe',
          )}
        >
          {settled ? '—' : formatMoneyAbs(fromCents(balance.netCents))}
        </span>
      }
    />
  )
}

function ActivityRow({
  item,
  categoryName,
  categoryIcon,
  categoryColor,
  payerName,
  onClick,
}: {
  item: ActivityItem
  categoryName?: string
  categoryIcon?: string | null
  categoryColor?: string | null
  payerName?: string
  onClick: () => void
}) {
  const iFronted = item.myPaidCents > item.myShareCents
  const payerLabel = payerName
    ? `${payerName}${item.payerCount > 1 ? ` +${item.payerCount - 1}` : ''} paid`
    : 'Paid'
  return (
    <ListRow
      onClick={onClick}
      chevron
      leading={<CategoryTile icon={categoryIcon} color={categoryColor} />}
      title={categoryName ?? 'Expense'}
      subtitle={`${formatDate(item.date)} · ${payerLabel}`}
      trailing={
        <span className="flex flex-col items-end">
          <span className="num text-[15px] font-semibold tabular-nums text-ink">
            {formatMoney(fromCents(item.totalCents))}
          </span>
          <span className={cn('num text-xs tabular-nums', iFronted ? 'text-owed' : 'text-subtle')}>
            your share {formatMoneyAbs(fromCents(item.myShareCents))}
          </span>
        </span>
      }
    />
  )
}
