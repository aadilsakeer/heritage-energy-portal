import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/layout/BrandLogo'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: LucideIcon
  branded?: boolean
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  branded = false,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      {...fadeUp}
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/80 px-6 py-16 text-center sm:px-10 sm:py-20',
        className,
      )}
    >
      <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/90 text-muted-foreground ring-1 ring-border/50">
        {branded ? (
          <BrandMark className="h-14 w-14 rounded-2xl p-2 opacity-80" />
        ) : (
          <Icon className="h-7 w-7" strokeWidth={1.75} aria-hidden="true" />
        )}
      </span>
      <h3 className="text-heading">{title}</h3>
      {description ? (
        <p className="text-body mt-3 max-w-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          type="button"
          className="mt-8"
          size="lg"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      ) : null}
    </motion.div>
  )
}
