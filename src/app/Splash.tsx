import { IconLoader2 } from '@tabler/icons-react'
import { Button } from '@/components/ui'

/** Full-screen branded loading state used while auth/group data resolves. */
export function Splash({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-base" aria-busy="true" aria-label={label}>
      <div className="flex flex-col items-center gap-3 text-faint">
        <IconLoader2 className="size-6 animate-spin" stroke={2} />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  )
}

/** Full-screen error with a retry, used when group data fails to load. */
export function SplashError({ message, onRetry }: { message?: string | null; onRetry: () => void }) {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-base px-6">
      <div className="max-w-sm text-center">
        <h1 className="text-lg font-semibold text-ink">Couldn’t load your group</h1>
        <p className="mt-1 text-sm text-subtle">{message ?? 'Please check your connection and try again.'}</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </div>
  )
}
