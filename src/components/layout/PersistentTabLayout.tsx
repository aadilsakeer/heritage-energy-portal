import { lazy, Suspense, type ComponentType, useEffect, useRef, useState } from 'react'
import { matchPath, useLocation } from 'react-router-dom'
import { LoadingSkeleton } from '@/components/cards/LoadingSkeleton'
import { ROUTES } from '@/constants'
import { preloadAdjacentTab, preloadTabRoutes } from '@/lib/preloadRoutes'

const HomePage = lazy(() => import('@/pages/Home'))
const BillPage = lazy(() => import('@/pages/Bill'))
const AnalyticsPage = lazy(() => import('@/pages/Analytics'))
const HistoryPage = lazy(() => import('@/pages/History'))

type TabId = 'home' | 'bill' | 'analytics' | 'history'

const tabPages: Record<TabId, ComponentType> = {
  home: HomePage,
  bill: BillPage,
  analytics: AnalyticsPage,
  history: HistoryPage,
}

function resolveTab(pathname: string): TabId {
  if (matchPath({ path: `${ROUTES.bill}/*` }, pathname)) return 'bill'
  if (matchPath({ path: ROUTES.analytics }, pathname)) return 'analytics'
  if (matchPath({ path: ROUTES.history }, pathname)) return 'history'
  return 'home'
}

function TabFallback({ active }: { active: boolean }) {
  if (!active) return null
  return <LoadingSkeleton variant="page" />
}

export function PersistentTabLayout() {
  const location = useLocation()
  const activeTab = resolveTab(location.pathname)
  const [mountedTabs, setMountedTabs] = useState<Set<TabId>>(() => new Set([activeTab]))
  const scrollPositions = useRef<Partial<Record<TabId, number>>>({})
  const previousTab = useRef(activeTab)

  useEffect(() => {
    preloadTabRoutes()
  }, [])

  useEffect(() => {
    preloadAdjacentTab(location.pathname)
  }, [location.pathname])

  useEffect(() => {
    scrollPositions.current[previousTab.current] = window.scrollY
    previousTab.current = activeTab

    const frame = window.requestAnimationFrame(() => {
      setMountedTabs((current) => {
        if (current.has(activeTab)) return current
        const next = new Set(current)
        next.add(activeTab)
        return next
      })
      window.scrollTo({ top: scrollPositions.current[activeTab] ?? 0, left: 0, behavior: 'instant' })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [activeTab])

  return (
    <>
      {Array.from(mountedTabs).map((tabId) => {
        const Page = tabPages[tabId]
        const isActive = tabId === activeTab

        return (
          <div
            key={tabId}
            hidden={!isActive}
            aria-hidden={!isActive}
            className={isActive ? undefined : 'hidden'}
          >
            <Suspense fallback={<TabFallback active={isActive} />}>
              <Page />
            </Suspense>
          </div>
        )
      })}
    </>
  )
}
