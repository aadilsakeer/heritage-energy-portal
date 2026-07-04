import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  )

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (!deferred) return null

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="rounded-2xl"
      aria-label="Install Heritage Solar"
      onClick={() => {
        void deferred.prompt().then(async () => {
          await deferred.userChoice
          setDeferred(null)
        })
      }}
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      Install
    </Button>
  )
}
