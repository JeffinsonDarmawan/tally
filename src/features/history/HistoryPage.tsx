import { IconReceipt2 } from '@tabler/icons-react'
import { Card, EmptyState } from '@/components/ui'
import { PageHeader } from '@/features/misc'

export function HistoryPage() {
  return (
    <div>
      <PageHeader title="History" subtitle="Every expense, searchable and filterable." />
      <Card flush>
        <EmptyState
          icon={<IconReceipt2 className="size-7" stroke={1.75} />}
          title="No expenses yet"
          description="Once you start adding expenses, they’ll appear here with search, filters, and bulk actions (Phase 7)."
        />
      </Card>
    </div>
  )
}
