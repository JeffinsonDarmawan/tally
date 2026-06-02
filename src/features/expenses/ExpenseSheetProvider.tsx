import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { AddExpenseSheet } from './AddExpenseSheet'
import { ExpenseSheetContext, type ExpenseSheetValue } from './expense-sheet-context'

/** Renders the Add/Edit-Expense sheet once and exposes openAdd/openEdit to the app. */
export function ExpenseSheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const onSavedRef = useRef<(() => void) | undefined>(undefined)

  const openAdd = useCallback((onSaved?: () => void) => {
    onSavedRef.current = onSaved
    setEditId(null)
    setOpen(true)
  }, [])

  const openEdit = useCallback((expenseId: string, onSaved?: () => void) => {
    onSavedRef.current = onSaved
    setEditId(expenseId)
    setOpen(true)
  }, [])

  const value = useMemo<ExpenseSheetValue>(() => ({ openAdd, openEdit }), [openAdd, openEdit])

  return (
    <ExpenseSheetContext.Provider value={value}>
      {children}
      <AddExpenseSheet
        open={open}
        editId={editId}
        onClose={() => setOpen(false)}
        onSaved={() => onSavedRef.current?.()}
      />
    </ExpenseSheetContext.Provider>
  )
}
