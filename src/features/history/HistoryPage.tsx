import { useMemo, useState } from 'react'
import {
  IconReceipt2,
  IconSearch,
  IconAdjustmentsHorizontal,
  IconArrowsSort,
  IconChecks,
  IconTrash,
  IconCategory,
  IconX,
} from '@tabler/icons-react'
import {
  Button,
  Card,
  CategoryTile,
  EmptyState,
  ErrorState,
  ListDivider,
  LoadingRows,
  Modal,
} from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { fromCents } from '@/lib/balance-engine'
import { unpaidExpenseIds } from '@/lib/balance-engine'
import { formatDate, formatMoney } from '@/lib/utils/format'
import { PageHeader } from '@/features/misc'
import { useAuth } from '@/features/auth'
import { useGroup } from '@/features/group'
import { useCategories } from '@/features/categories'
import { useExpenseSheet } from '@/features/expenses'
import { useHistory } from './useHistory'
import { filterAndSort, hasActiveFilters, NO_FILTERS, type HistoryFilters, type HistoryRow, type HistorySort } from './filter'
import { FilterSheet } from './FilterSheet'
import { bulkDelete, bulkRecategorize } from './api'

export function HistoryPage() {
  const { user } = useAuth()
  const me = user?.id ?? ''
  const { group, membersById } = useGroup()
  const { categories } = useCategories(group?.id)
  const categoriesById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories])
  const { data, status, reload } = useHistory(group?.id)
  const { openEdit } = useExpenseSheet()

  const [filters, setFilters] = useState<HistoryFilters>(NO_FILTERS)
  const [sort, setSort] = useState<HistorySort>({ by: 'date', dir: 'desc' })
  const [filterOpen, setFilterOpen] = useState(false)

  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [recatOpen, setRecatOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [working, setWorking] = useState(false)

  const rows: HistoryRow[] = useMemo(() => {
    if (!data) return []
    const dated = data.expenses.map((e) => ({ id: e.id, date: e.date, paid: e.paid, owed: e.owed }))
    const unpaid = unpaidExpenseIds(me, dated, data.settlements)
    return data.expenses.map((e) => ({
      id: e.id,
      date: e.date,
      categoryId: e.categoryId,
      categoryName: (e.categoryId && categoriesById[e.categoryId]?.name) || 'Uncategorized',
      paidBy: e.paidBy,
      payerCount: e.payerCount,
      note: e.note,
      totalCents: e.totalCents,
      involved: Object.keys(e.owed),
      myShareCents: e.owed[me] ?? 0,
      unpaid: unpaid.has(e.id),
    }))
  }, [data, me, categoriesById])

  const visible = useMemo(() => filterAndSort(rows, filters, sort), [rows, filters, sort])

  const toggleSelect = (id: string) =>
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const exitSelect = () => {
    setSelectMode(false)
    setSelected(new Set())
  }

  async function applyRecategorize(categoryId: string | null) {
    setWorking(true)
    try {
      await bulkRecategorize([...selected], categoryId)
      setRecatOpen(false)
      exitSelect()
      await reload()
    } finally {
      setWorking(false)
    }
  }

  async function applyDelete() {
    if (!group) return
    setWorking(true)
    try {
      await bulkDelete([...selected], { groupId: group.id, actor: me })
      setConfirmDelete(false)
      exitSelect()
      await reload()
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="pb-16">
      <PageHeader
        title="History"
        subtitle="Every expense — search, filter, and tidy up."
        action={
          rows.length > 0 ? (
            <Button variant={selectMode ? 'primary' : 'secondary'} size="sm" onClick={selectMode ? exitSelect : () => setSelectMode(true)}>
              {selectMode ? 'Done' : 'Select'}
            </Button>
          ) : undefined
        }
      />

      {/* Toolbar */}
      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <IconSearch className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" stroke={2} />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search notes & categories…"
            aria-label="Search expenses"
            className="h-10 w-full rounded-xl border border-hairline bg-elevated pr-3 pl-9 text-sm text-ink placeholder:text-faint focus-visible:border-accent/50 focus-visible:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          aria-label="Filters"
          className={cn(
            'relative grid size-10 place-items-center rounded-xl border transition-colors',
            hasActiveFilters({ ...filters, search: '' })
              ? 'border-accent/40 bg-accent/10 text-accent'
              : 'border-hairline bg-elevated text-subtle hover:text-ink',
          )}
        >
          <IconAdjustmentsHorizontal className="size-5" stroke={2} />
        </button>
        <button
          type="button"
          onClick={() => setSort((s) => ({ by: s.by === 'date' ? 'amount' : 'date', dir: s.dir }))}
          aria-label={`Sort by ${sort.by === 'date' ? 'amount' : 'date'}`}
          className="grid h-10 items-center gap-1 rounded-xl border border-hairline bg-elevated px-3 text-xs font-medium text-subtle hover:text-ink"
        >
          <span className="flex items-center gap-1">
            <IconArrowsSort className="size-4" stroke={2} />
            {sort.by === 'date' ? 'Date' : 'Amount'}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setSort((s) => ({ ...s, dir: s.dir === 'desc' ? 'asc' : 'desc' }))}
          aria-label="Toggle sort direction"
          className="grid size-10 place-items-center rounded-xl border border-hairline bg-elevated text-sm text-subtle hover:text-ink"
        >
          {sort.dir === 'desc' ? '↓' : '↑'}
        </button>
      </div>

      <Card flush>
        {status === 'loading' ? (
          <LoadingRows rows={6} />
        ) : status === 'error' ? (
          <ErrorState onRetry={() => void reload()} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<IconReceipt2 className="size-7" stroke={1.75} />}
            title="No expenses yet"
            description="Add your first expense and it’ll show up here."
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<IconSearch className="size-7" stroke={1.75} />}
            title="No matches"
            description="Try clearing the search or filters."
            action={
              <Button variant="secondary" size="sm" onClick={() => setFilters(NO_FILTERS)}>
                Clear filters
              </Button>
            }
          />
        ) : (
          visible.map((row, i) => {
            const checked = selected.has(row.id)
            const payer = row.paidBy ? membersById[row.paidBy] : undefined
            return (
              <div key={row.id}>
                {i > 0 && <ListDivider />}
                <button
                  type="button"
                  onClick={() => (selectMode ? toggleSelect(row.id) : openEdit(row.id, reload))}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-elevated/50"
                >
                  {selectMode && (
                    <span
                      className={cn(
                        'grid size-5 shrink-0 place-items-center rounded-md border',
                        checked ? 'border-accent bg-accent text-[var(--color-base)]' : 'border-hairline',
                      )}
                    >
                      {checked && <IconChecks className="size-3.5" stroke={3} />}
                    </span>
                  )}
                  <CategoryTile icon={row.categoryId ? categoriesById[row.categoryId]?.icon : null} color={row.categoryId ? categoriesById[row.categoryId]?.color : null} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[15px] font-medium text-ink">{row.note || row.categoryName}</span>
                      {row.unpaid && <span className="size-1.5 shrink-0 rounded-full bg-owe" title="Outstanding" />}
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] text-subtle">
                      {formatDate(row.date)}
                      {payer && ` · ${payer.display_name}${row.payerCount > 1 ? ` +${row.payerCount - 1}` : ''} paid`}
                    </span>
                  </span>
                  <span className="num shrink-0 text-right text-[15px] font-semibold tabular-nums text-ink">
                    {formatMoney(fromCents(row.totalCents))}
                  </span>
                </button>
              </div>
            )
          })
        )}
      </Card>

      {/* Bulk action bar */}
      {selectMode && selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-base/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:pl-64">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <span className="text-sm font-medium text-ink">{selected.size} selected</span>
            <div className="flex-1" />
            <Button variant="secondary" size="sm" leftIcon={<IconCategory className="size-4" stroke={2} />} onClick={() => setRecatOpen(true)}>
              Recategorize
            </Button>
            <Button variant="danger" size="sm" leftIcon={<IconTrash className="size-4" stroke={2} />} onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          </div>
        </div>
      )}

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onApply={(next) => {
          setFilters(next)
          setFilterOpen(false)
        }}
        categories={categories}
        members={Object.values(membersById)}
      />

      {/* Recategorize modal */}
      <Modal open={recatOpen} onClose={() => setRecatOpen(false)} title={`Recategorize ${selected.size}`}>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={working}
              onClick={() => void applyRecategorize(c.id)}
              className="flex items-center gap-2 rounded-xl border border-hairline bg-elevated py-1.5 pr-3 pl-1.5 text-sm text-subtle transition-colors hover:text-ink disabled:opacity-50"
            >
              <CategoryTile icon={c.icon} color={c.color} size="sm" />
              {c.name}
            </button>
          ))}
        </div>
      </Modal>

      {/* Delete confirm */}
      {confirmDelete && (
        <Modal
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          title={`Delete ${selected.size} expense${selected.size === 1 ? '' : 's'}?`}
          footer={
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setConfirmDelete(false)} disabled={working}>
                Cancel
              </Button>
              <Button variant="danger" fullWidth onClick={() => void applyDelete()} disabled={working}>
                {working ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          }
        >
          <p className="flex items-start gap-2 text-sm text-subtle">
            <IconX className="mt-0.5 size-4 shrink-0 text-owe" stroke={2} />
            This removes them for everyone and recomputes balances. Others will see it in the activity feed.
          </p>
        </Modal>
      )}
    </div>
  )
}
