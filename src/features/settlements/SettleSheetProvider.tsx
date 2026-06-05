import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { SettleUpSheet } from './SettleUpSheet'
import { SettleSheetContext, type SettleSheetValue, type SettleTarget } from './settle-sheet-context'

/** Renders the settle-up sheet once and exposes openSettle to the app. */
export function SettleSheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState<SettleTarget | null>(null)
  const onSavedRef = useRef<(() => void) | undefined>(undefined)

  const openSettle = useCallback((t: SettleTarget, onSaved?: () => void) => {
    onSavedRef.current = onSaved
    setTarget(t)
    setOpen(true)
  }, [])

  const value = useMemo<SettleSheetValue>(() => ({ openSettle }), [openSettle])

  return (
    <SettleSheetContext.Provider value={value}>
      {children}
      <SettleUpSheet
        open={open}
        target={target}
        onClose={() => setOpen(false)}
        onSaved={() => onSavedRef.current?.()}
      />
    </SettleSheetContext.Provider>
  )
}
