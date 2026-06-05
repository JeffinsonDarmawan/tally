import { useEffect, useState, type ReactNode } from 'react'
import { Avatar, Button, CategoryTile, Field, Input, Modal, MoneyInput, SegmentedControl } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { parseMoney } from '@/lib/utils/format'
import { toCents, fromCents } from '@/lib/balance-engine'
import type { Category, Profile } from '@/types/database.types'
import { NO_FILTERS, type HistoryFilters } from './filter'

export function FilterSheet({
  open,
  onClose,
  filters,
  onApply,
  categories,
  members,
}: {
  open: boolean
  onClose: () => void
  filters: HistoryFilters
  onApply: (next: HistoryFilters) => void
  categories: Category[]
  members: Profile[]
}) {
  const [draft, setDraft] = useState<HistoryFilters>(filters)
  useEffect(() => {
    if (open) setDraft(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const set = (patch: Partial<HistoryFilters>) => setDraft((d) => ({ ...d, ...patch }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Filters"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDraft({ ...NO_FILTERS, search: draft.search })}>
            Clear
          </Button>
          <Button fullWidth onClick={() => onApply(draft)}>
            Apply
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <Field label="Status">
          <SegmentedControl
            fullWidth
            size="sm"
            aria-label="Status"
            value={draft.status}
            onChange={(status) => set({ status })}
            options={[
              { value: 'all', label: 'All' },
              { value: 'outstanding', label: 'Outstanding' },
              { value: 'settled', label: 'Settled' },
            ]}
          />
        </Field>

        <Field label="Category">
          <div className="flex flex-wrap gap-2">
            <Pill active={draft.categoryId === null} onClick={() => set({ categoryId: null })}>
              All
            </Pill>
            {categories.map((c) => (
              <Pill key={c.id} active={draft.categoryId === c.id} onClick={() => set({ categoryId: c.id })}>
                <CategoryTile icon={c.icon} color={c.color} size="sm" />
                {c.name}
              </Pill>
            ))}
          </div>
        </Field>

        <Field label="Member">
          <div className="flex flex-wrap gap-2">
            <Pill active={draft.memberId === null} onClick={() => set({ memberId: null })}>
              Anyone
            </Pill>
            {members.map((m) => (
              <Pill key={m.id} active={draft.memberId === m.id} onClick={() => set({ memberId: m.id })}>
                <Avatar name={m.display_name} color={m.avatar_color} size="xs" />
                {m.display_name}
              </Pill>
            ))}
          </div>
        </Field>

        <div className="flex gap-3">
          <Field label="From" htmlFor="f-from" className="flex-1">
            <Input id="f-from" type="date" value={draft.from ?? ''} onChange={(e) => set({ from: e.target.value || null })} />
          </Field>
          <Field label="To" htmlFor="f-to" className="flex-1">
            <Input id="f-to" type="date" value={draft.to ?? ''} onChange={(e) => set({ to: e.target.value || null })} />
          </Field>
        </div>

        <div className="flex gap-3">
          <Field label="Min amount" className="flex-1">
            <MoneyInput
              value={draft.minCents != null ? String(fromCents(draft.minCents)) : ''}
              onChange={(e) => set({ minCents: e.target.value ? toCents(parseMoney(e.target.value)) : null })}
              aria-label="Minimum amount"
            />
          </Field>
          <Field label="Max amount" className="flex-1">
            <MoneyInput
              value={draft.maxCents != null ? String(fromCents(draft.maxCents)) : ''}
              onChange={(e) => set({ maxCents: e.target.value ? toCents(parseMoney(e.target.value)) : null })}
              aria-label="Maximum amount"
            />
          </Field>
        </div>
      </div>
    </Modal>
  )
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex items-center gap-2 rounded-full py-1 pr-3 pl-1.5 text-sm transition-colors',
        active ? 'bg-accent/15 text-ink ring-1 ring-accent/40' : 'bg-elevated text-subtle ring-1 ring-hairline hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}
