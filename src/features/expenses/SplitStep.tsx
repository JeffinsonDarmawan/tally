import { IconPlus, IconTrash } from '@tabler/icons-react'
import { Avatar, Button, Input, MoneyInput, SegmentedControl } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { formatMoney, parseMoney } from '@/lib/utils/format'
import type { Profile, SplitMethod } from '@/types/database.types'
import type { ChargeRow, FormState, ItemRow } from './formState'
import { effectiveTotal } from './formState'
import { RemainingPill } from './ExpenseSteps'

type SetForm = (patch: Partial<FormState>) => void

const MODES: { value: SplitMethod; label: string }[] = [
  { value: 'equal', label: 'Equal' },
  { value: 'by_item', label: 'Items' },
  { value: 'uneven', label: 'Uneven' },
  { value: 'shares', label: 'Shares' },
  { value: 'percentage', label: '%' },
]

function uuid(): string {
  return crypto.randomUUID()
}

export function SplitStep({
  form,
  set,
  members,
  preview,
}: {
  form: FormState
  set: SetForm
  members: Profile[]
  preview: Record<string, number>
}) {
  const involved = members.filter((m) => form.involved.includes(m.id))
  const total = effectiveTotal(form)

  return (
    <div className="space-y-5">
      <SegmentedControl
        aria-label="Split method"
        fullWidth
        size="sm"
        value={form.method}
        onChange={(m) => set({ method: m })}
        options={MODES}
      />

      {form.involved.length === 0 ? (
        <p className="text-sm text-owe">Go back and select who's involved first.</p>
      ) : form.method === 'equal' ? (
        <PreviewList involved={involved} preview={preview} />
      ) : form.method === 'uneven' ? (
        <UnevenEditor form={form} set={set} involved={involved} total={total} />
      ) : form.method === 'shares' ? (
        <SharesEditor form={form} set={set} involved={involved} preview={preview} />
      ) : form.method === 'percentage' ? (
        <PercentageEditor form={form} set={set} involved={involved} preview={preview} />
      ) : (
        <ByItemEditor form={form} set={set} involved={involved} />
      )}
    </div>
  )
}

function PreviewRow({ member, amount }: { member: Profile; amount: number }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <Avatar name={member.display_name} color={member.avatar_color} size="sm" />
      <span className="flex-1 truncate text-sm text-ink">{member.display_name}</span>
      <span className="num text-sm font-semibold tabular-nums text-ink">{formatMoney(amount)}</span>
    </div>
  )
}

function PreviewList({ involved, preview }: { involved: Profile[]; preview: Record<string, number> }) {
  return (
    <div>
      <p className="micro-label mb-1 px-1">Each person owes</p>
      <div className="divide-y divide-hairline rounded-card border border-hairline bg-surface px-3">
        {involved.map((m) => (
          <PreviewRow key={m.id} member={m} amount={preview[m.id] ?? 0} />
        ))}
      </div>
    </div>
  )
}

