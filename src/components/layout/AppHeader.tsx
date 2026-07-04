import { Leaf, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Link } from 'react-router-dom'
import { APP_NAME, ROUTES } from '@/constants'
import { Button } from '@/components/ui/button'
import { PropertySwitcher } from '@/components/layout/PropertySwitcher'

export function AppHeader() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">

        <div className="flex items-center justify-between gap-3">
          <Link
            to={ROUTES.home}
            className="flex items-center gap-2.5 rounded-2xl transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={`${APP_NAME} home`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
              <Leaf className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight text-foreground">
                {APP_NAME}
              </p>
              <p className="hidden text-[11px] text-muted-foreground sm:block">
                Energy Portal
              </p>
            </div>
          </Link>

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

        <PropertySwitcher />
      </div>
    </header>
  )
}
