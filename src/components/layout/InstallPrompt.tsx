import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIos(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  )
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const showIosHint = !isStandalone() && isIos()

  useEffect(() => {
    if (isStandalone() || isIos()) return

    const handler = (event: Event) => {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (isStandalone() || dismissed) return null

  if (showIosHint) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="hidden rounded-2xl sm:inline-flex"
        onClick={() => setDismissed(true)}
        aria-label="Install app hint"
        title="Tap Share, then Add to Home Screen"
      >
        <Download className="h-4 w-4" />
        Install
      </Button>
    )
  }

  if (!deferred) return null

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="rounded-2xl"
      onClick={() => {
        void deferred.prompt().then(() => {
          setDeferred(null)
          setDismissed(true)
        })
      }}
      aria-label="Install Heritage Solar app"
    >
      <Download className="h-4 w-4" />
      Install
    </Button>
  )
}
