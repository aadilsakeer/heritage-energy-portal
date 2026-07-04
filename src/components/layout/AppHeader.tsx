import { Moon, Settings, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { Button } from '@/components/ui/button'
import { PropertySwitcher } from '@/components/layout/PropertySwitcher'
import { InstallPrompt } from '@/components/layout/InstallPrompt'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { useProperty } from '@/context/PropertyContext'

export function AppHeader() {
  const { resolvedTheme, setTheme } = useTheme()
  const { property } = useProperty()
  const isDark = resolvedTheme === 'dark'

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-2xl">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="flex items-start justify-between gap-4">
          <BrandLogo
            variant="full"
            subtitle={property?.label}
            className="min-w-0 flex-1"
          />

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <InstallPrompt />
            <NotificationCenter />
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="touch-target rounded-2xl"
              aria-label="Open admin settings"
            >
              <Link to={ROUTES.admin}>
                <Settings className="h-[18px] w-[18px]" aria-hidden="true" />
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
                className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
                aria-hidden="true"
              />
              <Moon
                className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
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
}
