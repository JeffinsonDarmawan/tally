import { IconLogout } from '@tabler/icons-react'
import { Button } from '@/components/ui'
import { PageHeader } from '@/features/misc'
import { useAuth } from '@/features/auth'
import { useGroup } from '@/features/group'
import { CategoryManager } from '@/features/categories'
import { ProfileSection } from './ProfileSection'
import { MembersSection } from './MembersSection'

export function SettingsPage() {
  const { signOut } = useAuth()
  const { group } = useGroup()

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        subtitle={group ? `${group.name} · ${group.currency_code}` : 'Group, members and categories.'}
      />

      <ProfileSection />
      <MembersSection />
      {group && <CategoryManager groupId={group.id} />}

      <div className="pt-2">
        <Button
          variant="secondary"
          fullWidth
          onClick={() => void signOut()}
          leftIcon={<IconLogout className="size-4" stroke={2} />}
        >
          Sign out
        </Button>
      </div>
    </div>
  )
}
