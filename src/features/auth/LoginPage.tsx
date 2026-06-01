import { useState, type FormEvent } from 'react'
import { IconMail, IconArrowRight, IconMailCheck, IconAlertTriangle } from '@tabler/icons-react'
import { Button, Field, Input } from '@/components/ui'
import { APP_NAME } from '@/config'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { sendMagicLink } from './api'

type Status = 'idle' | 'sending' | 'sent' | 'error'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
      <g stroke="currentColor" strokeWidth={5} strokeLinecap="round">
        <line x1="16" y1="18" x2="16" y2="46" />
        <line x1="26" y1="18" x2="26" y2="46" />
        <line x1="36" y1="18" x2="36" y2="46" />
        <line x1="46" y1="18" x2="46" y2="46" />
        <line x1="12" y1="48" x2="50" y2="16" />
      </g>
    </svg>
  )
}

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!EMAIL_RE.test(email)) {
      setError('Enter a valid email address.')
      setStatus('error')
      return
    }
    setStatus('sending')
    setError(null)
    try {
      await sendMagicLink(email)
      setStatus('sent')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div className="relative grid min-h-[100dvh] place-items-center overflow-hidden px-5">
      {/* Atmospheric glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[-10%] left-1/2 size-[480px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(156,156,240,0.18), transparent 70%)' }}
      />

      <div className="reveal relative w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="squircle grid size-16 place-items-center bg-elevated text-accent shadow-pop">
            <Logo className="size-9" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-subtle">Split bills with the group. Settle up clean.</p>
        </div>

        <div className="rounded-card-lg border border-hairline bg-surface p-6 shadow-card">
          {!isSupabaseConfigured ? (
            <SetupNotice />
          ) : status === 'sent' ? (
            <SentState email={email} onReset={() => setStatus('idle')} />
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
              <div>
                <h2 className="text-lg font-semibold text-ink">Sign in</h2>
                <p className="mt-1 text-sm text-subtle">
                  We’ll email you a magic link — no password needed.
                </p>
              </div>

              <Field label="Email" htmlFor="email" error={status === 'error' ? error : undefined}>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="you@example.com"
                  leading={<IconMail className="size-4" stroke={2} />}
                  value={email}
                  invalid={status === 'error'}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (status === 'error') setStatus('idle')
                  }}
                />
              </Field>

              <Button
                type="submit"
                fullWidth
                size="lg"
                disabled={status === 'sending'}
                rightIcon={status !== 'sending' && <IconArrowRight className="size-4" stroke={2.5} />}
              >
                {status === 'sending' ? 'Sending…' : 'Send magic link'}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-faint">
          Private group app · invite-only. Ask a member to add you after your first sign-in.
        </p>
      </div>
    </div>
  )
}

function SentState({ email, onReset }: { email: string; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center py-2 text-center">
      <span className="squircle grid size-12 place-items-center bg-owed-soft text-owed">
        <IconMailCheck className="size-6" stroke={2} />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-ink">Check your email</h2>
      <p className="mt-1 text-sm text-subtle">
        We sent a magic link to <span className="font-medium text-ink">{email}</span>. Open it on this
        device to sign in.
      </p>
      <Button variant="ghost" size="sm" className="mt-4" onClick={onReset}>
        Use a different email
      </Button>
    </div>
  )
}

function SetupNotice() {
  return (
    <div className="flex flex-col items-center py-2 text-center">
      <span className="squircle grid size-12 place-items-center bg-owe-soft text-owe">
        <IconAlertTriangle className="size-6" stroke={2} />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-ink">Backend not configured</h2>
      <p className="mt-1 text-sm text-subtle">
        Set <code className="rounded bg-elevated px-1 py-0.5 text-[12px] text-ink">VITE_SUPABASE_URL</code>{' '}
        and{' '}
        <code className="rounded bg-elevated px-1 py-0.5 text-[12px] text-ink">VITE_SUPABASE_ANON_KEY</code>{' '}
        in your <code className="rounded bg-elevated px-1 py-0.5 text-[12px] text-ink">.env</code>, then
        restart the dev server. See <span className="text-ink">docs/database/DATABASE.md</span>.
      </p>
    </div>
  )
}
