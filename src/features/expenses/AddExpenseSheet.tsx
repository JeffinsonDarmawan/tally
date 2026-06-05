import { useEffect, useMemo, useState } from 'react'
import { IconTrash, IconChevronLeft, IconLoader2 } from '@tabler/icons-react'
import { Button, Modal, ConfirmDialog } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { TIME_ZONE } from '@/config'
import { dateInTimeZone } from '@/lib/balance-engine'
import { useAuth } from '@/features/auth'
import { useGroup } from '@/features/group'
import { useCategories } from '@/features/categories'
import { buildExpense, previewShares, type ExpenseDraft } from './build'
import { emptyForm, draftToForm, formToDraft, type FormState } from './formState'
import { BasicsStep, PayersStep, InvolvedStep } from './ExpenseSteps'
import { SplitStep } from './SplitStep'
import { createExpense, updateExpense, deleteExpense, fetchExpenseForEdit } from './api'

const STEPS = ['Basics', 'Who paid', 'Involved', 'Split'] as const

export interface AddExpenseSheetProps {
  open: boolean
  onClose: () => void
  onSaved?: () => void
  editId?: string | null
}

export function AddExpenseSheet({ open, onClose, onSaved, editId }: AddExpenseSheetProps) {
  const { user } = useAuth()
  const { group, members } = useGroup()
  const { categories } = useCategories(group?.id)
  const me = user?.id ?? ''
  const memberIds = useMemo(() => members.map((m) => m.id), [members])

  const [form, setForm] = useState<FormState>(() => emptyForm(memberIds, me, '2026-01-01'))
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // (Re)initialise whenever the sheet opens.
  useEffect(() => {
    if (!open) return
    setStep(0)
    setErrors([])
    if (editId) {
      setLoadingEdit(true)
      fetchExpenseForEdit(editId)
        .then((draft) => setForm(draftToForm(draft, me)))
        .catch(() => setErrors(['Could not load this expense.']))
        .finally(() => setLoadingEdit(false))
    } else {
      const today = dateInTimeZone(new Date(), TIME_ZONE)
      setForm(emptyForm(memberIds, me, today))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editId])

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }))

  const draft: ExpenseDraft = useMemo(() => formToDraft(form), [form])
  const preview = useMemo(() => previewShares(draft), [draft])

  async function handleSave() {
    setErrors([])
    setSaving(true)
    try {
      const built = buildExpense(draft)
      if (!built.ok) {
        setErrors(built.errors)
        setSaving(false)
        return
      }
      if (!group || !me) throw new Error('Not ready.')
      if (editId) {
        await updateExpense(editId, group.id, me, draft, built)
      } else {
        await createExpense(group.id, me, draft, built)
      }
      onSaved?.()
      onClose()
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Could not save the expense.'])
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!editId || !group) return
    await deleteExpense(editId, {
      groupId: group.id,
      actor: me,
      notify: form.involved,
      summary: 'deleted an expense',
    })
    onSaved?.()
    onClose()
  }

  const isLast = step === STEPS.length - 1

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          {editId ? 'Edit expense' : 'Add expense'}
        </span>
      }
      footer={
        <div className="space-y-2">
          {errors.length > 0 && (
            <ul className="space-y-0.5">
              {errors.map((e, i) => (
                <li key={i} className="text-xs text-owe" role="alert">
                  {e}
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={step === 0 ? onClose : () => setStep((s) => s - 1)}
              leftIcon={step > 0 ? <IconChevronLeft className="size-4" stroke={2} /> : undefined}
            >
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>
            {isLast ? (
              <Button fullWidth onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editId ? 'Save changes' : 'Save expense'}
              </Button>
            ) : (
              <Button fullWidth onClick={() => setStep((s) => s + 1)}>
                Next
              </Button>
            )}
          </div>
        </div>
      }
    >
      {loadingEdit ? (
        <div className="grid place-items-center py-12 text-faint">
          <IconLoader2 className="size-6 animate-spin" stroke={2} />
        </div>
      ) : (
        <div className="space-y-4">
          <Stepper step={step} onStep={setStep} canDelete={!!editId} onDelete={() => setConfirmDelete(true)} />

          {step === 0 && <BasicsStep form={form} set={set} categories={categories} />}
          {step === 1 && <PayersStep form={form} set={set} members={members} />}
          {step === 2 && <InvolvedStep form={form} set={set} members={members} />}
          {step === 3 && <SplitStep form={form} set={set} members={members} preview={preview} />}
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete this expense?"
        message="This removes it for everyone and can’t be undone. Others will see it in the activity feed."
        confirmLabel="Delete"
        danger
      />
    </Modal>
  )
}

function Stepper({
  step,
  onStep,
  canDelete,
  onDelete,
}: {
  step: number
  onStep: (s: number) => void
  canDelete: boolean
  onDelete: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-1.5">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => onStep(i)}
            className={cn(
              'h-1.5 rounded-full transition-all duration-200',
              i === step ? 'w-6 bg-accent' : i < step ? 'w-3 bg-accent/50' : 'w-3 bg-hairline',
            )}
            aria-label={`Step ${i + 1}: ${label}`}
            aria-current={i === step}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="micro-label">{STEPS[step]}</span>
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete expense"
            className="grid size-7 place-items-center rounded-lg text-faint hover:bg-owe-soft hover:text-owe"
          >
            <IconTrash className="size-4" stroke={2} />
          </button>
        )}
      </div>
    </div>
  )
}
