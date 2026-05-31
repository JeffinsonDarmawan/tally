import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './layouts/AppShell'
import { OverviewPage } from '@/features/dashboard'
import { HistoryPage } from '@/features/history'
import { RecurringPage } from '@/features/recurring'
import { SummaryPage } from '@/features/summary'
import { SettingsPage } from '@/features/settings'
import { NotFoundPage } from '@/features/misc'

/**
 * App routes. v1 has a single group; these are the top-level tabs plus settings.
 * Feature pages are placeholders/previews until their phase lands (see ROADMAP).
 */
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<OverviewPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="recurring" element={<RecurringPage />} />
          <Route path="summary" element={<SummaryPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
