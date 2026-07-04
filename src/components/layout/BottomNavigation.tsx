import { BarChart3, FileText, History, Home } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ROUTES } from '@/constants'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Home', path: ROUTES.home, icon: Home },
  { label: 'Bill', path: ROUTES.bill, icon: FileText },
  { label: 'Analytics', path: ROUTES.analytics, icon: BarChart3 },
  { label: 'History', path: ROUTES.history, icon: History },
] as const

export function BottomNavigation() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/50 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] max-w-lg items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === ROUTES.home}
            className={({ isActive }) =>
              cn(
                'relative flex min-w-[4.5rem] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-medium transition-colors',
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
                    className="absolute inset-0 rounded-2xl bg-primary/10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                ) : null}
                <Icon
                  className="relative z-10 h-5 w-5"
                  strokeWidth={isActive ? 2.4 : 2}
                />
                <span className="relative z-10">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
