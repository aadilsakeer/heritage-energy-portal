import { memo } from 'react'
import { LayoutDashboard, LogOut, Moon, Settings, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Link, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PropertySwitcher } from '@/components/layout/PropertySwitcher'
import { InstallPrompt } from '@/components/layout/InstallPrompt'
import { GlobalSearch } from '@/components/layout/GlobalSearch'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { usePropertyLabel } from '@/context/PropertyContext'

export const AppHeader = memo(function AppHeader() {
  const { resolvedTheme, setTheme } = useTheme()
  const propertyLabel = usePropertyLabel()
  const { pathname } = useLocation()
  const isDark = resolvedTheme === 'dark'
  const isAdmin =
    pathname === ROUTES.admin || pathname.startsWith(`${ROUTES.admin}/`)

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/90 backdrop-blur-xl safe-area-top">
      <div className="mx-auto w-full max-w-6xl safe-area-x py-4 sm:py-5 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <BrandLogo
              variant="full"
              subtitle={propertyLabel}
              className="min-w-0"
            />
            {isAdmin ? (
              <Badge
                variant="accent"
                className="shrink-0"
                title="You are in Admin mode"
              >
                Admin
              </Badge>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <div className="mr-1 hidden md:block">
              <GlobalSearch />
            </div>
            <InstallPrompt />
            <NotificationCenter />
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="touch-target rounded-2xl"
              aria-label="Open settings"
            >
              <Link to={ROUTES.settings}>
                <Settings className="h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>

            {isAdmin ? (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="touch-target rounded-2xl px-2.5 sm:px-3.5"
                aria-label="Exit admin"
                title="Exit Admin"
              >
                <Link to={ROUTES.home}>
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Exit Admin</span>
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                variant="ghost"
                className="touch-target rounded-2xl px-2.5 sm:h-12 sm:px-3.5"
                aria-label="Open admin"
                title="Admin"
              >
                <Link to={ROUTES.admin}>
                  <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="touch-target relative rounded-2xl"
            >
              <Sun
                className="h-5 w-5 rotate-0 scale-100 transition-all duration-200 dark:-rotate-90 dark:scale-0"
                aria-hidden="true"
              />
              <Moon
                className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-200 dark:rotate-0 dark:scale-100"
                aria-hidden="true"
              />
            </Button>
          </div>
        </div>

        <div className="mt-4 md:hidden">
          <GlobalSearch className="max-w-none" />
        </div>

        <div className="mt-5">
          <PropertySwitcher />
        </div>
      </div>
    </header>
  )
})
