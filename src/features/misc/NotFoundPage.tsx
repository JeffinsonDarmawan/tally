import { useNavigate } from 'react-router-dom'
import { IconMoodConfuzed } from '@tabler/icons-react'
import { Button, Card, EmptyState } from '@/components/ui'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <Card flush>
      <EmptyState
        icon={<IconMoodConfuzed className="size-7" stroke={1.75} />}
        title="Page not found"
        description="That page doesn’t exist. Let’s get you back home."
        action={
          <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
            Back to home
          </Button>
        }
      />
    </Card>
  )
}
