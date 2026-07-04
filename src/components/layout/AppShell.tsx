import { Outlet, useLocation, matchPath } from 'react-router-dom'
import { AppHeader } from '@/components/layout/AppHeader'
import { BottomNavigation } from '@/components/layout/BottomNavigation'
import { ROUTES } from '@/constants'

export function AppShell() {
  const location = useLocation()
  const onAdmin = Boolean(matchPath({ path: ROUTES.admin }, location.pathname))

  return (
    <div className="relative min-h-svh overflow-x-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,oklch(0.72_0.11_155/0.14),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top,oklch(0.48_0.11_155/0.2),transparent_70%)]"
        aria-hidden="true"
      />

      <AppHeader />
      <div className="overflow-x-hidden">
        <Outlet />
      </div>
      {!onAdmin ? <BottomNavigation /> : null}
    </div>
  )
}
