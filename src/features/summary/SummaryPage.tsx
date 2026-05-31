import { useState } from 'react'
import { IconChartPie } from '@tabler/icons-react'
import { Card, EmptyState, SegmentedControl } from '@/components/ui'
import { PageHeader } from '@/features/misc'

export function SummaryPage() {
  const [period, setPeriod] = useState<'month' | 'year'>('month')

  return (
    <div>
      <PageHeader
        title="Summary"
        subtitle="A visual report of spending and settlements."
        action={
          <SegmentedControl
            aria-label="Period"
            value={period}
            onChange={setPeriod}
            options={[
              { value: 'month', label: 'Month' },
              { value: 'year', label: 'Year' },
            ]}
          />
        }
      />
      <Card flush>
        <EmptyState
          icon={<IconChartPie className="size-7" stroke={1.75} />}
          title={`Nothing to summarize this ${period}`}
          description="Category, who-paid, timeline and settled-vs-pending charts — plus CSV/PDF export — arrive in Phase 8."
        />
      </Card>
    </div>
  )
}
