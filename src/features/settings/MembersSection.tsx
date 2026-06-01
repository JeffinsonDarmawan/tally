import { useState } from 'react'
import { IconUserPlus } from '@tabler/icons-react'
import {
  Avatar,
  Button,
  Card,
  Field,
  Input,
  ListDivider,
  ListRow,
  Modal,
  SectionHeader,
} from '@/components/ui'
import { useAuth } from '@/features/auth'
import { useGroup, addMember } from '@/features/group'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function MembersSection() {
  const { user } = useAuth()
  const { group, members, refresh } = useGroup()
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onAdd() {
    const trimmed = code.trim()
    if (!UUID_RE.test(trimmed)) {
      setError('That doesn’t look like a member code.')
      return
    }
    if (members.some((m) => m.id === trimmed)) {
      setError('That person is already in the group.')
      return
    }
    if (!group) return
    setSaving(true)
    setError(null)
    try {
      await addMember(group.id, trimmed)
      await refresh()
      setCode('')
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add that member.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section>
      <SectionHeader
        action={
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<IconUserPlus className="size-4" stroke={2.5} />}
            onClick={() => setOpen(true)}
          >
            Add
          </Button>
        }
      >
        Members · {members.length}
      </SectionHeader>

      <Card flush>
        {members.map((m, i) => (
          <div key={m.id}>
            {i > 0 && <ListDivider />}
            <ListRow
              leading={<Avatar name={m.display_name} color={m.avatar_color} />}
              title={m.display_name}
              trailing={
                m.id === user?.id ? (
                  <span className="rounded-full bg-elevated px-2 py-0.5 text-xs font-medium text-subtle">You</span>
                ) : undefined
              }
            />
          </div>
        ))}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add a member"
        footer={
          <Button fullWidth onClick={onAdd} disabled={saving}>
            {saving ? 'Adding…' : 'Add to group'}
          </Button>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-subtle">
            Ask your friend to sign in once, then send you the <strong className="text-ink">member code</strong>{' '}
            shown on their welcome screen. Paste it below to add them.
          </p>
          <Field label="Member code" htmlFor="member-code" error={error ?? undefined}>
            <Input
              id="member-code"
              placeholder="00000000-0000-0000-0000-000000000000"
              value={code}
              autoFocus
              onChange={(e) => {
                setCode(e.target.value)
                if (error) setError(null)
              }}
            />
          </Field>
        </div>
      </Modal>
    </section>
  )
}
