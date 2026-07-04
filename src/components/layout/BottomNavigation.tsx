import { memo } from 'react'
import { BarChart3, FileText, History, Home } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ROUTES } from '@/constants'
import { springSegment } from '@/lib/motion'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Home', path: ROUTES.home, icon: Home },
  { label: 'Bill', path: ROUTES.bill, icon: FileText },
  { label: 'Analytics', path: ROUTES.analytics, icon: BarChart3 },
  { label: 'History', path: ROUTES.history, icon: History },
] as const

export const BottomNavigation = memo(function BottomNavigation() {
  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/40 bg-background/95 safe-area-bottom"
      style={{
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <div className="mx-auto flex min-h-[var(--nav-height)] max-w-lg items-stretch justify-around px-2 pt-1">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === ROUTES.home}
            aria-label={label}
            className={({ isActive }) =>
              cn(
                'android-ripple relative flex min-h-12 min-w-[4.5rem] flex-1 flex-col items-center justify-center gap-1 rounded-[16px] px-2 py-2 text-[11px] font-semibold transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-x-1 inset-y-1 rounded-[14px] bg-primary/12 shadow-soft"
                    transition={springSegment}
                    aria-hidden="true"
                  />
                ) : null}
                <Icon
                  className="relative z-10 h-6 w-6"
                  strokeWidth={isActive ? 2.5 : 2}
                  aria-hidden="true"
                />
                <span className="relative z-10 leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
})
