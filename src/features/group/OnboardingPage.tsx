import { useState, type FormEvent } from 'react'
import { IconCopy, IconCheck, IconRefresh, IconLogout, IconUsersPlus } from '@tabler/icons-react'
import { Button, Field, Input } from '@/components/ui'
import { useAuth } from '@/features/auth'
import { useGroup } from './useGroup'
import { createGroup } from './api'

export function OnboardingPage() {
  const { user, signOut } = useAuth()
  const { refresh } = useGroup()
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const memberCode = user?.id ?? ''

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    if (name.trim().length < 2) {
      setError('Give your group a name (at least 2 characters).')
      return
    }
    setCreating(true)
    setError(null)
    try {
      await createGroup(name.trim())
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the group.')
    } finally {
      setCreating(false)
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(memberCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard may be unavailable; the code is still visible to copy manually.
    }
  }

  async function onRefresh() {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  return (
    <div className="grid min-h-[100dvh] place-items-center px-5 py-10">
      <div className="reveal w-full max-w-md space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">You’re signed in 🎉</h1>
          <p className="mt-1 text-sm text-subtle">Create your group, or get added to an existing one.</p>
        </div>

        {/* Create a group */}
        <form onSubmit={onCreate} className="rounded-card-lg border border-hairline bg-surface p-6 shadow-card">
          <h2 className="text-base font-semibold text-ink">Create a group</h2>
          <p className="mt-1 mb-4 text-sm text-subtle">
            Start a new group and invite the others. Default categories are added for you.
          </p>
          <Field label="Group name" htmlFor="group-name" error={error ?? undefined}>
            <Input
              id="group-name"
              placeholder="e.g. Flat 12"
              value={name}
              autoFocus
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError(null)
              }}
            />
          </Field>
          <Button type="submit" fullWidth className="mt-4" disabled={creating}>
            {creating ? 'Creating…' : 'Create group'}
          </Button>
        </form>

        {/* Join an existing group */}
        <div className="rounded-card-lg border border-hairline bg-surface p-6 shadow-card">
          <div className="flex items-center gap-2">
            <IconUsersPlus className="size-5 text-accent" stroke={2} />
            <h2 className="text-base font-semibold text-ink">Join an existing group</h2>
          </div>
          <p className="mt-1 mb-3 text-sm text-subtle">
            Share your member code with someone in the group. They add you from Settings, then refresh.
          </p>
          <div className="flex items-center gap-2 rounded-xl border border-hairline bg-elevated px-3 py-2">
            <code className="num flex-1 truncate text-[13px] text-subtle">{memberCode}</code>
            <button
              type="button"
              onClick={copyCode}
              aria-label={copied ? 'Member code copied to clipboard' : 'Copy member code'}
              className="grid size-7 shrink-0 place-items-center rounded-lg text-faint transition-colors hover:bg-surface hover:text-ink"
            >
              {copied ? <IconCheck className="size-4 text-owed" stroke={2.5} /> : <IconCopy className="size-4" stroke={2} />}
            </button>
          </div>
          <Button
            variant="secondary"
            fullWidth
            className="mt-4"
            onClick={onRefresh}
            disabled={refreshing}
            leftIcon={<IconRefresh className={refreshing ? 'size-4 animate-spin' : 'size-4'} stroke={2} />}
          >
            {refreshing ? 'Checking…' : 'I’ve been added — refresh'}
          </Button>
        </div>

        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={() => void signOut()} leftIcon={<IconLogout className="size-4" stroke={2} />}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}
