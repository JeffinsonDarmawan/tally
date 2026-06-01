import type { ReactNode } from 'react'
import { AuthProvider } from '@/features/auth'
import { GroupProvider } from '@/features/group'

/** App-wide context providers. (A server-state/query client can join here later.) */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <GroupProvider>{children}</GroupProvider>
    </AuthProvider>
  )
}
