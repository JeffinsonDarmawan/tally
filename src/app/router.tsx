import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { IconLoader2 } from '@tabler/icons-react'
import { AppShell } from './layouts/AppShell'
import { OverviewPage } from '@/features/dashboard'
import { HistoryPage } from '@/features/history'
import { RecurringPage } from '@/features/recurring'
import { SettingsPage } from '@/features/settings'
import { NotFoundPage } from '@/features/misc'

// Summary pulls in Recharts + jsPDF — load it on demand to keep the initial bundle small.
const SummaryPage = lazy(() => import('@/features/summary').then((m) => ({ default: m.SummaryPage })))

function RouteFallback() {
  return (
    <div className="grid place-items-center py-24 text-faint">
      <IconLoader2 className="size-6 animate-spin" stroke={2} />
    </div>
  )
}

/**
 * Authenticated app routes (rendered once the user is signed in and in a group).
 * v1 has a single group; these are the top-level tabs plus settings.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<OverviewPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="recurring" element={<RecurringPage />} />
        <Route
          path="summary"
          element={
            <Suspense fallback={<RouteFallback />}>
              <SummaryPage />
            </Suspense>
          }
        />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  )
}
