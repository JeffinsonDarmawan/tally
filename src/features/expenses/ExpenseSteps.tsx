import { IconPaperclip, IconX } from '@tabler/icons-react'
import {
  Avatar,
  CategoryTile,
  Field,
  Input,
  MoneyInput,
  Toggle,
} from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { formatMoney, parseMoney } from '@/lib/utils/format'
import type { Category, Profile } from '@/types/database.types'
import type { FormState } from './formState'
import { effectiveTotal } from './formState'

type SetForm = (patch: Partial<FormState>) => void

/** Green when fully allocated, coral otherwise. */
export function RemainingPill({ remaining }: { remaining: number }) {
  const settled = Math.abs(remaining) < 0.005
  return (
    <span
      className={cn(
        'num rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
        settled ? 'bg-owed-soft text-owed' : 'bg-owe-soft text-owe',
      )}
    >
      {settled ? 'All set' : `${formatMoney(remaining)} left`}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Step 1 — Basics
// ---------------------------------------------------------------------------
export function BasicsStep({
  form,
  set,
  categories,
  receiptName,
  onPickReceipt,
  onClearReceipt,
}: {
  form: FormState
  set: SetForm
  categories: Category[]
  receiptName: string | null
  onPickReceipt: (file: File) => void
  onClearReceipt: () => void
}) {
  return (
    <div className="space-y-5">
      <Field label="Date" htmlFor="exp-date">
        <Input
          id="exp-date"
          type="date"
          value={form.date}
          onChange={(e) => set({ date: e.target.value })}
        />
      </Field>

      {form.method !== 'by_item' && (
        <Field label="Total">
          <MoneyInput
            large
            value={form.total}
            onChange={(e) => set({ total: e.target.value })}
            aria-label="Total amount"
          />
        </Field>
      )}

      <Field label="Category">
        {categories.length === 0 ? (
          <p className="text-sm text-faint">No categories yet — add some in Settings.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const active = form.categoryId === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => set({ categoryId: active ? null : c.id })}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border py-1.5 pr-3 pl-1.5 text-sm transition-colors',
                    active
                      ? 'border-accent/40 bg-accent/10 text-ink'
                      : 'border-hairline bg-elevated text-subtle hover:text-ink',
                  )}
                >
                  <CategoryTile icon={c.icon} color={c.color} size="sm" />
                  {c.name}
                </button>
              )
            })}
          </div>
        )}
      </Field>

      <Field label="Note" htmlFor="exp-note">
        <Input
          id="exp-note"
          placeholder="optional"
          value={form.note}
          onChange={(e) => set({ note: e.target.value })}
        />
      </Field>

      <Field label="Receipt">
        {receiptName ? (
          <div className="flex items-center gap-2 rounded-xl border border-hairline bg-elevated px-3 py-2 text-sm">
            <IconPaperclip className="size-4 text-faint" stroke={2} />
            <span className="flex-1 truncate text-ink">{receiptName}</span>
            <button
              type="button"
              onClick={onClearReceipt}
              aria-label="Remove receipt"
              className="grid size-6 place-items-center rounded-lg text-faint hover:bg-surface hover:text-ink"
            >
              <IconX className="size-4" stroke={2} />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-hairline bg-elevated px-3 py-2.5 text-sm text-subtle transition-colors hover:text-ink">
            <IconPaperclip className="size-4" stroke={2} />
            Attach a photo (optional)
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onPickReceipt(file)
                e.target.value = ''
              }}
            />
          </label>
        )}
      </Field>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 2 — Who paid
// ---------------------------------------------------------------------------
export function PayersStep({ form, set, members }: { form: FormState; set: SetForm; members: Profile[] }) {
  const total = effectiveTotal(form)
  const paid = Object.values(form.payerAmounts).reduce((s, a) => s + parseMoney(a), 0)
  const remaining = total - paid

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">Who paid?</p>
        <label className="flex items-center gap-2 text-sm text-subtle">
          Split the payment
          <Toggle
            checked={form.multiPayer}
            onChange={(v) => set({ multiPayer: v })}
            label="Split the payment between multiple payers"
          />
        </label>
      </div>

      {!form.multiPayer ? (
        <div className="flex flex-wrap gap-2">
          {members.map((m) => {
            const active = form.singlePayerId === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => set({ singlePayerId: m.id })}
                className={cn(
                  'flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm transition-colors',
                  active ? 'bg-accent/15 text-ink ring-1 ring-accent/40' : 'bg-elevated text-subtle ring-1 ring-hairline hover:text-ink',
                )}
              >
                <Avatar name={m.display_name} color={m.avatar_color} size="xs" />
                {m.display_name}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="micro-label">Contributions</span>
            <RemainingPill remaining={remaining} />
          </div>
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3">
              <Avatar name={m.display_name} color={m.avatar_color} size="sm" />
              <span className="flex-1 truncate text-sm text-ink">{m.display_name}</span>
              <div className="w-28">
                <MoneyInput
                  value={form.payerAmounts[m.id] ?? ''}
                  onChange={(e) => set({ payerAmounts: { ...form.payerAmounts, [m.id]: e.target.value } })}
                  aria-label={`Amount paid by ${m.display_name}`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 3 — Who's involved
// ---------------------------------------------------------------------------
export function InvolvedStep({ form, set, members }: { form: FormState; set: SetForm; members: Profile[] }) {
  const toggle = (id: string) => {
    const has = form.involved.includes(id)
    const next = has ? form.involved.filter((u) => u !== id) : [...form.involved, id]
    set({ involved: next })
  }
  const allIds = members.map((m) => m.id)
  const allSelected = allIds.every((id) => form.involved.includes(id))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">Who shares this expense?</p>
        <button
          type="button"
          onClick={() => set({ involved: allSelected ? [] : allIds })}
          className="text-sm font-medium text-accent hover:brightness-110"
        >
          {allSelected ? 'Clear all' : 'Select all'}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {members.map((m) => {
          const active = form.involved.includes(m.id)
          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(m.id)}
              className={cn(
                'flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm font-medium transition-colors',
                active ? 'bg-accent/15 text-ink ring-1 ring-accent/40' : 'bg-elevated text-subtle ring-1 ring-hairline hover:text-ink',
              )}
            >
              <Avatar name={m.display_name} color={m.avatar_color} size="xs" />
              {m.display_name}
            </button>
          )
        })}
      </div>
      {form.involved.length === 0 && (
        <p className="text-xs text-owe">Select at least one person.</p>
      )}
    </div>
  )
}
