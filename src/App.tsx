import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { LoadingSkeleton } from '@/components/cards/LoadingSkeleton'
import { AppShell } from '@/components/layout/AppShell'
import { PersistentTabLayout } from '@/components/layout/PersistentTabLayout'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { PropertyProvider } from '@/context/PropertyContext'
import { RefreshProvider } from '@/context/RefreshContext'
import { NotificationProvider } from '@/context/NotificationContext'
import { ROUTES } from '@/constants'

const AdminPage = lazy(() => import('@/pages/Admin'))
const AccountPage = lazy(() => import('@/pages/Account'))
const SettingsPage = lazy(() => import('@/pages/Settings'))

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
          <RefreshProvider>
            <NotificationProvider>
              <Routes>
                <Route element={<AppShell />}>
                  <Route
                    path={ROUTES.admin}
                    element={
                      <LazyPage>
                        <AdminPage />
                      </LazyPage>
                    }
                  />
                  <Route
                    path={ROUTES.account}
                    element={
                      <LazyPage>
                        <AccountPage />
                      </LazyPage>
                    }
                  />
                  <Route
                    path={ROUTES.settings}
                    element={
                      <LazyPage>
                        <SettingsPage />
                      </LazyPage>
                    }
                  />
                  <Route path="*" element={<PersistentTabLayout />} />
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
          </RefreshProvider>
        </BrowserRouter>
      </PropertyProvider>
    </ThemeProvider>
  )
}
