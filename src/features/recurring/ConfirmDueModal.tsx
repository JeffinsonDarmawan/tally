import { useEffect, useState } from 'react'
import { Button, Field, MoneyInput, Modal } from '@/components/ui'
import { formatDate, parseMoney } from '@/lib/utils/format'
import { toCents } from '@/lib/balance-engine'
import { useAuth } from '@/features/auth'
import { confirmDue } from './api'
import type { PendingInstance } from './useRecurring'

export function ConfirmDueModal({
  instance,
  open,
  onClose,
  onDone,
}: {
  instance: PendingInstance | null
  open: boolean
  onClose: () => void
  onDone: () => void
}) {
  const { user } = useAuth()
  const me = user?.id ?? ''
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const variable = instance?.template.amountMode === 'variable'

  useEffect(() => {
    if (!open || !instance) return
    // Prefill the default amount for both modes; variable still requires confirming the real figure.
    const def = instance.template.defaultAmount
    setAmount(def != null ? String(def) : '')
    setError(null)
  }, [open, instance])

  if (!instance) return null
  const { template, period } = instance

  async function handleConfirm() {
    if (toCents(parseMoney(amount)) <= 0) {
      setError(variable ? 'Enter the actual amount for this bill.' : 'Enter an amount.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await confirmDue({ template, period, amount: parseMoney(amount), actor: me })
      onDone()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post this.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Confirm recurring"
      footer={
        <div className="space-y-2">
          {error && (
            <p className="text-xs text-owe" role="alert">
              {error}
            </p>
          )}
          <Button fullWidth onClick={handleConfirm} disabled={saving}>
            {saving ? 'Posting…' : `Post for ${formatDate(period)}`}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="text-lg font-semibold text-ink">{template.name}</p>
          <p className="text-sm text-subtle">
            Due {formatDate(period)} · {variable ? 'variable amount' : 'fixed amount'}
          </p>
        </div>
        <Field
          label="Amount"
          hint={variable ? 'Enter the actual amount for this period.' : 'Adjust if it changed.'}
        >
          <MoneyInput
            large
            autoFocus={variable}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              if (error) setError(null)
            }}
            aria-label="Amount"
          />
        </Field>
        <p className="text-xs text-faint">
          This posts a real expense dated {formatDate(period)} and won't post again until the next
          period comes due.
        </p>
      </div>
    </Modal>
  )
}
