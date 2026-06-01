import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '@/features/auth'
import type { Group, Profile } from '@/types/database.types'
import { fetchMyGroup, fetchMyProfile, fetchProfiles } from './api'
import { GroupContext, type GroupContextValue, type GroupStatus } from './group-context'

/** Loads the current user's profile, group, and members once authenticated. */
export function GroupProvider({ children }: { children: ReactNode }) {
  const { status: authStatus, user } = useAuth()
  const [status, setStatus] = useState<GroupStatus>('loading')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Profile[]>([])
  const [error, setError] = useState<string | null>(null)
  const reqId = useRef(0)

  const load = useCallback(async () => {
    if (!user) return
    const ticket = ++reqId.current
    setError(null)
    try {
      const profileRow = await fetchMyProfile(user.id)
      const myGroup = await fetchMyGroup(user.id)
      if (ticket !== reqId.current) return // a newer load superseded this one

      setProfile(profileRow)
      if (!myGroup) {
        setGroup(null)
        setMembers([])
        setStatus('no-group')
        return
      }
      const memberProfiles = await fetchProfiles(myGroup.memberIds)
      if (ticket !== reqId.current) return
      setGroup(myGroup.group)
      setMembers(memberProfiles)
      setStatus('ready')
    } catch (err) {
      if (ticket !== reqId.current) return
      setError(err instanceof Error ? err.message : 'Failed to load your group.')
      setStatus('error')
    }
  }, [user])

  useEffect(() => {
    if (authStatus === 'authenticated' && user) {
      setStatus('loading')
      void load()
    } else if (authStatus === 'unauthenticated') {
      reqId.current++
      setProfile(null)
      setGroup(null)
      setMembers([])
      setStatus('loading')
    }
  }, [authStatus, user, load])

  const value = useMemo<GroupContextValue>(() => {
    const membersById: Record<string, Profile> = {}
    for (const m of members) membersById[m.id] = m
    return { status, profile, group, members, membersById, error, refresh: load }
  }, [status, profile, group, members, error, load])

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
}
