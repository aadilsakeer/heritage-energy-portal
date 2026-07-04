import { useEffect } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function BottomSheet({
  open,
  title,
  description,
  onClose,
  children,
  className,
}: BottomSheetProps) {
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className={cn(
              'relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border/60 bg-card shadow-soft sm:rounded-3xl',
              className,
            )}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border/40 bg-card/95 px-5 py-4 backdrop-blur-xl">
              <div>
                <h2 id="sheet-title" className="text-lg font-semibold">
                  {title}
                </h2>
                {description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-2xl"
                onClick={onClose}
                aria-label="Close sheet"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
