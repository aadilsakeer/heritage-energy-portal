import { Outlet, useLocation, matchPath } from 'react-router-dom'
import { AppHeader } from '@/components/layout/AppHeader'
import { BottomNavigation } from '@/components/layout/BottomNavigation'
import { ROUTES } from '@/constants'

export function AppShell() {
  const location = useLocation()
  const hideNav =
    Boolean(matchPath({ path: ROUTES.admin }, location.pathname)) ||
    Boolean(matchPath({ path: ROUTES.settings }, location.pathname))

  return (
    <div className="relative min-h-svh overflow-x-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_68%)]"
        aria-hidden="true"
      />

      <AppHeader />
      <div className="overflow-x-hidden">
        <Outlet />
      </div>
      {!hideNav ? <BottomNavigation /> : null}
    </div>
  )
}
