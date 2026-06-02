import { useContext } from 'react'
import { ExpenseSheetContext, type ExpenseSheetValue } from './expense-sheet-context'

/** Open the Add/Edit-Expense sheet from anywhere. Must be used within <ExpenseSheetProvider>. */
export function useExpenseSheet(): ExpenseSheetValue {
  const ctx = useContext(ExpenseSheetContext)
  if (!ctx) throw new Error('useExpenseSheet must be used within <ExpenseSheetProvider>')
  return ctx
}
