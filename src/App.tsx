import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { ROUTES } from '@/constants'
import { AdminPage } from '@/pages/Admin'
import { AnalyticsPage } from '@/pages/Analytics'
import { BillPage } from '@/pages/Bill'
import { HistoryPage } from '@/pages/History'
import { HomePage } from '@/pages/Home'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path={ROUTES.home} element={<HomePage />} />
            <Route path={ROUTES.bill} element={<BillPage />} />
            <Route path={ROUTES.history} element={<HistoryPage />} />
            <Route path={ROUTES.analytics} element={<AnalyticsPage />} />
            <Route path={ROUTES.admin} element={<AdminPage />} />
            <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
