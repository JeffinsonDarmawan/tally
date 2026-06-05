import { jsPDF } from 'jspdf'
import { fromCents } from '@/lib/balance-engine'
import { formatMoney } from '@/lib/utils/format'
import type { EnrichedExpense } from '@/features/dashboard'
import type { Report } from './report'

type NameLookup = (id: string | null) => string

function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function csv(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`
}

/** Export the period's transactions as CSV (client-side, free). */
export function exportCsv(
  filename: string,
  exps: EnrichedExpense[],
  me: string,
  categoryName: NameLookup,
  memberName: NameLookup,
): void {
  const lines = [['Date', 'Category', 'Paid by', 'Total', 'Your share'].map(csv).join(',')]
  for (const e of exps) {
    lines.push(
      [
        csv(e.date),
        csv(categoryName(e.categoryId)),
        csv(e.paidBy ? memberName(e.paidBy) : '—'),
        csv(fromCents(e.totalCents).toFixed(2)),
        csv(fromCents(e.owed[me] ?? 0).toFixed(2)),
      ].join(','),
    )
  }
  downloadText(filename, lines.join('\n'), 'text/csv;charset=utf-8')
}

/** Export a one-page PDF summary of the period (client-side, free). */
export function exportPdf(
  filename: string,
  report: Report,
  periodLabel: string,
  categoryName: NameLookup,
  memberName: NameLookup,
): void {
  const doc = new jsPDF()
  let y = 20
  const line = (text: string, size = 11, gap = 7) => {
    doc.setFontSize(size)
    doc.text(text, 14, y)
    y += gap
  }

  line(`Tally — ${periodLabel}`, 18, 10)
  line(`Total spent: ${formatMoney(fromCents(report.totalCents))}  ·  ${report.count} transactions`)
  line(
    `Your net: ${formatMoney(fromCents(report.myNetCents), { signDisplay: 'always' })} (${report.myNetCents >= 0 ? "you're owed" : 'you owe'})`,
  )
  y += 4

  line('Spending by category', 13, 8)
  for (const c of report.byCategory) {
    line(`  ${categoryName(c.categoryId)} — ${formatMoney(fromCents(c.cents))} (${c.pct}%)`, 11, 6)
  }
  y += 4

  line('Who paid', 13, 8)
  for (const p of report.whoPaid) {
    line(`  ${memberName(p.userId)} — ${formatMoney(fromCents(p.cents))} (${p.pct}%)`, 11, 6)
  }
  y += 4

  line('Top expenses', 13, 8)
  for (const e of report.topExpenses) {
    line(`  ${e.date}  ${categoryName(e.categoryId)} — ${formatMoney(fromCents(e.totalCents))}`, 11, 6)
  }

  doc.save(filename)
}
