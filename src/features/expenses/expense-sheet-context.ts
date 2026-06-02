import { createContext } from 'react'

export interface ExpenseSheetValue {
  /** Open the sheet to add a new expense. `onSaved` fires after a successful save. */
  openAdd: (onSaved?: () => void) => void
  /** Open the sheet to edit an existing expense. */
  openEdit: (expenseId: string, onSaved?: () => void) => void
}

export const ExpenseSheetContext = createContext<ExpenseSheetValue | null>(null)
