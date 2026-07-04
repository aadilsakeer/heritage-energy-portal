/** Remove any previously registered service workers and caches (PWA removed in v1.5.1). */
export async function unregisterServiceWorkers(): Promise<void> {
  if (!('serviceWorker' in navigator)) return

  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map((registration) => registration.unregister()))

  if ('caches' in window) {
    const keys = await caches.keys()
    await Promise.all(keys.map((key) => caches.delete(key)))
  }
}
