/** Dashboard feature — public surface. */
export { OverviewPage } from './OverviewPage'
// The enriched-ledger fetch is shared with History (both are read-views of the ledger).
export { fetchDashboardData, type DashboardData } from './api'
export type { EnrichedExpense } from './summarize'
