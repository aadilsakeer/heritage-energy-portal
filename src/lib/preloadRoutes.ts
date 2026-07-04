import { ROUTES } from '@/constants'

let preloaded = false

/** Preload main tab route chunks during idle time after first paint. */
export function preloadTabRoutes(): void {
  if (preloaded) return
  preloaded = true

  const load = () => {
    void import('@/pages/Home')
    void import('@/pages/Bill')
    void import('@/pages/Analytics')
    void import('@/pages/History')
  }

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(load, { timeout: 2500 })
  } else {
    window.setTimeout(load, 800)
  }
}

export function preloadAdminRoute(): void {
  void import('@/pages/Admin')
}

export function preloadAdjacentTab(currentPath: string): void {
  const tabs = [ROUTES.home, ROUTES.bill, ROUTES.analytics, ROUTES.history]
  const index = tabs.findIndex(
    (tab) => currentPath === tab || currentPath.startsWith(`${tab}/`),
  )
  if (index < 0) return

  const adjacent = [tabs[index - 1], tabs[index + 1]].filter(Boolean)
  for (const path of adjacent) {
    if (path === ROUTES.home) void import('@/pages/Home')
    if (path === ROUTES.bill) void import('@/pages/Bill')
    if (path === ROUTES.analytics) void import('@/pages/Analytics')
    if (path === ROUTES.history) void import('@/pages/History')
  }
}
