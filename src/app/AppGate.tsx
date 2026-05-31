import { useAuth, LoginPage } from '@/features/auth'
import { useGroup, OnboardingPage } from '@/features/group'
import { AppRoutes } from './router'
import { Splash, SplashError } from './Splash'

/**
 * Decides what the app renders based on auth + group state:
 *   loading → splash · signed-out → login · no group → onboarding · ready → the app.
 */
export function AppGate() {
  const { status: authStatus } = useAuth()

  if (authStatus === 'loading') return <Splash />
  if (authStatus === 'unauthenticated') return <LoginPage />
  return <GroupGate />
}

function GroupGate() {
  const { status, error, refresh } = useGroup()

  if (status === 'loading') return <Splash label="Loading your group…" />
  if (status === 'error') return <SplashError message={error} onRetry={() => void refresh()} />
  if (status === 'no-group') return <OnboardingPage />
  return <AppRoutes />
}
