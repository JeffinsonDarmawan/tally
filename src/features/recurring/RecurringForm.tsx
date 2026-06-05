import { useEffect, useState } from 'react'
import { IconTrash } from '@tabler/icons-react'
import {
  Avatar,
  Button,
  CategoryTile,
  ConfirmDialog,
  Field,
  Input,
  Modal,
  MoneyInput,
  SegmentedControl,
} from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { TIME_ZONE } from '@/config'
import { dateInTimeZone } from '@/lib/balance-engine'
import { parseMoney } from '@/lib/utils/format'
import { useAuth } from '@/features/auth'
import { useGroup } from '@/features/group'
import { useCategories } from '@/features/categories'
import { createTemplate, updateTemplate, deleteTemplate, type RecurringTemplate, type TemplateInput } from './api'
import type { Frequency } from './schedule'

type Method = 'equal' | 'shares' | 'percentage'

interface RForm {
  name: string
  categoryId: string | null
  paidBy: string
  frequency: Frequency
  amountMode: 'fixed' | 'variable'
  defaultAmount: string
  startDate: string
  endDate: string
  anchorDay: string
  involved: string[]
  method: Method
  weights: Record<string, string>
  percentages: Record<string, string>
}

function emptyForm(memberIds: string[], me: string, today: string): RForm {
  return {
    name: '',
    categoryId: null,
    paidBy: me,
    frequency: 'monthly',
    amountMode: 'fixed',
    defaultAmount: '',
    startDate: today,
    endDate: '',
    anchorDay: '',
    involved: [...memberIds],
    method: 'equal',
    weights: Object.fromEntries(memberIds.map((id) => [id, '1'])),
    percentages: {},
  }
}

function fromTemplate(t: RecurringTemplate, memberIds: string[]): RForm {
  return {
    name: t.name,
    categoryId: t.categoryId,
    paidBy: t.paidBy,
    frequency: t.frequency,
    amountMode: t.amountMode,
    defaultAmount: t.defaultAmount != null ? String(t.defaultAmount) : '',
    startDate: t.startDate,
    endDate: t.endDate ?? '',
    anchorDay: t.anchorDay != null ? String(t.anchorDay) : '',
    involved: t.split.involved.length ? t.split.involved : [...memberIds],
    method: t.split.method,
    weights: t.split.weights
      ? Object.fromEntries(Object.entries(t.split.weights).map(([k, v]) => [k, String(v)]))
      : Object.fromEntries(memberIds.map((id) => [id, '1'])),
    percentages: t.split.percentages
      ? Object.fromEntries(Object.entries(t.split.percentages).map(([k, v]) => [k, String(v)]))
      : {},
  }
}

