import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { IconChevronLeft, IconChevronRight, IconChartPie, IconFileText, IconFileTypePdf } from '@tabler/icons-react'
import {
  Avatar,
  Button,
  Card,
  CategoryTile,
  EmptyState,
  ListDivider,
  ListRow,
  SectionHeader,
  SegmentedControl,
} from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { TIME_ZONE } from '@/config'
import { dateInTimeZone, fromCents, unpaidExpenseIds } from '@/lib/balance-engine'
import { formatDate, formatMoney, formatMoneyAbs } from '@/lib/utils/format'
import { PageHeader } from '@/features/misc'
import { useAuth } from '@/features/auth'
import { useGroup } from '@/features/group'
import { useCategories } from '@/features/categories'
import { useHistory } from '@/features/history'
import { summarizeReport, periodBounds, type Period } from './report'
import { exportCsv, exportPdf } from './export'

function currentPeriod(): Period {
  const today = dateInTimeZone(new Date(), TIME_ZONE)
  return { mode: 'month', year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) }
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function SummaryPage() {
  const { user } = useAuth()
  const me = user?.id ?? ''
  const { group, membersById } = useGroup()
  const { categories } = useCategories(group?.id)
  const categoriesById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories])
  const { data, status, reload } = useHistory(group?.id)

  const [period, setPeriod] = useState<Period>(currentPeriod)

  const categoryName = (id: string | null) => (id && categoriesById[id]?.name) || 'Uncategorized'
  const categoryColor = (id: string | null) => (id && categoriesById[id]?.color) || '#9A9AA2'
  const memberName = (id: string | null) => (id && membersById[id]?.display_name) || '—'
  const memberColor = (id: string | null) => (id && membersById[id]?.avatar_color) || '#9A9AA2'

  const report = useMemo(
    () => (data ? summarizeReport(data.expenses, me, period) : null),
    [data, me, period],
  )

  const { settledCents, outstandingCents, periodExps } = useMemo(() => {
    if (!data) return { settledCents: 0, outstandingCents: 0, periodExps: [] }
    const { start, endExclusive } = periodBounds(period)
    const exps = data.expenses.filter((e) => e.date >= start && e.date < endExclusive)
    const unpaid = unpaidExpenseIds(
      me,
      data.expenses.map((e) => ({ id: e.id, date: e.date, paid: e.paid, owed: e.owed })),
      data.settlements,
    )
    let settled = 0
    let outstanding = 0
    for (const e of exps) {
      if (unpaid.has(e.id)) outstanding += e.totalCents
      else settled += e.totalCents
    }
    return { settledCents: settled, outstandingCents: outstanding, periodExps: exps }
  }, [data, me, period])

  const label = period.mode === 'month' ? `${MONTH_NAMES[period.month - 1]} ${period.year}` : `${period.year}`
  const slug = period.mode === 'month' ? `${period.year}-${String(period.month).padStart(2, '0')}` : `${period.year}`

  const step = (dir: -1 | 1) =>
    setPeriod((p) => {
      if (p.mode === 'year') return { ...p, year: p.year + dir }
      let month = p.month + dir
      let year = p.year
      if (month < 1) {
        month = 12
        year--
      } else if (month > 12) {
        month = 1
        year++
      }
      return { ...p, year, month }
    })

  return (
    <div className="space-y-6">
      <PageHeader title="Summary" subtitle="Where the money went." />

      {/* Period selector */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous period"
            className="grid size-9 place-items-center rounded-xl text-subtle hover:bg-elevated hover:text-ink"
          >
            <IconChevronLeft className="size-5" stroke={2} />
          </button>
          <span className="num min-w-32 text-center text-sm font-semibold text-ink">{label}</span>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next period"
            className="grid size-9 place-items-center rounded-xl text-subtle hover:bg-elevated hover:text-ink"
          >
            <IconChevronRight className="size-5" stroke={2} />
          </button>
        </div>
        <SegmentedControl
          aria-label="Period mode"
          value={period.mode}
          onChange={(mode) => setPeriod((p) => ({ ...p, mode }))}
          options={[
            { value: 'month', label: 'Month' },
            { value: 'year', label: 'Year' },
          ]}
        />
      </div>

      {status === 'loading' || !report ? (
        <Card>
          <div className="h-40 animate-pulse rounded-lg bg-elevated" />
        </Card>
      ) : report.count === 0 ? (
        <Card flush>
          <EmptyState
            icon={<IconChartPie className="size-7" stroke={1.75} />}
            title={`Nothing spent this ${period.mode}`}
            description="Pick another period, or add some expenses."
          />
        </Card>
      ) : (
        <>
          {/* Header figures */}
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Total spent" value={formatMoney(fromCents(report.totalCents))} />
            <Stat label="Transactions" value={String(report.count)} />
            <Stat
              label="Your net"
              value={formatMoneyAbs(fromCents(report.myNetCents))}
              tone={report.myNetCents > 0 ? 'owed' : report.myNetCents < 0 ? 'owe' : 'neutral'}
            />
          </div>

          {/* Spending by category */}
          <section>
            <SectionHeader>By category</SectionHeader>
            <Card>
              <div className="flex items-center gap-4">
                <div className="relative size-36 shrink-0">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={report.byCategory}
                        dataKey="cents"
                        nameKey="categoryId"
                        innerRadius={48}
                        outerRadius={68}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {report.byCategory.map((c) => (
                          <Cell key={c.categoryId ?? 'none'} fill={categoryColor(c.categoryId)} />
                        ))}
                      </Pie>
                      <Tooltip content={<CategoryTooltip nameOf={categoryName} />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 grid place-items-center">
                    <span className="num text-sm font-bold tabular-nums text-ink">
                      {formatMoney(fromCents(report.totalCents))}
                    </span>
                  </div>
                </div>
                <ul className="min-w-0 flex-1 space-y-1.5">
                  {report.byCategory.slice(0, 6).map((c) => (
                    <li key={c.categoryId ?? 'none'} className="flex items-center gap-2 text-sm">
                      <span className="size-2.5 shrink-0 rounded-sm" style={{ background: categoryColor(c.categoryId) }} />
                      <span className="min-w-0 flex-1 truncate text-subtle">{categoryName(c.categoryId)}</span>
                      <span className="num tabular-nums text-faint">{c.pct}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </section>

          {/* Spending timeline */}
          <section>
            <SectionHeader>Timeline</SectionHeader>
            <Card>
              <div className="h-40">
                <ResponsiveContainer>
                  <BarChart data={report.timeline.map((b) => ({ ...b, value: fromCents(b.cents) }))}>
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#6B6B74', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      interval={period.mode === 'month' ? 4 : 0}
                    />
                    <Tooltip content={<TimelineTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <Bar dataKey="value" fill="#9C9CF0" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </section>

          {/* Who paid */}
          <section>
            <SectionHeader>Who paid</SectionHeader>
            <Card className="space-y-2.5">
              {report.whoPaid.map((p) => (
                <div key={p.userId} className="flex items-center gap-3">
                  <Avatar name={memberName(p.userId)} color={memberColor(p.userId)} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate text-ink">{memberName(p.userId)}</span>
                      <span className="num tabular-nums text-subtle">{formatMoney(fromCents(p.cents))}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-elevated">
                      <div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: memberColor(p.userId) }} />
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          </section>

          {/* Settled vs pending */}
          <section>
            <SectionHeader>Settled vs outstanding</SectionHeader>
            <Card>
              <div className="flex h-3 overflow-hidden rounded-full bg-elevated">
                <div className="bg-owed" style={{ width: `${barPct(settledCents, settledCents + outstandingCents)}%` }} />
                <div className="bg-owe" style={{ width: `${barPct(outstandingCents, settledCents + outstandingCents)}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-xs">
                <span className="text-owed">Settled {formatMoney(fromCents(settledCents))}</span>
                <span className="text-owe">Outstanding {formatMoney(fromCents(outstandingCents))}</span>
              </div>
            </Card>
          </section>

          {/* Top expenses */}
          <section>
            <SectionHeader>Top expenses</SectionHeader>
            <Card flush>
              {report.topExpenses.map((e, i) => (
                <div key={e.id}>
                  {i > 0 && <ListDivider />}
                  <ListRow
                    leading={<CategoryTile icon={e.categoryId ? categoriesById[e.categoryId]?.icon : null} color={categoryColor(e.categoryId)} />}
                    title={e.note || categoryName(e.categoryId)}
                    subtitle={formatDate(e.date)}
                    trailing={
                      <span className="num text-[15px] font-semibold tabular-nums text-ink">
                        {formatMoney(fromCents(e.totalCents))}
                      </span>
                    }
                  />
                </div>
              ))}
            </Card>
          </section>

          {/* Export */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              leftIcon={<IconFileText className="size-4" stroke={2} />}
              onClick={() => exportCsv(`tally-${slug}.csv`, periodExps, me, categoryName, memberName)}
            >
              Export CSV
            </Button>
            <Button
              variant="secondary"
              fullWidth
              leftIcon={<IconFileTypePdf className="size-4" stroke={2} />}
              onClick={() => exportPdf(`tally-${slug}.pdf`, report, label, categoryName, memberName)}
            >
              Export PDF
            </Button>
          </div>
        </>
      )}

      {status === 'error' && (
        <Button variant="ghost" size="sm" onClick={() => void reload()}>
          Couldn’t load — retry
        </Button>
      )}
    </div>
  )
}

function barPct(part: number, total: number): number {
  return total > 0 ? (part / total) * 100 : 0
}

function Stat({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'owed' | 'owe' | 'neutral' }) {
  return (
    <Card className="px-3 py-3">
      <p className="micro-label">{label}</p>
      <p
        className={cn(
          'num mt-1.5 text-lg font-bold tabular-nums',
          tone === 'owed' ? 'text-owed' : tone === 'owe' ? 'text-owe' : 'text-ink',
        )}
      >
        {value}
      </p>
    </Card>
  )
}

interface TooltipEntry {
  payload: { categoryId?: string | null; cents: number; value?: number; label?: string }
}
function CategoryTooltip({ active, payload, nameOf }: { active?: boolean; payload?: TooltipEntry[]; nameOf: (id: string | null) => string }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-hairline bg-elevated px-2.5 py-1.5 text-xs text-ink shadow-pop">
      {nameOf(p.categoryId ?? null)} · {formatMoney(fromCents(p.cents))}
    </div>
  )
}
function TimelineTooltip({ active, payload }: { active?: boolean; payload?: TooltipEntry[] }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-hairline bg-elevated px-2.5 py-1.5 text-xs text-ink shadow-pop">
      {formatMoney(p.value ?? 0)}
    </div>
  )
}
