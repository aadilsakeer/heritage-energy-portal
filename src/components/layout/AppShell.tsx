import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AppHeader } from '@/components/layout/AppHeader'
import { BottomNavigation } from '@/components/layout/BottomNavigation'

export function AppShell() {
  const location = useLocation()

  return (
    <div className="relative min-h-svh overflow-x-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,oklch(0.72_0.11_155/0.14),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top,oklch(0.48_0.11_155/0.2),transparent_70%)]"
        aria-hidden="true"
      />

      <AppHeader />
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-x-hidden"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
      <BottomNavigation />
    </div>
  )
}