export function RecurringForm({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean
  editing: RecurringTemplate | null
  onClose: () => void
  onSaved: () => void
}) {
  const { user } = useAuth()
  const { group, members } = useGroup()
  const { categories } = useCategories(group?.id)
  const me = user?.id ?? ''
  const memberIds = members.map((m) => m.id)

  const [form, setForm] = useState<RForm>(() => emptyForm(memberIds, me, '2026-01-01'))
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const set = (patch: Partial<RForm>) => setForm((f) => ({ ...f, ...patch }))

  useEffect(() => {
    if (!open) return
    setErrors([])
    const today = dateInTimeZone(new Date(), TIME_ZONE)
    setForm(editing ? fromTemplate(editing, memberIds) : emptyForm(memberIds, me, today))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing])

  const involvedMembers = members.filter((m) => form.involved.includes(m.id))

  function validate(): TemplateInput | null {
    const errs: string[] = []
    if (!form.name.trim()) errs.push('Give the template a name.')
    if (form.involved.length === 0) errs.push('Select at least one person involved.')
    if (form.amountMode === 'fixed' && parseMoney(form.defaultAmount) <= 0) {
      errs.push('Fixed templates need a default amount.')
    }
    if (form.method === 'percentage') {
      const sum = form.involved.reduce((s, u) => s + parseMoney(form.percentages[u] ?? '0'), 0)
      if (Math.round(sum * 100) !== 10000) errs.push('Percentages must add up to 100%.')
    }
    if (form.method === 'shares') {
      const sum = form.involved.reduce((s, u) => s + Math.floor(parseMoney(form.weights[u] ?? '0')), 0)
      if (sum <= 0) errs.push('Assign at least one share.')
    }
    if (errs.length) {
      setErrors(errs)
      return null
    }
    const split = {
      involved: form.involved,
      method: form.method,
      weights:
        form.method === 'shares'
          ? Object.fromEntries(form.involved.map((u) => [u, Math.floor(parseMoney(form.weights[u] ?? '0'))]))
          : undefined,
      percentages:
        form.method === 'percentage'
          ? Object.fromEntries(form.involved.map((u) => [u, parseMoney(form.percentages[u] ?? '0')]))
          : undefined,
    }
    return {
      name: form.name.trim(),
      categoryId: form.categoryId,
      paidBy: form.paidBy,
      frequency: form.frequency,
      amountMode: form.amountMode,
      defaultAmount: parseMoney(form.defaultAmount) > 0 ? parseMoney(form.defaultAmount) : null,
      split,
      anchorDay: form.frequency === 'monthly' && form.anchorDay ? Number(form.anchorDay) : null,
      startDate: form.startDate,
      endDate: form.endDate || null,
      active: true,
    }
  }

  async function handleSave() {
    const input = validate()
    if (!input || !group) return
    setSaving(true)
    try {
      if (editing) await updateTemplate(editing.id, input)
      else await createTemplate(group.id, input)
      onSaved()
      onClose()
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Could not save the template.'])
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!editing) return
    await deleteTemplate(editing.id)
    onSaved()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit template' : 'New recurring'}
      footer={
        <div className="space-y-2">
          {errors.map((e, i) => (
            <p key={i} className="text-xs text-owe" role="alert">
              {e}
            </p>
          ))}
          <div className="flex gap-3">
            {editing && (
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                <IconTrash className="size-4" stroke={2} />
              </Button>
            )}
            <Button fullWidth onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create template'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <Field label="Name" htmlFor="rt-name">
          <Input
            id="rt-name"
            placeholder="e.g. Rent, Internet"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </Field>

        <Field label="Category">
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
                    active ? 'border-accent/40 bg-accent/10 text-ink' : 'border-hairline bg-elevated text-subtle hover:text-ink',
                  )}
                >
                  <CategoryTile icon={c.icon} color={c.color} size="sm" />
                  {c.name}
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Frequency">
          <SegmentedControl
            fullWidth
            size="sm"
            aria-label="Frequency"
            value={form.frequency}
            onChange={(frequency) => set({ frequency })}
            options={[
              { value: 'weekly', label: 'Weekly' },
              { value: 'biweekly', label: '2-weekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly' },
            ]}
          />
        </Field>

        <Field label="Amount">
          <SegmentedControl
            fullWidth
            size="sm"
            aria-label="Amount mode"
            value={form.amountMode}
            onChange={(amountMode) => set({ amountMode })}
            options={[
              { value: 'fixed', label: 'Fixed' },
              { value: 'variable', label: 'Variable' },
            ]}
          />
          <div className="mt-2">
            <MoneyInput
              value={form.defaultAmount}
              onChange={(e) => set({ defaultAmount: e.target.value })}
              aria-label={form.amountMode === 'fixed' ? 'Amount' : 'Typical amount'}
            />
            <p className="mt-1 text-xs text-faint">
              {form.amountMode === 'fixed'
                ? 'Charged each period (confirm before it posts).'
                : 'Optional typical amount — you enter the real figure when it comes due.'}
            </p>
          </div>
        </Field>

        <Field label="Paid by">
          <div className="flex flex-wrap gap-2">
            {members.map((m) => {
              const active = form.paidBy === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => set({ paidBy: m.id })}
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
        </Field>

        <div className="flex gap-3">
          <Field label="Starts" htmlFor="rt-start" className="flex-1">
            <Input id="rt-start" type="date" value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} />
          </Field>
          <Field label="Ends (optional)" htmlFor="rt-end" className="flex-1">
            <Input id="rt-end" type="date" value={form.endDate} onChange={(e) => set({ endDate: e.target.value })} />
          </Field>
        </div>

        {form.frequency === 'monthly' && (
          <Field label="Day of month (optional)" htmlFor="rt-anchor" hint="Defaults to the start day; clamps to short months.">
            <Input
              id="rt-anchor"
              inputMode="numeric"
              placeholder="e.g. 1"
              value={form.anchorDay}
              onChange={(e) => set({ anchorDay: e.target.value.replace(/[^0-9]/g, '').slice(0, 2) })}
            />
          </Field>
        )}

        {/* Involved + split */}
        <Field label="Split between">
          <div className="flex flex-wrap gap-2">
            {members.map((m) => {
              const active = form.involved.includes(m.id)
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    set({
                      involved: active ? form.involved.filter((u) => u !== m.id) : [...form.involved, m.id],
                    })
                  }
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
        </Field>

        <SegmentedControl
          fullWidth
          size="sm"
          aria-label="Split method"
          value={form.method}
          onChange={(method) => set({ method })}
          options={[
            { value: 'equal', label: 'Equal' },
            { value: 'shares', label: 'Shares' },
            { value: 'percentage', label: '%' },
          ]}
        />

        {form.method !== 'equal' && (
          <div className="space-y-2">
            {involvedMembers.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <Avatar name={m.display_name} color={m.avatar_color} size="sm" />
                <span className="flex-1 truncate text-sm text-ink">{m.display_name}</span>
                <input
                  type="text"
                  inputMode={form.method === 'percentage' ? 'decimal' : 'numeric'}
                  value={form.method === 'shares' ? (form.weights[m.id] ?? '') : (form.percentages[m.id] ?? '')}
                  onChange={(e) =>
                    form.method === 'shares'
                      ? set({ weights: { ...form.weights, [m.id]: e.target.value } })
                      : set({ percentages: { ...form.percentages, [m.id]: e.target.value } })
                  }
                  aria-label={`${form.method === 'shares' ? 'Shares' : 'Percentage'} for ${m.display_name}`}
                  className="num h-10 w-16 rounded-xl border border-hairline bg-elevated text-center text-sm tabular-nums text-ink focus-visible:border-accent/60 focus-visible:outline-none"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete this template?"
        message="Future periods won't be prompted. Already-posted expenses stay."
        confirmLabel="Delete"
        danger
      />
    </Modal>
  )
}
