import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
  as?: 'h1' | 'h2' | 'h3'
}

export function SectionHeader({
  title,
  description,
  action,
  className,
  as: Tag = 'h2',
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'mb-4 flex items-end justify-between gap-4 sm:mb-6',
        className,
      )}
    >
      <div className="min-w-0 space-y-1.5">
        <Tag className="text-title">{title}</Tag>
        {description ? (
          <p className="text-caption">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}
