import { memo } from 'react'
import { Moon, Settings, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { Button } from '@/components/ui/button'
import { PropertySwitcher } from '@/components/layout/PropertySwitcher'
import { InstallPrompt } from '@/components/layout/InstallPrompt'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { usePropertyLabel } from '@/context/PropertyContext'

export const AppHeader = memo(function AppHeader() {
  const { resolvedTheme, setTheme } = useTheme()
  const propertyLabel = usePropertyLabel()
  const isDark = resolvedTheme === 'dark'

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/95 safe-area-top">
      <div className="mx-auto w-full max-w-6xl safe-area-x py-3 sm:py-4 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <BrandLogo
            variant="full"
            subtitle={propertyLabel}
            className="min-w-0 flex-1"
          />

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <InstallPrompt />
            <NotificationCenter />
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="touch-target rounded-[16px]"
              aria-label="Open admin settings"
            >
              <Link to={ROUTES.admin}>
                <Settings className="h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="touch-target relative rounded-[16px]"
            >
              <Sun
                className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
                aria-hidden="true"
              />
              <Moon
                className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
                aria-hidden="true"
              />
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <PropertySwitcher />
        </div>
      </div>
    </header>
  )
})
