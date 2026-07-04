import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { LoadingSkeleton } from '@/components/cards/LoadingSkeleton'
import { AppShell } from '@/components/layout/AppShell'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { PropertyProvider } from '@/context/PropertyContext'
import { NotificationProvider } from '@/context/NotificationContext'
import { ROUTES } from '@/constants'

const HomePage = lazy(() => import('@/pages/Home'))
const BillPage = lazy(() => import('@/pages/Bill'))
const HistoryPage = lazy(() => import('@/pages/History'))
const AnalyticsPage = lazy(() => import('@/pages/Analytics'))
const AdminPage = lazy(() => import('@/pages/Admin'))

function LazyPage({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingSkeleton variant="page" />}>{children}</Suspense>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <PropertyProvider>
        <BrowserRouter>
        <NotificationProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route
                path={ROUTES.home}
                element={
                  <LazyPage>
                    <HomePage />
                  </LazyPage>
                }
              />
              <Route
                path={ROUTES.bill}
                element={
                  <LazyPage>
                    <BillPage />
                  </LazyPage>
                }
              />
              <Route
                path={`${ROUTES.bill}/:billId`}
                element={
                  <LazyPage>
                    <BillPage />
                  </LazyPage>
                }
              />
              <Route
                path={ROUTES.history}
                element={
                  <LazyPage>
                    <HistoryPage />
                  </LazyPage>
                }
              />
              <Route
                path={ROUTES.analytics}
                element={
                  <LazyPage>
                    <AnalyticsPage />
                  </LazyPage>
                }
              />
              <Route
                path={ROUTES.admin}
                element={
                  <LazyPage>
                    <AdminPage />
                  </LazyPage>
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
        </NotificationProvider>
        </BrowserRouter>
      </PropertyProvider>
    </ThemeProvider>
  )
}
