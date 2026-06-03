import { useContext } from 'react'
import { SettleSheetContext, type SettleSheetValue } from './settle-sheet-context'

/** Open the settle-up sheet for a friend. Must be used within <SettleSheetProvider>. */
export function useSettleSheet(): SettleSheetValue {
  const ctx = useContext(SettleSheetContext)
  if (!ctx) throw new Error('useSettleSheet must be used within <SettleSheetProvider>')
  return ctx
}
