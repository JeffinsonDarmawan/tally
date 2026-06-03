import { useEffect, useState } from 'react'
import { IconBellRinging, IconCheck, IconArrowsExchange } from '@tabler/icons-react'
import {
  Avatar,
  Button,
  Field,
  Input,
  Modal,
  MoneyInput,
  SegmentedControl,
} from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { TIME_ZONE } from '@/config'
import { dateInTimeZone, toCents, fromCents } from '@/lib/balance-engine'
import { formatMoney, formatMoneyAbs, parseMoney } from '@/lib/utils/format'
import { useAuth } from '@/features/auth'
import { useGroup } from '@/features/group'
import { createSettlement, sendReminder } from './api'
import { reminderMessage } from './settle'
import type { SettleTarget } from './settle-sheet-context'

type Direction = 'you_pay' | 'they_pay'

export function SettleUpSheet({
  open,
  target,
  onClose,
  onSaved,
}: {
  open: boolean
  target: SettleTarget | null
  onClose: () => void
  onSaved?: () => void
}) {
  const { user } = useAuth()
  const { group, membersById } = useGroup()
  const me = user?.id ?? ''
  const friend = target ? membersById[target.friendId] : undefined
  const myName = membersById[me]?.display_name ?? 'You'

  const net = target?.netCents ?? 0
  const outstanding = Math.abs(net)

  const [direction, setDirection] = useState<Direction>('you_pay')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reminded, setReminded] = useState(false)

  useEffect(() => {
    if (!open || !target) return
    setDirection(net >= 0 ? 'you_pay' : 'they_pay')
    setAmount(outstanding > 0 ? String(fromCents(outstanding)) : '')
    setDate(dateInTimeZone(new Date(), TIME_ZONE))
    setNote('')
    setError(null)
    setReminded(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, target])

  if (!friend || !target) return null

  const amountCents = toCents(parseMoney(amount))
  const overpay = amountCents > outstanding && outstanding > 0
  const from = direction === 'you_pay' ? me : target.friendId
  const to = direction === 'you_pay' ? target.friendId : me

  async function handleSave() {
    if (amountCents <= 0) {
      setError('Enter an amount greater than zero.')
      return
    }
    if (!group || !target || !friend) return
    setSaving(true)
    setError(null)
    try {
      await createSettlement({
        groupId: group.id,
        actor: me,
        from,
        to,
        amountCents,
        date,
        note,
        fromName: from === me ? myName : friend.display_name,
        toName: to === me ? myName : friend.display_name,
      })
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record the payment.')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemind() {
    if (!group || !target || !friend) return
    const message = reminderMessage({
      name: friend.display_name,
      amount: formatMoneyAbs(fromCents(outstanding)),
      days: target.daysUnpaid,
    })
    try {
      await navigator.clipboard.writeText(message)
    } catch {
      // clipboard may be unavailable; the notification still sends.
    }
    await sendReminder({ groupId: group.id, actor: me, debtor: target.friendId, message })
    setReminded(true)
    setTimeout(() => setReminded(false), 2500)
  }

  const balanceLine =
    net > 0
      ? `You owe ${friend.display_name} ${formatMoneyAbs(fromCents(net))}`
      : net < 0
        ? `${friend.display_name} owes you ${formatMoneyAbs(fromCents(net))}`
        : `You're settled up with ${friend.display_name}`

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Settle up"
      footer={
        <div className="space-y-2">
          {error && (
            <p className="text-xs text-owe" role="alert">
              {error}
            </p>
          )}
          {overpay && (
            <p className="text-xs text-subtle">
              That's more than owed — {to === me ? friend.display_name : 'you'} will carry the
              difference as credit.
            </p>
          )}
          <Button fullWidth onClick={handleSave} disabled={saving}>
            {saving ? 'Recording…' : 'Record payment'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Avatar name={friend.display_name} color={friend.avatar_color} size="lg" />
          <div>
            <p className="font-medium text-ink">{friend.display_name}</p>
            <p className={cn('text-sm', net > 0 ? 'text-owe' : net < 0 ? 'text-owed' : 'text-subtle')}>
              {balanceLine}
            </p>
          </div>
        </div>

        {net < 0 && (
          <Button
            variant="secondary"
            fullWidth
            onClick={handleRemind}
            leftIcon={
              reminded ? (
                <IconCheck className="size-4 text-owed" stroke={2.5} />
              ) : (
                <IconBellRinging className="size-4" stroke={2} />
              )
            }
          >
            {reminded ? 'Reminder sent · message copied' : `Remind ${friend.display_name}`}
          </Button>
        )}

        <SegmentedControl
          fullWidth
          aria-label="Payment direction"
          value={direction}
          onChange={setDirection}
          options={[
            { value: 'you_pay', label: `You pay ${friend.display_name}` },
            { value: 'they_pay', label: `${friend.display_name} pays you` },
          ]}
        />

        <Field label="Amount">
          <MoneyInput
            large
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              if (error) setError(null)
            }}
            aria-label="Settlement amount"
          />
        </Field>

        <div className="flex gap-3">
          <Field label="Date" htmlFor="settle-date" className="flex-1">
            <Input id="settle-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>

        <Field label="Note" htmlFor="settle-note">
          <Input
            id="settle-note"
            placeholder="optional"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>

        <button
          type="button"
          onClick={() => setAmount(String(fromCents(outstanding)))}
          className="flex items-center gap-1.5 text-xs font-medium text-accent hover:brightness-110 disabled:opacity-40"
          disabled={outstanding === 0}
        >
          <IconArrowsExchange className="size-3.5" stroke={2} />
          Use full outstanding ({formatMoney(fromCents(outstanding))})
        </button>
      </div>
    </Modal>
  )
}
