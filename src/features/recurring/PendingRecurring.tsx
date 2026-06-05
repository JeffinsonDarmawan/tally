import { useState } from 'react'
import { IconRepeat } from '@tabler/icons-react'
import { Button, Card, SectionHeader } from '@/components/ui'
import { formatDate, formatMoney } from '@/lib/utils/format'
import { skipDue } from './api'
import { ConfirmDueModal } from './ConfirmDueModal'
import type { PendingInstance } from './useRecurring'

/** Pending recurring prompts (brief §7.5 + §10). Confirm posts a real expense; skip advances. */
export function PendingRecurring({
  pending,
  onChanged,
}: {
  pending: PendingInstance[]
  onChanged: () => void
}) {
  const [confirmTarget, setConfirmTarget] = useState<PendingInstance | null>(null)
  const [skipping, setSkipping] = useState<string | null>(null)

  if (pending.length === 0) return null

  async function handleSkip(inst: PendingInstance) {
    setSkipping(inst.template.id)
    try {
      await skipDue(inst.template.id, inst.period)
      onChanged()
    } finally {
      setSkipping(null)
    }
  }

  return (
    <section className="reveal">
      <SectionHeader>Pending recurring</SectionHeader>
      <div className="space-y-2">
        {pending.map((inst) => (
          <Card key={inst.template.id} className="flex items-center gap-3">
            <span className="squircle grid size-10 shrink-0 place-items-center bg-accent-soft text-accent">
              <IconRepeat className="size-5" stroke={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">{inst.template.name}</p>
              <p className="text-xs text-subtle">
                Due {formatDate(inst.period)} ·{' '}
                {inst.template.amountMode === 'fixed'
                  ? formatMoney(inst.template.defaultAmount ?? 0)
                  : 'enter amount'}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleSkip(inst)}
              disabled={skipping === inst.template.id}
            >
              Skip
            </Button>
            <Button size="sm" onClick={() => setConfirmTarget(inst)}>
              Confirm
            </Button>
          </Card>
        ))}
      </div>

      <ConfirmDueModal
        instance={confirmTarget}
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onDone={onChanged}
      />
    </section>
  )
}
