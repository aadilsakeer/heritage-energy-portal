/** Register a minimal install-only service worker. No fetch interception or caching. */
export async function registerInstallServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return

  if ('caches' in window) {
    const keys = await caches.keys()
    await Promise.all(keys.map((key) => caches.delete(key)))
  }

  window.addEventListener('load', () => {
    void navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch(() => {
        // Install prompt may still work via manifest on some platforms.
      })
  })
}
