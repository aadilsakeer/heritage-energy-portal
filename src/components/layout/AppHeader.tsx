import { Moon, Sun, Leaf } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Link } from 'react-router-dom'
import { APP_NAME, ROUTES } from '@/constants'
import { Button } from '@/components/ui/button'

export function AppHeader() {
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
        <Link
          to={ROUTES.home}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
            <Leaf className="h-4 w-4" strokeWidth={2.25} />

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
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="relative rounded-2xl"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

      </div>
    </header>
  )
}
