/**
 * Install-only service worker for Heritage Solar PWA (v2.0).
 * No fetch handler — all network requests bypass the SW and stay fresh.
 */
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      if ('caches' in self) {
        const keys = await caches.keys()
        await Promise.all(keys.map((key) => caches.delete(key)))
      }
      await self.clients.claim()
    })(),
  )
})
