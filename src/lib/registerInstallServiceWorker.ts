/** Register a minimal install-only service worker. No fetch interception or caching. */
let registered = false

export async function registerInstallServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator) || registered) return
  registered = true

  if ('caches' in window) {
    try {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
    } catch {
      // ignore cache cleanup failures
    }
  }

  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  } catch {
    // Install prompt may still work via manifest on some platforms.
  }
}