function UnevenEditor({
  form,
  set,
  involved,
  total,
}: {
  form: FormState
  set: SetForm
  involved: Profile[]
  total: number
}) {
  const sum = involved.reduce((s, m) => s + parseMoney(form.uneven[m.id] ?? ''), 0)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="micro-label">Exact amounts</span>
        <RemainingPill remaining={total - sum} />
      </div>
      {involved.map((m) => (
        <div key={m.id} className="flex items-center gap-3">
          <Avatar name={m.display_name} color={m.avatar_color} size="sm" />
          <span className="flex-1 truncate text-sm text-ink">{m.display_name}</span>
          <div className="w-28">
            <MoneyInput
              value={form.uneven[m.id] ?? ''}
              onChange={(e) => set({ uneven: { ...form.uneven, [m.id]: e.target.value } })}
              aria-label={`Amount for ${m.display_name}`}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function SharesEditor({
  form,
  set,
  involved,
  preview,
}: {
  form: FormState
  set: SetForm
  involved: Profile[]
  preview: Record<string, number>
}) {
  return (
    <div className="space-y-2">
      <p className="micro-label px-1">Weight per person</p>
      {involved.map((m) => (
        <div key={m.id} className="flex items-center gap-3">
          <Avatar name={m.display_name} color={m.avatar_color} size="sm" />
          <span className="flex-1 truncate text-sm text-ink">{m.display_name}</span>
          <span className="num w-16 text-right text-sm tabular-nums text-subtle">
            {formatMoney(preview[m.id] ?? 0)}
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={form.weights[m.id] ?? ''}
            onChange={(e) => set({ weights: { ...form.weights, [m.id]: e.target.value } })}
            aria-label={`Shares for ${m.display_name}`}
            className="num h-10 w-14 rounded-xl border border-hairline bg-elevated text-center text-sm tabular-nums text-ink focus-visible:border-accent/60 focus-visible:outline-none"
          />
        </div>
      ))}
    </div>
  )
}

function PercentageEditor({
  form,
  set,
  involved,
  preview,
}: {
  form: FormState
  set: SetForm
  involved: Profile[]
  preview: Record<string, number>
}) {
  const sum = involved.reduce((s, m) => s + parseMoney(form.percentages[m.id] ?? ''), 0)
  const settled = Math.round(sum * 100) === 10000
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="micro-label">Percentage per person</span>
        <span
          className={cn(
            'num rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
            settled ? 'bg-owed-soft text-owed' : 'bg-owe-soft text-owe',
          )}
        >
          {sum.toFixed(0)}% / 100%
        </span>
      </div>
      {involved.map((m) => (
        <div key={m.id} className="flex items-center gap-3">
          <Avatar name={m.display_name} color={m.avatar_color} size="sm" />
          <span className="flex-1 truncate text-sm text-ink">{m.display_name}</span>
          <span className="num w-16 text-right text-sm tabular-nums text-subtle">
            {formatMoney(preview[m.id] ?? 0)}
          </span>
          <div className="relative w-20">
            <input
              type="text"
              inputMode="decimal"
              value={form.percentages[m.id] ?? ''}
              onChange={(e) => set({ percentages: { ...form.percentages, [m.id]: e.target.value } })}
              aria-label={`Percentage for ${m.display_name}`}
              className="num h-10 w-full rounded-xl border border-hairline bg-elevated pr-6 text-center text-sm tabular-nums text-ink focus-visible:border-accent/60 focus-visible:outline-none"
            />
            <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs text-faint">
              %
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function ByItemEditor({
  form,
  set,
  involved,
}: {
  form: FormState
  set: SetForm
  involved: Profile[]
}) {
  const updateItem = (id: string, patch: Partial<ItemRow>) =>
    set({ items: form.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) })
  const addItem = () =>
    set({ items: [...form.items, { id: uuid(), name: '', amount: '', sharers: form.involved }] })
  const removeItem = (id: string) => set({ items: form.items.filter((it) => it.id !== id) })
  const toggleSharer = (item: ItemRow, userId: string) => {
    const has = item.sharers.includes(userId)
    updateItem(item.id, {
      sharers: has ? item.sharers.filter((u) => u !== userId) : [...item.sharers, userId],
    })
  }

  const updateCharge = (id: string, patch: Partial<ChargeRow>) =>
    set({ charges: form.charges.map((c) => (c.id === id ? { ...c, ...patch } : c)) })
  const addCharge = () =>
    set({ charges: [...form.charges, { id: uuid(), label: '', amount: '', mode: 'proportional' }] })
  const removeCharge = (id: string) => set({ charges: form.charges.filter((c) => c.id !== id) })

  const total = effectiveTotal(form)

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {form.items.map((item) => (
          <div key={item.id} className="rounded-card border border-hairline bg-surface p-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Item name"
                value={item.name}
                onChange={(e) => updateItem(item.id, { name: e.target.value })}
                aria-label="Item name"
                className="flex-1"
              />
              <div className="w-24">
                <MoneyInput
                  value={item.amount}
                  onChange={(e) => updateItem(item.id, { amount: e.target.value })}
                  aria-label="Item amount"
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                aria-label="Remove item"
                className="grid size-8 shrink-0 place-items-center rounded-lg text-faint hover:bg-owe-soft hover:text-owe"
              >
                <IconTrash className="size-4" stroke={2} />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {involved.map((m) => {
                const on = item.sharers.includes(m.id)
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleSharer(item, m.id)}
                    aria-pressed={on}
                    title={m.display_name}
                    className={cn(
                      'rounded-full p-0.5 transition-opacity',
                      on ? 'opacity-100 ring-2 ring-accent/60' : 'opacity-35 hover:opacity-70',
                    )}
                  >
                    <Avatar name={m.display_name} color={m.avatar_color} size="xs" />
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          leftIcon={<IconPlus className="size-4" stroke={2.5} />}
          onClick={addItem}
        >
          Add item
        </Button>
      </div>

      <div className="space-y-2">
        <p className="micro-label px-1">Tax / tip / service</p>
        {form.charges.map((charge) => (
          <div key={charge.id} className="flex items-center gap-2">
            <Input
              placeholder="e.g. GST"
              value={charge.label}
              onChange={(e) => updateCharge(charge.id, { label: e.target.value })}
              aria-label="Charge label"
              className="flex-1"
            />
            <div className="w-20">
              <MoneyInput
                value={charge.amount}
                onChange={(e) => updateCharge(charge.id, { amount: e.target.value })}
                aria-label="Charge amount"
              />
            </div>
            <SegmentedControl
              size="sm"
              aria-label="Allocation"
              value={charge.mode}
              onChange={(mode) => updateCharge(charge.id, { mode })}
              options={[
                { value: 'proportional', label: 'Prop.' },
                { value: 'equal', label: 'Equal' },
              ]}
            />
            <button
              type="button"
              onClick={() => removeCharge(charge.id)}
              aria-label="Remove charge"
              className="grid size-8 shrink-0 place-items-center rounded-lg text-faint hover:bg-owe-soft hover:text-owe"
            >
              <IconTrash className="size-4" stroke={2} />
            </button>
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<IconPlus className="size-4" stroke={2.5} />}
          onClick={addCharge}
        >
          Add charge
        </Button>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-elevated px-3 py-2">
        <span className="text-sm text-subtle">Total from items</span>
        <span className="num text-base font-bold tabular-nums text-ink">{formatMoney(total)}</span>
      </div>
    </div>
  )
}
