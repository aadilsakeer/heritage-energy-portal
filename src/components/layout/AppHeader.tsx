import { memo } from 'react'
import { LayoutDashboard, Moon, Settings, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { Button } from '@/components/ui/button'
import { PropertySwitcher } from '@/components/layout/PropertySwitcher'
import { InstallPrompt } from '@/components/layout/InstallPrompt'
import { GlobalSearch } from '@/components/layout/GlobalSearch'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { usePropertyLabel } from '@/context/PropertyContext'

export const AppHeader = memo(function AppHeader() {
  const { resolvedTheme, setTheme } = useTheme()
  const propertyLabel = usePropertyLabel()
  const isDark = resolvedTheme === 'dark'

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/90 backdrop-blur-xl safe-area-top">
      <div className="mx-auto w-full max-w-6xl safe-area-x py-4 sm:py-5 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <BrandLogo
            variant="full"
            subtitle={propertyLabel}
            className="min-w-0 flex-1"
          />

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
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="touch-target hidden rounded-2xl sm:inline-flex"
              aria-label="Open admin dashboard"
            >
              <Link to={ROUTES.admin}>
                <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
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
