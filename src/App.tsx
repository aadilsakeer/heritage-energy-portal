import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { LoadingSkeleton } from '@/components/cards/LoadingSkeleton'
import { AppShell } from '@/components/layout/AppShell'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { PropertyProvider } from '@/context/PropertyContext'
import { ROUTES } from '@/constants'

const HomePage = lazy(() => import('@/pages/Home'))
const BillPage = lazy(() => import('@/pages/Bill'))
const HistoryPage = lazy(() => import('@/pages/History'))
const AnalyticsPage = lazy(() => import('@/pages/Analytics'))
const AdminPage = lazy(() => import('@/pages/Admin'))

export default function App() {
  return (
    <ThemeProvider>
      <PropertyProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route
                path={ROUTES.home}
                element={
                  <Suspense fallback={<LoadingSkeleton variant="page" />}>
                    <HomePage />
                  </Suspense>
                }
              />
              <Route
                path={ROUTES.bill}
                element={
                  <Suspense fallback={<LoadingSkeleton variant="page" />}>
                    <BillPage />
                  </Suspense>
                }
              />
              <Route
                path={`${ROUTES.bill}/:billId`}
                element={
                  <Suspense fallback={<LoadingSkeleton variant="page" />}>
                    <BillPage />
                  </Suspense>
                }
              />
              <Route
                path={ROUTES.history}
                element={
                  <Suspense fallback={<LoadingSkeleton variant="page" />}>
                    <HistoryPage />
                  </Suspense>
                }
              />
              <Route
                path={ROUTES.analytics}
                element={
                  <Suspense fallback={<LoadingSkeleton variant="page" />}>
                    <AnalyticsPage />
                  </Suspense>
                }
              />
              <Route
                path={ROUTES.admin}
                element={
                  <Suspense fallback={<LoadingSkeleton variant="page" />}>
                    <AdminPage />
                  </Suspense>
                }
              />
              <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
            </Route>
          </Routes>
          <Toaster
            position="top-center"
            toastOptions={{
              className:
                'rounded-2xl border border-border bg-card text-card-foreground shadow-soft',
            }}
          />
        </BrowserRouter>
      </PropertyProvider>
    </ThemeProvider>
  )
}
