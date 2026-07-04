import { AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Unable to load',
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <motion.div
      {...fadeUp}
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-3xl border border-destructive/20 bg-card/60 px-6 py-14 text-center shadow-soft backdrop-blur-xl',
        className,
      )}
    >
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-destructive/10 text-destructive">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="text-base font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button type="button" className="mt-6" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </motion.div>
  )
}
