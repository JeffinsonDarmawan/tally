import { useContext } from 'react'
import { GroupContext, type GroupContextValue } from './group-context'

/** Access the current group, members, and profile. Must be used within <GroupProvider>. */
export function useGroup(): GroupContextValue {
  const ctx = useContext(GroupContext)
  if (!ctx) throw new Error('useGroup must be used within <GroupProvider>')
  return ctx
}
