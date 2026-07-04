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
        'flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-card/70 px-6 py-16 text-center shadow-soft backdrop-blur-xl sm:px-8',
        className,
      )}
    >
      <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-muted/80 text-muted-foreground">
        {branded ? (
          <BrandMark className="h-14 w-14 rounded-3xl p-2 opacity-70" />
        ) : (
          <Icon className="h-7 w-7" aria-hidden="true" />
        )}
      </span>
      <h3 className="text-subtitle">{title}</h3>
      {description ? (
        <p className="text-body mt-3 max-w-md text-muted-foreground">{description}</p>
      ) : null}
      {actionLabel && onAction ? (
        <Button type="button" className="mt-8 min-h-12 px-6" size="lg" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </motion.div>
  )
}
