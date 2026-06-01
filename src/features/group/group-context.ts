import { createContext } from 'react'
import type { Group, Profile } from '@/types/database.types'

export type GroupStatus = 'loading' | 'no-group' | 'ready' | 'error'

export interface GroupContextValue {
  status: GroupStatus
  /** The signed-in user's own profile. */
  profile: Profile | null
  /** The active group (v1 has exactly one). */
  group: Group | null
  /** All member profiles in the group, including the current user. */
  members: Profile[]
  /** Member profiles keyed by id, for quick lookup. */
  membersById: Record<string, Profile>
  error: string | null
  /** Re-fetch profile + group + members. */
  refresh: () => Promise<void>
}

export const GroupContext = createContext<GroupContextValue | null>(null)
