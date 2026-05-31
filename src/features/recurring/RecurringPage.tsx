import { IconRepeat, IconPlus } from '@tabler/icons-react'
import { Button, Card, EmptyState } from '@/components/ui'
import { PageHeader } from '@/features/misc'

export function RecurringPage() {
  return (
    <div>
      <PageHeader title="Recurring" subtitle="Rent, utilities, subscriptions — confirmed before they post." />
      <Card flush>
        <EmptyState
          icon={<IconRepeat className="size-7" stroke={1.75} />}
          title="No recurring payments"
          description="Set up templates for regular bills. Future periods never count toward balances until you confirm them (Phase 6)."
          action={
            <Button variant="secondary" size="sm" leftIcon={<IconPlus className="size-4" stroke={2.5} />} disabled>
              New template
            </Button>
          }
        />
      </Card>
    </div>
  )
}
