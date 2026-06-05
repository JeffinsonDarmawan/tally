import { useMemo, useState } from 'react'
import { IconRepeat, IconPlus } from '@tabler/icons-react'
import {
  Button,
  Card,
  CategoryTile,
  EmptyState,
  ErrorState,
  ListDivider,
  ListRow,
  LoadingRows,
} from '@/components/ui'
import { formatDate, formatMoney } from '@/lib/utils/format'
import { PageHeader } from '@/features/misc'
import { useGroup } from '@/features/group'
import { useCategories } from '@/features/categories'
import { useRecurring, toSchedule } from './useRecurring'
import { nextOccurrence } from './schedule'
import { PendingRecurring } from './PendingRecurring'
import { RecurringForm } from './RecurringForm'
import type { RecurringTemplate } from './api'

const FREQ_LABEL: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  yearly: 'Yearly',
}

export function RecurringPage() {
  const { group } = useGroup()
  const { categories } = useCategories(group?.id)
  const { templates, pending, status, reload } = useRecurring(group?.id)
  const categoriesById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories])

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<RecurringTemplate | null>(null)

  const openNew = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (t: RecurringTemplate) => {
    setEditing(t)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recurring"
        subtitle="Rent, utilities, subscriptions — confirmed before they post."
        action={
          <Button size="sm" leftIcon={<IconPlus className="size-4" stroke={2.5} />} onClick={openNew}>
            New
          </Button>
        }
      />

      <PendingRecurring pending={pending} onChanged={reload} />

      {status === 'loading' ? (
        <Card flush>
          <LoadingRows rows={3} />
        </Card>
      ) : status === 'error' ? (
        <ErrorState onRetry={() => void reload()} />
      ) : templates.length === 0 ? (
        <Card flush>
          <EmptyState
            icon={<IconRepeat className="size-7" stroke={1.75} />}
            title="No recurring payments"
            description="Set up templates for regular bills. Future periods never count toward balances until you confirm them."
            action={
              <Button size="sm" leftIcon={<IconPlus className="size-4" stroke={2.5} />} onClick={openNew}>
                New template
              </Button>
            }
          />
        </Card>
      ) : (
        <Card flush>
          {templates.map((t, i) => {
            const category = t.categoryId ? categoriesById[t.categoryId] : undefined
            const next = nextOccurrence(toSchedule(t))
            const amountLabel = t.amountMode === 'fixed' ? formatMoney(t.defaultAmount ?? 0) : 'Variable'
            return (
              <div key={t.id}>
                {i > 0 && <ListDivider />}
                <ListRow
                  onClick={() => openEdit(t)}
                  chevron
                  leading={<CategoryTile icon={category?.icon} color={category?.color} />}
                  title={t.name}
                  subtitle={`${FREQ_LABEL[t.frequency]} · ${next ? `next ${formatDate(next)}` : 'ended'}`}
                  trailing={
                    <span className="num text-[15px] font-semibold tabular-nums text-ink">{amountLabel}</span>
                  }
                />
              </div>
            )
          })}
        </Card>
      )}

      <RecurringForm
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
      />
    </div>
  )
}
