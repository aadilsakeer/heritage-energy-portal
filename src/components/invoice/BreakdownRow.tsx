import { cn } from '@/lib/utils'

interface BreakdownRowProps {
  label: string
  value: string
  emphasize?: boolean
  muted?: boolean
  className?: string
}

export function BreakdownRow({
  label,
  value,
  emphasize = false,
  muted = false,
  className,
}: BreakdownRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 py-3',
        emphasize && 'border-t border-border pt-4',
        className,
      )}
    >
      <span
        className={cn(
          'text-sm',
          muted ? 'text-muted-foreground' : 'text-foreground',
          emphasize && 'text-base font-semibold',
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'text-sm font-medium tabular-nums',
          emphasize ? 'text-lg font-semibold text-primary' : 'text-foreground',
          muted && 'text-muted-foreground',
        )}
      >
        {value}
      </span>
    </div>
  )
}
