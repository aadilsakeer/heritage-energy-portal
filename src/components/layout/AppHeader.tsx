import { Moon, Settings, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { Button } from '@/components/ui/button'
import { PropertySwitcher } from '@/components/layout/PropertySwitcher'
import { InstallPrompt } from '@/components/layout/InstallPrompt'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'

export function AppHeader() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <BrandLogo />

          <div className="flex items-center gap-2">
            <InstallPrompt />
            <NotificationCenter />
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="rounded-2xl"
              aria-label="Open admin"
            >
              <Link to={ROUTES.admin}>
                <Settings className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="relative rounded-2xl"
            >
              <Sun
                className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
                aria-hidden="true"
              />
              <Moon
                className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
                aria-hidden="true"
              />
            </Button>
          </div>
        </div>

        <PropertySwitcher />
      </div>
    </header>
  )
}
