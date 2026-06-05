import { createContext } from 'react'

export interface SettleTarget {
  friendId: string
  /** net(me, friend): > 0 I owe ; < 0 they owe. */
  netCents: number
  daysUnpaid: number | null
}

export interface SettleSheetValue {
  openSettle: (target: SettleTarget, onSaved?: () => void) => void
}

export const SettleSheetContext = createContext<SettleSheetValue | null>(null)
