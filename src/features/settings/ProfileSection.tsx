import { useEffect, useState } from 'react'
import { IconPencil } from '@tabler/icons-react'
import { Avatar, Button, Card, ColorPicker, Field, Input, Modal, SectionHeader } from '@/components/ui'
import { PERSON_COLORS } from '@/config'
import { useAuth } from '@/features/auth'
import { useGroup, updateMyProfile } from '@/features/group'

export function ProfileSection() {
  const { user } = useAuth()
  const { profile, refresh } = useGroup()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState<string>(PERSON_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !profile) return
    setName(profile.display_name)
    setColor(profile.avatar_color)
    setError(null)
  }, [open, profile])

  if (!profile) return null

  async function onSave() {
    if (!user || !profile) return
    if (name.trim().length < 1) {
      setError('Your name can’t be empty.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await updateMyProfile(user.id, { display_name: name.trim(), avatar_color: color })
      await refresh()
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section>
      <SectionHeader>You</SectionHeader>
      <Card className="flex items-center gap-3">
        <Avatar name={profile.display_name} color={profile.avatar_color} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink">{profile.display_name}</p>
          <p className="truncate text-sm text-subtle">{user?.email}</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<IconPencil className="size-4" stroke={2} />}
          onClick={() => setOpen(true)}
        >
          Edit
        </Button>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Edit profile"
        footer={
          <Button fullWidth onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        }
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Avatar name={name.trim() || profile.display_name} color={color} size="lg" />
            <p className="text-sm text-subtle">This is how you appear across the app.</p>
          </div>
          <Field label="Display name" htmlFor="profile-name" error={error ?? undefined}>
            <Input
              id="profile-name"
              value={name}
              autoFocus
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError(null)
              }}
            />
          </Field>
          <Field label="Avatar color">
            <ColorPicker value={color} onChange={setColor} />
          </Field>
        </div>
      </Modal>
    </section>
  )
}
