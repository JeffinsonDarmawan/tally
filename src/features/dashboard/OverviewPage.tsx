import { useState } from 'react'
import { IconArrowUpRight, IconArrowDownRight, IconClockExclamation } from '@tabler/icons-react'
import {
  Avatar,
  Card,
  ListDivider,
  ListRow,
  SectionHeader,
  SegmentedControl,
  StatCard,
} from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { formatMoney, formatMoneyAbs } from '@/lib/utils/format'
import { SAMPLE_BALANCES } from './sampleData'

export function OverviewPage() {
  const [view, setView] = useState<'detailed' | 'simplified'>('detailed')

  const owed = SAMPLE_BALANCES.filter((b) => b.net > 0).reduce((s, b) => s + b.net, 0)
  const owe = SAMPLE_BALANCES.filter((b) => b.net < 0).reduce((s, b) => s + Math.abs(b.net), 0)
  const net = owed - owe
  const unpaidCount = SAMPLE_BALANCES.filter((b) => b.net !== 0).length

  return (
    <div className="space-y-6">
      <PreviewBanner />

      {/* Net balance hero */}
      <header className="reveal px-1 pt-2">
        <p className="micro-label">Net balance</p>
        <div
          className={cn('figure-hero mt-2 text-6xl', net >= 0 ? 'text-owed' : 'text-owe')}
        >
          {formatMoney(net, { signDisplay: 'always' })}
        </div>
        <p className="mt-2 text-sm text-subtle">
          {net >= 0 ? "You're owed overall" : 'You owe overall'} · across {SAMPLE_BALANCES.length} friends
        </p>
      </header>

      {/* Tinted stat cards */}
      <div className="reveal grid grid-cols-2 gap-3" style={{ animationDelay: '60ms' }}>
        <StatCard
          tone="owed"
          label="You're owed"
          value={formatMoneyAbs(owed)}
          icon={<IconArrowDownRight className="size-4" stroke={2.5} />}
        />
        <StatCard
          tone="owe"
          label="You owe"
          value={formatMoneyAbs(owe)}
          icon={<IconArrowUpRight className="size-4" stroke={2.5} />}
        />
      </div>

      <StatCard
        className="reveal"
        style={{ animationDelay: '120ms' }}
        tone="neutral"
        label="Unpaid transactions"
        value={<span className="num">{unpaidCount}</span>}
        hint="Oldest is 9 days old"
        icon={<IconClockExclamation className="size-4" stroke={2} />}
        onClick={() => {}}
      />

      {/* Per-friend balances */}
      <section className="reveal" style={{ animationDelay: '160ms' }}>
        <SectionHeader
          action={
            <SegmentedControl
              size="sm"
              aria-label="Balance view"
              value={view}
              onChange={setView}
              options={[
                { value: 'detailed', label: 'Detailed' },
                { value: 'simplified', label: 'Simplified' },
              ]}
            />
          }
        >
          Balances
        </SectionHeader>

        <Card flush>
          {SAMPLE_BALANCES.map((b, i) => {
            const settled = b.net === 0
            const youAreOwed = b.net > 0
            return (
              <div key={b.person.id}>
                {i > 0 && <ListDivider />}
                <ListRow
                  onClick={() => {}}
                  chevron
                  leading={<Avatar name={b.person.name} color={b.person.color} />}
                  title={b.person.name}
                  subtitle={
                    settled
                      ? 'All settled up'
                      : `${youAreOwed ? 'owes you' : 'you owe'} · ${b.daysUnpaid}d unpaid`
                  }
                  trailing={
                    <span
                      className={cn(
                        'num text-[15px] font-semibold tabular-nums',
                        settled ? 'text-faint' : youAreOwed ? 'text-owed' : 'text-owe',
                      )}
                    >
                      {settled ? '—' : formatMoneyAbs(b.net)}
                    </span>
                  }
                />
              </div>
            )
          })}
        </Card>
        {view === 'simplified' && (
          <p className="mt-2 px-1 text-xs text-faint">
            Simplified view (minimal transfers) is wired in Phase 4 · 5.
          </p>
        )}
      </section>
    </div>
  )
}

function PreviewBanner() {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-accent/20 bg-accent-soft/60 px-3 py-2 text-xs text-subtle">
      <span className="size-1.5 rounded-full bg-accent" />
      <span>
        <span className="font-medium text-ink">Phase 0 · design system preview.</span> Figures are
        sample data — live balances arrive with the engine in Phase 2 · 4.
      </span>
    </div>
  )
}
