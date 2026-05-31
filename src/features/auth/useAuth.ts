import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from './auth-context'

/** Access the current auth session. Must be used within <AuthProvider>. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
