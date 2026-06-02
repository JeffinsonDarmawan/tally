import { useMemo } from 'react'
import { IconReceipt2, IconPlus } from '@tabler/icons-react'
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
import { useExpenseSheet, useGroupExpenses } from '@/features/expenses'

export function HistoryPage() {
  const { group, membersById } = useGroup()
  const { categories } = useCategories(group?.id)
  const { expenses, status, error, reload } = useGroupExpenses(group?.id)
  const { openAdd, openEdit } = useExpenseSheet()

  const categoriesById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories],
  )

  return (
    <div>
      <PageHeader
        title="History"
        subtitle="Every expense, newest first."
        action={
          <Button
            size="sm"
            leftIcon={<IconPlus className="size-4" stroke={2.5} />}
            onClick={() => openAdd(reload)}
          >
            Add
          </Button>
        }
      />

      <Card flush>
        {status === 'loading' ? (
          <LoadingRows rows={6} />
        ) : status === 'error' ? (
          <ErrorState description={error ?? undefined} onRetry={() => void reload()} />
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={<IconReceipt2 className="size-7" stroke={1.75} />}
            title="No expenses yet"
            description="Add your first expense and it’ll show up here. Search, filters, and bulk actions arrive in Phase 7."
            action={
              <Button size="sm" leftIcon={<IconPlus className="size-4" stroke={2.5} />} onClick={() => openAdd(reload)}>
                Add expense
              </Button>
            }
          />
        ) : (
          expenses.map((e, i) => {
            const category = e.category_id ? categoriesById[e.category_id] : undefined
            const payer = e.paid_by ? membersById[e.paid_by] : undefined
            const title = category?.name ?? e.note ?? 'Expense'
            return (
              <div key={e.id}>
                {i > 0 && <ListDivider />}
                <ListRow
                  onClick={() => openEdit(e.id, reload)}
                  chevron
                  leading={<CategoryTile icon={category?.icon} color={category?.color} />}
                  title={title}
                  subtitle={`${formatDate(e.date)}${payer ? ` · ${payer.display_name} paid` : ''}`}
                  trailing={
                    <span className="num text-[15px] font-semibold tabular-nums text-ink">
                      {formatMoney(e.total_amount)}
                    </span>
                  }
                />
              </div>
            )
          })
        )}
      </Card>
    </div>
  )
}
