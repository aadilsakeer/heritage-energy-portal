import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionTitleProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function SectionTitle({
  title,
  description,
  action,
  className,
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        'mb-4 flex items-end justify-between gap-4 sm:mb-5',
        className,
      )}
    >
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}
